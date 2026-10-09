import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const ROOT = new URL('../', import.meta.url);
const REPO = 'HoraceCh/Model-Routing-Registry';
const API = `https://api.github.com/repos/${REPO}`;
const LEVELS = { L1: ['fast', 'low'], L2: ['fast', 'medium'], L3: ['standard', 'medium'], L4: ['deep', 'high'] };
const SHA40 = /^[a-f0-9]{40}$/;
const SHA64 = /^[a-f0-9]{64}$/;
const REVISION = /^mra-r\d{6}$/;
const APPROVAL_REF = /^https:\/\/linear\.app\/baukasten\/issue\/EO-16#comment-[0-9a-f-]{36}$/;

export class CentralIntegrityError extends Error {
  constructor(message) { super(message); this.name = 'CentralIntegrityError'; }
}
function demand(yes, reason) { if (!yes) throw new CentralIntegrityError(reason); }
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function exact(value, keys, label) {
  demand(object(value), `${label}: object required`);
  demand(JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort()), `${label}: incorrect schema keys`);
}
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export { digest };

// Matches the v1 central Registry's UTF-8 JSON canonicalization; does not hash Website metadata.
export function canonicalize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
}
export const fingerprint = payload => digest(Buffer.from(canonicalize(payload), 'utf8'));

// Parse without accepting duplicate JSON object keys (JSON.parse alone silently overwrites them).
export function parseStrictJson(raw) {
  let source;
  try { source = Buffer.isBuffer(raw) ? new TextDecoder('utf-8', { fatal: true }).decode(raw) : raw; }
  catch { throw new CentralIntegrityError('JSON: invalid UTF-8'); }
  demand(typeof source === 'string' && source.length > 0 && source.length < 1048576, 'Invalid JSON size');
  let i = 0;
  const white = () => { while (/\s/.test(source[i] ?? '')) i++; };
  const str = () => {
    demand(source[i] === '"', 'JSON: expected string');
    const start = i++;
    while (i < source.length) {
      if (source[i] === '\\') { i += 2; continue; }
      if (source[i++] === '"') {
        try { return JSON.parse(source.slice(start, i)); }
        catch { throw new CentralIntegrityError('JSON: malformed string'); }
      }
    }
    throw new CentralIntegrityError('JSON: unterminated string');
  };
  const walk = () => {
    white();
    if (source[i] === '{') {
      i++; white();
      const seen = new Set();
      if (source[i] === '}') { i++; return; }
      while (i < source.length) {
        const key = str();
        demand(!seen.has(key), `JSON: duplicate key ${key}`);
        seen.add(key); white();
        demand(source[i++] === ':', 'JSON: expected colon');
        walk(); white();
        if (source[i] === '}') { i++; return; }
        demand(source[i++] === ',', 'JSON: expected comma');
        white();
      }
      throw new CentralIntegrityError('JSON: unterminated object');
    }
    if (source[i] === '[') {
      i++; white();
      if (source[i] === ']') { i++; return; }
      while (i < source.length) {
        walk(); white();
        if (source[i] === ']') { i++; return; }
        demand(source[i++] === ',', 'JSON: expected comma');
      }
      throw new CentralIntegrityError('JSON: unterminated array');
    }
    if (source[i] === '"') { str(); return; }
    const start = i;
    while (i < source.length && !/[\s,\]}]/.test(source[i])) i++;
    demand(start < i, 'JSON: invalid primitive');
    try { JSON.parse(source.slice(start, i)); }
    catch { throw new CentralIntegrityError('JSON: invalid primitive'); }
  };
  walk(); white(); demand(i === source.length, 'JSON: trailing content');
  try { return JSON.parse(source); }
  catch { throw new CentralIntegrityError('JSON: malformed document'); }
}

export function validateRelease(release) {
  exact(release, ['registryRevision', 'predecessorRevision', 'transition', 'fingerprint', 'centralPayload'], 'release');
  demand(REVISION.test(release.registryRevision), 'Invalid release revision');
  demand(release.predecessorRevision === null || REVISION.test(release.predecessorRevision), 'Invalid predecessor');
  const tx = release.transition;
  exact(tx, tx?.kind === 'rollback' ? ['kind', 'approvalEvidence', 'restoresRevision'] : ['kind', 'approvalEvidence'], 'transition');
  demand(['baseline', 'forward', 'rollback'].includes(tx.kind) && APPROVAL_REF.test(tx.approvalEvidence), 'Invalid transition approval');
  if (tx.kind === 'rollback') demand(REVISION.test(tx.restoresRevision), 'Invalid rollback revision');
  const p = release.centralPayload;
  exact(p, ['schemaVersion', 'authority', 'status', 'qualificationEvidence', 'ordinaryLanes', 'qualifiedCandidates'], 'centralPayload');
  demand(p.schemaVersion === 1 && p.authority === 'EO-16' && p.status === 'active', 'Invalid central schema or authority');
  exact(p.qualificationEvidence, ['baselineDocument', 'candidateDecision'], 'qualificationEvidence');
  demand(typeof p.qualificationEvidence.baselineDocument === 'string' && p.qualificationEvidence.baselineDocument.length > 0 &&
    typeof p.qualificationEvidence.candidateDecision === 'string' && p.qualificationEvidence.candidateDecision.length > 0, 'Missing qualification identity');
  const laneTable = { L0:'deterministic', L1:'fast', L2:'fast', L3:'standard', L4:'deep', L5:'frontier' };
  exact(p.ordinaryLanes, Object.keys(laneTable), 'ordinaryLanes');
  for (const [lv, lane] of Object.entries(laneTable)) {
    const b = p.ordinaryLanes[lv];
    exact(b, ['lane', 'active', 'state'], lv);
    demand(b.lane === lane && b.state === (lv === 'L5' ? 'disabled' : 'active'), `Invalid ${lv} lane state`);
    if (lv === 'L0' || lv === 'L5') demand(b.active === null, `${lv} must bypass models`);
    else {
      exact(b.active, ['model', 'reasoning'], `${lv}.active`);
      demand(typeof b.active.model === 'string' && b.active.model.length > 0 &&
        ['low','medium','high','xhigh','max'].includes(b.active.reasoning), `Invalid ${lv} active binding`);
    }
  }
  exact(p.qualifiedCandidates, ['L3','L4'], 'qualifiedCandidates');
  for (const lv of ['L3', 'L4']) {
    const c = p.qualifiedCandidates[lv];
    exact(c, ['lane','model','reasoning','state','evidence'], `${lv}.candidate`);
    demand(c.lane === laneTable[lv] && typeof c.model === 'string' && c.model.length > 0 &&
      ['low','medium','high','xhigh','max'].includes(c.reasoning) &&
      ['qualified-not-active','active','deprecated'].includes(c.state) &&
      typeof c.evidence === 'string' && c.evidence.length > 0, `Invalid ${lv} candidate`);
    if (c.state === 'active') demand(c.model === p.ordinaryLanes[lv].active.model && c.reasoning === p.ordinaryLanes[lv].active.reasoning, `${lv} active candidate mismatch`);
  }
  demand(SHA64.test(release.fingerprint) && fingerprint(p) === release.fingerprint, 'centralPayload fingerprint mismatch');
  return release;
}
function validateApproval(release, approval, bytes) {
  exact(approval, ['schemaVersion','authority','decision','registryRevision','fingerprint','releaseSha256','approvalReference'], 'approval');
  demand(approval.schemaVersion === 1 && approval.authority === 'EO-16' && approval.decision === 'approved', 'Unapproved Registry revision');
  demand(approval.registryRevision === release.registryRevision && approval.fingerprint === release.fingerprint &&
    approval.approvalReference === release.transition.approvalEvidence &&
    approval.releaseSha256 === digest(bytes) && APPROVAL_REF.test(approval.approvalReference), 'Release/approval mismatch');
}
function validateLatest(latest) {
  exact(latest, ['schemaVersion','approvedRevision','fingerprint','approvalReference','tag','releaseCommitSha'], 'latest');
  demand(latest.schemaVersion === 1 && REVISION.test(latest.approvedRevision) &&
    latest.tag === latest.approvedRevision && SHA64.test(latest.fingerprint) &&
    SHA40.test(latest.releaseCommitSha) && APPROVAL_REF.test(latest.approvalReference), 'Malformed central latest pointer');
}
function readPinned() {
  return {
    releaseBytes: readFileSync(new URL('config/central-registry-r1.release.json', ROOT)),
    approvalBytes: readFileSync(new URL('config/central-registry-r1.approval.json', ROOT)),
    latestBytes: readFileSync(new URL('config/central-registry-r1.latest.json', ROOT)),
  };
}
export function projectWebsite(snapshot, payload) {
  exact(snapshot?.activeBindings, ['fast','standard','deep','frontier'], 'Website activeBindings');
  exact(snapshot?.qualifiedCandidates, ['standard','deep'], 'Website candidates');
  const got = {};
  for (const [lv, [lane, reasoning]] of Object.entries(LEVELS)) {
    const b = snapshot.activeBindings[lane];
    demand(b?.status === 'active' && Array.isArray(b.reasoning) && b.reasoning.includes(reasoning), `Website ${lv}: invalid lane`);
    got[lv] = {lane, active:{model:b.model,reasoning},state:'active'};
  }
  const p = payload.ordinaryLanes;
  const same = isDeepStrictEqual;
  for (const lv of Object.keys(got)) demand(same(got[lv],p[lv]), `Website ${lv} ordinary drift`);
  const fast = snapshot.activeBindings.fast;
  demand(same([...fast.reasoning].sort(),['low','medium']) &&
    fast.model === p.L1.active.model && fast.model === p.L2.active.model, 'Website fast lane drift');
  for (const lv of ['L3','L4']) {
    const lane = lv === 'L3' ? 'standard' : 'deep';
    demand(same(snapshot.activeBindings[lane].reasoning, [p[lv].active.reasoning]), `Website ${lane} reasoning drift`);
    const c = snapshot.qualifiedCandidates[lane], central = payload.qualifiedCandidates[lv];
    demand(c?.model === central.model && c?.reasoning === central.reasoning &&
      c?.status === central.state && c?.evidence === central.evidence, `Website ${lv} candidate drift`);
  }
  demand(snapshot.activeBindings.frontier.model === null && snapshot.activeBindings.frontier.status === 'disabled' &&
    same(snapshot.activeBindings.frontier.reasoning,[]) && p.L5.active === null && p.L5.state === 'disabled', 'Website L5 must remain disabled');
  const overlay = snapshot.websitePilotOverrides;
  exact(overlay,['project_architect:deep'],'Website overlay');
  const pilot=overlay['project_architect:deep'];
  demand(pilot.level==='L4' && pilot.status==='pilot-active' && pilot.attestationRequired===true &&
    pilot.model===snapshot.qualifiedCandidates.deep.model && pilot.reasoning===snapshot.qualifiedCandidates.deep.reasoning &&
    pilot.runtimeAttestation?.actualModel===pilot.model && pilot.runtimeAttestation?.actualReasoning===pilot.reasoning &&
    pilot.runtimeAttestation?.roleInstructionsLoaded===true &&
    snapshot.rollbackBindings?.['project_architect:deep']?.model===snapshot.activeBindings.deep.model &&
    snapshot.rollbackBindings?.['project_architect:deep']?.reasoning===p.L4.active.reasoning,
    'Website overlay is not independent of ordinary deep binding');
  // All comparisons use centralPayload ordinaryLanes/qualifiedCandidates, NOT project-local overlay metadata.
  return true;
}
export function validatePinnedWebsite({snapshot, releaseBytes, approvalBytes, latestBytes} = {}) {
  snapshot ??= parseStrictJson(readFileSync(new URL('config/codex-model-registry.snapshot.json', ROOT)));
  const pinned = readPinned();
  releaseBytes ??= pinned.releaseBytes;
  approvalBytes ??= pinned.approvalBytes;
  latestBytes ??= pinned.latestBytes;
  const rel = validateRelease(parseStrictJson(releaseBytes));
  const app = parseStrictJson(approvalBytes);
  const latest = parseStrictJson(latestBytes);
  validateApproval(rel, app, releaseBytes);
  validateLatest(latest);
  const provenance = snapshot.centralRegistry;
  exact(provenance,['schemaVersion','authority','registryRevision','fingerprint','release','websiteAdoption'], 'Website centralRegistry');
  exact(provenance.release,['repository','tag','releaseCommitSha','approvalReference','releaseSha256','approvalSha256','latestSha256'], 'Website source provenance');
  exact(provenance.websiteAdoption,['issue','state'], 'Website adoption');
  demand(provenance.schemaVersion===1 && provenance.authority==='EO-16' &&
    provenance.websiteAdoption.issue==='HC-181' && provenance.websiteAdoption.state==='derived',
    'Invalid Website authority/adoption metadata');
  demand(provenance.release.repository===REPO &&
    provenance.registryRevision===rel.registryRevision && provenance.fingerprint===rel.fingerprint &&
    provenance.release.tag===latest.tag && provenance.release.releaseCommitSha===latest.releaseCommitSha &&
    provenance.release.approvalReference===app.approvalReference &&
    provenance.release.releaseSha256===digest(releaseBytes) &&
    provenance.release.approvalSha256===digest(approvalBytes) &&
    provenance.release.latestSha256===digest(latestBytes), 'Website provenance/Release mismatch');
  demand(latest.approvedRevision===rel.registryRevision && latest.fingerprint===rel.fingerprint &&
    latest.approvalReference===app.approvalReference && latest.tag===rel.registryRevision, 'Pinned latest/release/approval mismatch');
  projectWebsite(snapshot,rel.centralPayload);
  return {
    status:'LOCAL_INTEGRITY_OK',registryRevision:rel.registryRevision,fingerprint:rel.fingerprint,
    releaseSha256:digest(releaseBytes),approvalSha256:digest(approvalBytes),
    latestSha256:digest(latestBytes),releaseCommitSha:latest.releaseCommitSha
  };
}

// Owner-operated, read-only private API calls; NEVER run this from public Website PR CI.
// No cached/unsigned evidence packet can reach UP_TO_DATE through this function.
export async function checkLiveFreshness({snapshot,fetchImpl,token}={}) {
  let local;
  try { local=validatePinnedWebsite({snapshot}); }
  catch (e) { return {status:'AUTHORITY_CONFLICT',reason:e.message}; }
  if (typeof fetchImpl!=='function' || typeof token!=='string' || token.length===0) return {status:'FRESHNESS_UNKNOWN'};
  const get=async path=>{
    let response;
    try {
      response=await fetchImpl(`${API}${path}`,{method:'GET',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},redirect:'error',signal:AbortSignal.timeout(15000)});
    }catch{throw Object.assign(new Error('GitHub API unavailable'),{unavailable:true});}
    if (!response.ok) throw Object.assign(new Error(`GitHub HTTP ${response.status}`),{unavailable:true});
    try {return await response.json();}catch{throw new CentralIntegrityError('Malformed GitHub envelope');}
  };
  const read=async(path,sha)=>{
    demand(SHA40.test(sha),'Invalid pinned ref');
    const v=await get(`/contents/${path}?ref=${sha}`);
    demand(v.type==='file' && v.encoding==='base64' && typeof v.content==='string',`Invalid private content: ${path}`);
    const b64=v.content.replace(/\s/g,'');
    demand(/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(b64),'Malformed private base64');
    const bytes=Buffer.from(b64,'base64');
    demand(bytes.length>0 && bytes.length<1048576,'Invalid private file length');
    return bytes;
  };
  try {
    const main=await get('/git/ref/heads/main');
    const mainSha=main.object?.sha;
    demand(main.object?.type==='commit' && SHA40.test(mainSha),'Malformed current main');
    const latestBytes=await read('latest.json',mainSha);
    const latest=parseStrictJson(latestBytes);
    validateLatest(latest);
    const tag=await get(`/git/ref/tags/${latest.tag}`);
    demand(tag.object?.type==='commit' && tag.object.sha===latest.releaseCommitSha,'Protected release tag changed');
    const releasePath=`releases/${latest.tag}.json`;
    const approvalPath=`approvals/${latest.tag}.json`;
    const [releaseBytes,approvalBytes,mainRelease,mainApproval]=await Promise.all([
      read(releasePath,tag.object.sha),read(approvalPath,tag.object.sha),read(releasePath,mainSha),read(approvalPath,mainSha)
    ]);
    demand(releaseBytes.equals(mainRelease) && approvalBytes.equals(mainApproval),'Current main differs from tagged release');
    const release=validateRelease(parseStrictJson(releaseBytes));
    const approval=parseStrictJson(approvalBytes);
    validateApproval(release,approval,releaseBytes);
    demand(latest.approvedRevision===release.registryRevision && latest.fingerprint===release.fingerprint &&
      latest.approvalReference===approval.approvalReference && latest.tag===release.registryRevision,'Central latest/release conflict');
    const again=await get('/git/ref/heads/main');
    const retag=await get(`/git/ref/tags/${latest.tag}`);
    demand(again.object?.sha===mainSha && retag.object?.sha===tag.object.sha && retag.object?.type==='commit','Central refs moved during read');
    let status='STALE';
    if (local.registryRevision===latest.approvedRevision) {
      demand(local.fingerprint===latest.fingerprint &&
        local.releaseCommitSha===tag.object.sha &&
        local.releaseSha256===digest(releaseBytes) &&
        local.approvalSha256===digest(approvalBytes) &&
        local.latestSha256===digest(latestBytes),
        'Current source identity differs from pinned Website provenance');
      status='UP_TO_DATE';
    }
    return {status,observedAt:new Date().toISOString(),mainCommitSha:mainSha,approvedRevision:latest.approvedRevision,fingerprint:latest.fingerprint};
  } catch(error) {
    return {status:error?.unavailable?'CENTRAL_AUTHORITY_UNAVAILABLE':'AUTHORITY_CONFLICT',reason:error instanceof Error?error.message:'Unexpected authority failure'};
  }
}

// Offline-only command used by Website validation; never fetches private GitHub data.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { process.stdout.write(JSON.stringify(validatePinnedWebsite())+'\n'); }
  catch(e) { process.stderr.write(`REGISTRY_INTEGRITY_FAIL: ${e.message}\n`);process.exitCode=1; }
}
