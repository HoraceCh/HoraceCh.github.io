import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  validatePinnedWebsite, parseStrictJson, fingerprint, canonicalize,
  checkLiveFreshness, digest, CentralIntegrityError
} from '../tools/central-registry-integrity.mjs';

const root = new URL('../', import.meta.url);
const paths = {
  release:'config/central-registry-r1.release.json',
  approval:'config/central-registry-r1.approval.json',
  latest:'config/central-registry-r1.latest.json',
  website:'config/codex-model-registry.snapshot.json'
};
const bytes=path=>readFileSync(new URL(path,root));
const RB=bytes(paths.release),AB=bytes(paths.approval),LB=bytes(paths.latest);
const rel=parseStrictJson(RB),approval=parseStrictJson(AB),latest=parseStrictJson(LB);
const website=parseStrictJson(bytes(paths.website));
const clone=x=>structuredClone(x);
const mustReject=(fn,re)=>assert.throws(fn,re);
const main='6f850c5260cb1e68ec78e45648232c74209ce501';
const tag='dc9f8486c4ac3968ccda42539c1bc9e2b1a82afd';
const api='https://api.github.com/repos/HoraceCh/Model-Routing-Registry';
const encode=b=>({type:'file',encoding:'base64',content:b.toString('base64')});
function syntheticBundle(revision,centralPayload, tagSha,kind='forward') {
  const ref=`https://linear.app/baukasten/issue/EO-16#comment-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`;
  const release={registryRevision:revision,predecessorRevision:'mra-r000001',transition:{kind,approvalEvidence:ref,...(kind==='rollback'?{restoresRevision:'mra-r000001'}:{})},fingerprint:fingerprint(centralPayload),centralPayload};
  const rb=Buffer.from(JSON.stringify(release));
  const ab=Buffer.from(JSON.stringify({schemaVersion:1,authority:'EO-16',decision:'approved',registryRevision:revision,fingerprint:release.fingerprint,releaseSha256:digest(rb),approvalReference:ref}));
  const lb=Buffer.from(JSON.stringify({schemaVersion:1,approvedRevision:revision,fingerprint:release.fingerprint,approvalReference:ref,tag:revision,releaseCommitSha:tagSha}));
  return {release:rb,approval:ab,latest:lb,tagSha};
}
function mock({revision='mra-r000001',bundle=null,changes={},onCall=()=>{}}={}) {
  const sha=revision==='mra-r000001'?tag:(bundle?.tagSha??'4'.repeat(40));
  const r=revision==='mra-r000001'?RB:bundle.release;
  const a=revision==='mra-r000001'?AB:bundle.approval;
  const l=revision==='mra-r000001'?LB:bundle.latest;
  const record={
    '/git/ref/heads/main': {object:{type:'commit',sha:main}},
    [`/contents/latest.json?ref=${main}`]: encode(l),
    [`/git/ref/tags/${revision}`]: {object:{type:'commit',sha}},
    [`/contents/releases/${revision}.json?ref=${sha}`]:encode(r),
    [`/contents/approvals/${revision}.json?ref=${sha}`]:encode(a),
    [`/contents/releases/${revision}.json?ref=${main}`]:encode(r),
    [`/contents/approvals/${revision}.json?ref=${main}`]:encode(a),
    ...changes
  };
  const visited=[];
  const fetchImpl=async (url,opts)=>{
    assert.equal(opts.method,'GET');
    assert(url.startsWith(api));
    assert.equal(opts.redirect,'error');
    assert.equal(opts.headers.Authorization,'Bearer TEST_READ_ONLY');
    const path=url.slice(api.length);
    visited.push(path);onCall(path,visited.length);
    const data=record[path];
    if(data?.httpError) return {ok:false,status:data.httpError};
    if(data===undefined) return {ok:false,status:404};
    return {ok:true,json:async()=>structuredClone(data)};
  };
  return {visited,fetchImpl};
}
const check=(fetchImpl,ws=website)=>checkLiveFreshness({snapshot:ws,fetchImpl,token:'TEST_READ_ONLY'});

test('R1 exact raw Git release and approval SHA-256 are anchored',()=>{
  assert.equal(digest(RB),'66a18b03c210f9949c26bfeddd0c389da30a21bf58359ff3bdea8edf24d4c9cb');
  assert.equal(digest(AB),'c253938340b6d9f9880ee540d707565f9c5529b184ac763a41a1a1a003990983');
  assert.equal(digest(LB),'29f652de1ee00bc0d793da9ca0b002bed74664ccb4953bbec1da66a976a4c766');
});
test('canonical fingerprint matches central R1 but excludes pilot overlay',()=>{
  assert.equal(fingerprint(rel.centralPayload),rel.fingerprint);
  assert.equal(canonicalize({b:1,a:2}),'{"a":2,"b":1}');
  assert.notEqual(fingerprint({...rel.centralPayload, websitePilotOverrides:website.websitePilotOverrides}),rel.fingerprint);
});
test('local Website R1 integrity PASS',()=>{
  assert.equal(validatePinnedWebsite().status,'LOCAL_INTEGRITY_OK');
});
test('ordinary L3 tampering cannot self-attest with untouched metadata',()=>{
  const s=clone(website);s.activeBindings.standard.model='fake-active';
  mustReject(()=>validatePinnedWebsite({snapshot:s}),/ordinary drift/);
});
test('ordinary L1 fast effort missing fails',()=>{
  const s=clone(website);s.activeBindings.fast.reasoning=['medium'];
  mustReject(()=>validatePinnedWebsite({snapshot:s}),/invalid lane|fast lane drift/);
});
test('ordinary deep model mismatch fails',()=>{
  const s=clone(website);s.activeBindings.deep.model='fake';s.rollbackBindings['project_architect:deep'].model='fake';
  mustReject(()=>validatePinnedWebsite({snapshot:s}),/ordinary drift/);
});
test('L5 unexpected global activation fails',()=>{
  const s=clone(website);s.activeBindings.frontier={model:'fake',reasoning:['high'],status:'active'};
  mustReject(()=>validatePinnedWebsite({snapshot:s}),/L5 must remain disabled/);
});
test('qualified candidate model/lifecycle tampering fails',()=>{
  for(const key of ['model','status','evidence']) {
    const s=clone(website);s.qualifiedCandidates.standard[key]='unauthorized';
    mustReject(()=>validatePinnedWebsite({snapshot:s}),/candidate drift/);
  }
});
test('Website pilot rollback is independent, cannot override central ordinary model',()=>{
  const s=clone(website);s.rollbackBindings['project_architect:deep'].model='fake';
  mustReject(()=>validatePinnedWebsite({snapshot:s}),/overlay is not independent/);
});
test('pilot metadata change does not affect central digest',()=>{
  const s=clone(website);s.websitePilotOverrides['project_architect:deep'].evidence.push('synthetic-local-review');
  assert.equal(validatePinnedWebsite({snapshot:s}).fingerprint,rel.fingerprint);
});
test('unexpected overlay key rejected',()=>{
  const s=clone(website);s.websitePilotOverrides['standard:ordinary']={model:'fake'};
  mustReject(()=>validatePinnedWebsite({snapshot:s}),/Website overlay/);
});
test('missing revision/incorrect fingerprint/source tag rejected',()=>{
  for(const fn of [s=>delete s.centralRegistry.registryRevision,s=>s.centralRegistry.fingerprint='f'.repeat(64),s=>s.centralRegistry.release.tag='mra-r000002']) {
    const s=clone(website);fn(s);
    mustReject(()=>validatePinnedWebsite({snapshot:s}),/provenance\/Release mismatch|incorrect schema keys/);
  }
});
test('wrong Release digest and approval raw digest rejected',()=>{
  const altered=Buffer.from(RB.toString().replace('"gpt-6-sol"','"gpt-6-fake"'));
  mustReject(()=>validatePinnedWebsite({releaseBytes:altered}),/fingerprint mismatch/);
  const app=clone(approval);app.releaseSha256='0'.repeat(64);
  mustReject(()=>validatePinnedWebsite({approvalBytes:Buffer.from(JSON.stringify(app))}),/Release\/approval mismatch/);
});
test('duplicate-key and malformed central JSON fail closed',()=>{
  for(const bad of ['{"a":1,"a":2}','{"x":1,}','{"x":"\\u0zz0"}','{"a":1}{"b":2}']) {
    mustReject(()=>parseStrictJson(bad),/JSON:/);
  }
});
test('unexpected central release schema key rejected',()=>{
  const copy=clone(rel);copy.unexpected=true;
  mustReject(()=>validatePinnedWebsite({releaseBytes:Buffer.from(JSON.stringify(copy))}),/release: incorrect schema keys/);
});
test('missing private reference yields FRESHNESS_UNKNOWN, not UP_TO_DATE',async()=>{
  const a=await checkLiveFreshness({snapshot:website});
  assert.equal(a.status,'FRESHNESS_UNKNOWN');
});
test('real-time R1 authenticated fixed-path GET reconciliation yields UP_TO_DATE',async()=>{
  const f=mock();const out=await check(f.fetchImpl);
  assert.equal(out.status,'UP_TO_DATE');
  assert.equal(out.approvedRevision,'mra-r000001');
  assert.equal(f.visited.filter(x=>x==='/git/ref/heads/main').length,2);
  assert.equal(f.visited.filter(x=>x==='/git/ref/tags/mra-r000001').length,2);
  assert.equal(f.visited.length,9);
});
test('read-only transport not accessible fails CENTRAL_AUTHORITY_UNAVAILABLE',async()=>{
  const f=mock({changes:{'/git/ref/heads/main':{httpError:403}}});
  assert.equal((await check(f.fetchImpl)).status,'CENTRAL_AUTHORITY_UNAVAILABLE');
});
test('central release/tag mutation and ref movement fail AUTHORITY_CONFLICT',async()=>{
  const f=mock({changes:{'/git/ref/tags/mra-r000001':{object:{type:'commit',sha:'4'.repeat(40)}}}});
  assert.equal((await check(f.fetchImpl)).status,'AUTHORITY_CONFLICT');
  const prior=mock();let refs=0;
  const moved=async(url,opt)=>url.endsWith('/git/ref/heads/main')&&++refs===2 ?
    {ok:true,json:async()=>({object:{type:'commit',sha:'5'.repeat(40)}})}:prior.fetchImpl(url,opt);
  assert.equal((await check(moved)).status,'AUTHORITY_CONFLICT');
});
test('synthetic approved R2 L3 one-binding change detects stale R1',async()=>{
  const payload=clone(rel.centralPayload);payload.ordinaryLanes.L3.active.model='synthetic-r2-only';
  const r2=syntheticBundle('mra-r000002',payload,'4'.repeat(40));
  const f=mock({revision:'mra-r000002',bundle:r2});
  const out=await check(f.fetchImpl);
  assert.equal(out.status,'STALE');assert.equal(out.approvedRevision,'mra-r000002');
});
test('synthetic R3 rollback to R1 fingerprint still detects older R1 revision',async()=>{
  const r3=syntheticBundle('mra-r000003',clone(rel.centralPayload),'5'.repeat(40),'rollback');
  const out=await check(mock({revision:'mra-r000003',bundle:r3}).fetchImpl);
  assert.equal(out.status,'STALE');assert.equal(out.fingerprint,rel.fingerprint);
});
test('synthetic R2 wrong approved raw digest fails AUTHORITY_CONFLICT',async()=>{
  const payload=clone(rel.centralPayload);payload.ordinaryLanes.L3.active.model='synthetic';
  const r2=syntheticBundle('mra-r000002',payload,'4'.repeat(40));
  const app=parseStrictJson(r2.approval);app.releaseSha256='f'.repeat(64);
  const f=mock({revision:'mra-r000002',bundle:{...r2,approval:Buffer.from(JSON.stringify(app))}});
  assert.equal((await check(f.fetchImpl)).status,'AUTHORITY_CONFLICT');
});
test('reject caller-provided unsigned provenance in place of fresh API read',async()=>{
  const result=await checkLiveFreshness({snapshot:website, token:'TEST_READ_ONLY',readEvidence:{status:'UP_TO_DATE'}});
  assert.equal(result.status,'FRESHNESS_UNKNOWN');
});
test('invalid local snapshot blocks live UP_TO_DATE even with valid central API',async()=>{
  const s=clone(website);s.activeBindings.standard.model='malicious';
  const out=await check(mock().fetchImpl,s);
  assert.equal(out.status,'AUTHORITY_CONFLICT');
});
