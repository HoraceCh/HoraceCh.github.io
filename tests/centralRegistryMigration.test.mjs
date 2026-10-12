import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import {
  checkLiveFreshness, digest, fingerprint, parseStrictJson, projectWebsite,
  validatePinnedWebsite, validateRelease,
} from '../tools/central-registry-integrity.mjs';
import { deriveWebsite, r1Release, r1Website, r2, r3 } from './fixtures/centralRegistryMigration.mjs';

const checkerBytes = readFileSync(new URL('../tools/central-registry-integrity.mjs', import.meta.url));
const checkerSha256 = '59b829144f2a72f7e3f990103a8204350d1e0368ae5f2cfa8cf41061c682c5ca';

// Fixed test-only raw-byte anchors. No synthetic release is accepted by the production R1 pin.
const trusted = {
  'mra-r000002': {
    predecessor: 'mra-r000001', kind: 'forward', commit: '2'.repeat(40),
    release: '76295e4c22f7c1e60802b6dc944fca6561383ad6f45d84ce7483ce4f1fcf0335',
    approval: '92e48cee19378defe253ace41773f84772a7d99b63f2145d06f95f3751d2484c',
    latest: 'd8f9a8963052e98134ad3f11b3abb92fd28e01d3e630ec9414fa9e77f622154b',
  },
  'mra-r000003': {
    predecessor: 'mra-r000002', kind: 'rollback', commit: '3'.repeat(40),
    release: 'f318c9d434f338639536e33f5eddf0d31680efddbccacd9623a1eb036d463737',
    approval: 'aff4853c1cfdc2567e32ebbcebc82da797ccb91908958f8b3ff54dd668af918d',
    latest: 'be3af461a92be93d1de62c2a11f80a8877cd14a03b084cca33f40de1053ec178',
  },
};

function assertTrustedSynthetic(authority) {
  const expected = trusted[authority.release.registryRevision];
  assert.ok(expected, 'no test-only trust anchor for revision');
  assert.equal(digest(authority.releaseBytes), expected.release);
  assert.equal(digest(authority.approvalBytes), expected.approval);
  assert.equal(digest(authority.latestBytes), expected.latest);
  assert.equal(authority.release.predecessorRevision, expected.predecessor);
  assert.equal(authority.release.transition.kind, expected.kind);
  assert.equal(authority.releaseCommitSha, expected.commit);
  assert.deepEqual(validateRelease(parseStrictJson(authority.releaseBytes)), authority.release);
}

function fakeCentral(authority) {
  const revision = authority.release.registryRevision;
  const main = '6'.repeat(40);
  const sha = authority.releaseCommitSha;
  const encoded = bytes => ({ type: 'file', encoding: 'base64', content: bytes.toString('base64') });
  const responses = new Map([
    ['/git/ref/heads/main', { object: { type: 'commit', sha: main } }],
    [`/contents/latest.json?ref=${main}`, encoded(authority.latestBytes)],
    [`/git/ref/tags/${revision}`, { object: { type: 'commit', sha } }],
    [`/contents/releases/${revision}.json?ref=${sha}`, encoded(authority.releaseBytes)],
    [`/contents/approvals/${revision}.json?ref=${sha}`, encoded(authority.approvalBytes)],
    [`/contents/releases/${revision}.json?ref=${main}`, encoded(authority.releaseBytes)],
    [`/contents/approvals/${revision}.json?ref=${main}`, encoded(authority.approvalBytes)],
  ]);
  return async (url, options) => {
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer TEST_READ_ONLY');
    const path = url.replace('https://api.github.com/repos/HoraceCh/Model-Routing-Registry', '');
    const value = responses.get(path);
    return value ? { ok: true, json: async () => structuredClone(value) } : { ok: false, status: 404 };
  };
}

function pinned(authority) {
  assertTrustedSynthetic(authority);
  return validatePinnedWebsite({
    snapshot: deriveWebsite(authority),
    releaseBytes: authority.releaseBytes,
    approvalBytes: authority.approvalBytes,
    latestBytes: authority.latestBytes,
  });
}

async function withSyntheticPinned(authority, run) {
  assertTrustedSynthetic(authority);
  const directory = mkdtempSync(join(tmpdir(), 'hc-211-website-'));
  try {
    const tools = join(directory, 'tools');
    const config = join(directory, 'config');
    mkdirSync(tools);
    mkdirSync(config);
    const checkerPath = join(tools, 'central-registry-integrity.mjs');
    assert.equal(digest(checkerBytes), checkerSha256);
    writeFileSync(checkerPath, checkerBytes);
    assert.deepEqual(readFileSync(checkerPath), checkerBytes);
    assert.equal(digest(readFileSync(checkerPath)), checkerSha256);
    const paths = {
      release: join(config, 'central-registry-r1.release.json'),
      approval: join(config, 'central-registry-r1.approval.json'),
      latest: join(config, 'central-registry-r1.latest.json'),
    };
    for (const kind of ['release', 'approval', 'latest']) {
      const bytes = authority[`${kind}Bytes`];
      writeFileSync(paths[kind], bytes);
      assert.deepEqual(readFileSync(paths[kind]), bytes);
      assert.equal(digest(readFileSync(paths[kind])), trusted[authority.release.registryRevision][kind]);
    }
    const checker = await import(pathToFileURL(checkerPath).href);
    return await run(checker, paths);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function overrideCentral(fetchImpl, path, value) {
  return (url, options) => url.endsWith(path)
    ? fetchImpl(url, options).then(() => ({ ok: true, json: async () => structuredClone(value) }))
    : fetchImpl(url, options);
}

const encoded = bytes => ({ type: 'file', encoding: 'base64', content: bytes.toString('base64') });

test('R1 production pins remain valid while test-only R2 changes only ordinary L3', () => {
  assert.equal(validatePinnedWebsite().status, 'LOCAL_INTEGRITY_OK');
  assertTrustedSynthetic(r2);
  const restored = structuredClone(r2.release.centralPayload);
  restored.ordinaryLanes.L3.active.model = r1Release.centralPayload.ordinaryLanes.L3.active.model;
  assert.deepEqual(restored, r1Release.centralPayload);
  assert.notEqual(r2.release.fingerprint, r1Release.fingerprint);
  assert.equal(r2.release.centralPayload.qualifiedCandidates.L3.state, 'qualified-not-active');
  assert.equal(r2.release.centralPayload.ordinaryLanes.L5.state, 'disabled');
});

test('old R1 Website remains STALE against trusted R2 and R3 even after fingerprint rollback', async () => {
  for (const authority of [r2, r3]) {
    assertTrustedSynthetic(authority);
    const result = await checkLiveFreshness({ snapshot: r1Website, fetchImpl: fakeCentral(authority), token: 'TEST_READ_ONLY' });
    assert.equal(result.status, 'STALE');
    assert.equal(result.approvedRevision, authority.release.registryRevision);
  }
  assert.equal(r3.release.fingerprint, r1Release.fingerprint);
});

test('explicitly trusted synthetic R2 source validates the derived Website through real projection and integrity', () => {
  assertTrustedSynthetic(r2);
  const snapshot = deriveWebsite(r2);
  assert.equal(projectWebsite(snapshot, r2.release.centralPayload), true);
  assert.equal(pinned(r2).status, 'LOCAL_INTEGRITY_OK');
  assert.equal(snapshot.activeBindings.fast.model, r1Website.activeBindings.fast.model);
  assert.deepEqual(snapshot.activeBindings.fast.reasoning, ['low', 'medium']);
  assert.deepEqual(snapshot.qualifiedCandidates, r1Website.qualifiedCandidates);
  assert.deepEqual(snapshot.websitePilotOverrides, r1Website.websitePilotOverrides);
  assert.equal(fingerprint(r2.release.centralPayload), r2.release.fingerprint);
  assert.equal(snapshot.activeBindings.frontier.status, 'disabled');
});

test('R3 auditable rollback restores R1 effective bindings under a new trusted revision', () => {
  assertTrustedSynthetic(r3);
  assert.equal(r3.release.transition.restoresRevision, r1Release.registryRevision);
  assert.deepEqual(r3.release.centralPayload, r1Release.centralPayload);
  const snapshot = deriveWebsite(r3);
  assert.equal(projectWebsite(snapshot, r3.release.centralPayload), true);
  assert.equal(pinned(r3).registryRevision, 'mra-r000003');
  assert.deepEqual(snapshot.activeBindings, r1Website.activeBindings);
  assert.deepEqual(snapshot.websitePilotOverrides, r1Website.websitePilotOverrides);
});

test('unchanged synthetic revision or source identity cannot attest changed payload bytes', () => {
  const changed = structuredClone(r2.release);
  changed.centralPayload.ordinaryLanes.L3.active.model = 'synthetic-hc204-unauthorized';
  changed.fingerprint = fingerprint(changed.centralPayload);
  const changedBytes = Buffer.from(JSON.stringify(changed));
  assert.throws(() => assertTrustedSynthetic({ ...r2, releaseBytes: changedBytes }), assert.AssertionError);
  const forgedApproval = Buffer.from(JSON.stringify({
    ...parseStrictJson(r2.approvalBytes), fingerprint: changed.fingerprint, releaseSha256: digest(changedBytes),
  }));
  const forgedLatest = Buffer.from(JSON.stringify({
    ...parseStrictJson(r2.latestBytes), fingerprint: changed.fingerprint,
  }));
  const forged = { ...r2, release: changed, releaseBytes: changedBytes, approvalBytes: forgedApproval, latestBytes: forgedLatest };
  assert.throws(() => assertTrustedSynthetic(forged), assert.AssertionError);
  assert.throws(() => pinned(forged), assert.AssertionError);
  assert.throws(() => validatePinnedWebsite({
    snapshot: deriveWebsite(forged), releaseBytes: r2.releaseBytes,
    approvalBytes: r2.approvalBytes, latestBytes: r2.latestBytes,
  }), /provenance\/Release mismatch|ordinary drift/);
  assert.throws(() => assertTrustedSynthetic({
    ...r2, release: { ...r2.release, registryRevision: 'mra-r000004' },
  }), /no test-only trust anchor/);
});

test('tampered approval and mismatched source digest fail real Website integrity', () => {
  assertTrustedSynthetic(r2);
  const approval = parseStrictJson(r2.approvalBytes);
  approval.decision = 'rejected';
  assert.throws(() => validatePinnedWebsite({
    snapshot: deriveWebsite(r2), releaseBytes: r2.releaseBytes,
    approvalBytes: Buffer.from(JSON.stringify(approval)), latestBytes: r2.latestBytes,
  }), /Unapproved Registry revision/);
  const changedRawBytes = Buffer.from(`${r2.releaseBytes.toString()}\n`);
  assert.throws(() => validatePinnedWebsite({
    snapshot: deriveWebsite(r2), releaseBytes: changedRawBytes,
    approvalBytes: r2.approvalBytes, latestBytes: r2.latestBytes,
  }), /Release\/approval mismatch/);
});

test('missing or unavailable central authority never satisfies freshness', async () => {
  const missing = await checkLiveFreshness({ snapshot: r1Website });
  assert.equal(missing.status, 'FRESHNESS_UNKNOWN');
  assert.notEqual(missing.status, 'UP_TO_DATE');
  const unavailable = await checkLiveFreshness({
    snapshot: r1Website, token: 'TEST_READ_ONLY',
    fetchImpl: async () => ({ ok: false, status: 403 }),
  });
  assert.equal(unavailable.status, 'CENTRAL_AUTHORITY_UNAVAILABLE');
  assert.notEqual(unavailable.status, 'UP_TO_DATE');
});

test('production R1 live checker does not silently repin to a synthetic R2 Website', async () => {
  const result = await checkLiveFreshness({ snapshot: deriveWebsite(r2), fetchImpl: fakeCentral(r2), token: 'TEST_READ_ONLY' });
  assert.equal(result.status, 'AUTHORITY_CONFLICT');
});

test('unchanged production checker accepts only explicitly pinned synthetic R2 and R3 as locally valid and simulated current', async () => {
  for (const authority of [r2, r3]) {
    await withSyntheticPinned(authority, async checker => {
      const snapshot = deriveWebsite(authority);
      const local = checker.validatePinnedWebsite({ snapshot });
      assert.equal(local.status, 'LOCAL_INTEGRITY_OK');
      assert.equal(local.registryRevision, authority.release.registryRevision);
      assert.equal(local.releaseSha256, trusted[local.registryRevision].release);
      assert.equal(local.approvalSha256, trusted[local.registryRevision].approval);
      assert.equal(local.latestSha256, trusted[local.registryRevision].latest);
      assert.deepEqual(snapshot.websitePilotOverrides, r1Website.websitePilotOverrides);
      assert.deepEqual(snapshot.qualifiedCandidates, r1Website.qualifiedCandidates);
      assert.equal(snapshot.activeBindings.fast.model, r1Website.activeBindings.fast.model);
      assert.deepEqual(snapshot.activeBindings.fast.reasoning, ['low', 'medium']);
      assert.equal(snapshot.activeBindings.frontier.status, 'disabled');
      const current = await checker.checkLiveFreshness({ snapshot, fetchImpl: fakeCentral(authority), token: 'TEST_READ_ONLY' });
      assert.equal(current.status, 'UP_TO_DATE');
      assert.equal(current.approvedRevision, authority.release.registryRevision);
      assert.equal(current.fingerprint, authority.release.fingerprint);
    });
  }
  assert.equal(r3.release.fingerprint, r1Release.fingerprint);
});

test('fixture-backed production checker fails closed on damaged local pins and source identity', async () => {
  await withSyntheticPinned(r2, async (checker, paths) => {
    const snapshot = deriveWebsite(r2);
    writeFileSync(paths.release, Buffer.from(`${r2.releaseBytes.toString()}\n`));
    assert.throws(() => checker.validatePinnedWebsite({ snapshot }), /Release\/approval mismatch/);
    assert.equal((await checker.checkLiveFreshness({ snapshot, fetchImpl: fakeCentral(r2), token: 'TEST_READ_ONLY' })).status, 'AUTHORITY_CONFLICT');
    writeFileSync(paths.release, r2.releaseBytes);
    const rejected = { ...parseStrictJson(r2.approvalBytes), decision: 'rejected' };
    writeFileSync(paths.approval, Buffer.from(JSON.stringify(rejected)));
    assert.throws(() => checker.validatePinnedWebsite({ snapshot }), /Unapproved Registry revision/);
    assert.equal((await checker.checkLiveFreshness({ snapshot, fetchImpl: fakeCentral(r2), token: 'TEST_READ_ONLY' })).status, 'AUTHORITY_CONFLICT');
    writeFileSync(paths.approval, r2.approvalBytes);
    const forged = structuredClone(snapshot);
    forged.centralRegistry.release.repository = 'HoraceCh/Untrusted-Registry';
    assert.throws(() => checker.validatePinnedWebsite({ snapshot: forged }), /Website provenance\/Release mismatch/);
    assert.equal((await checker.checkLiveFreshness({ snapshot: forged, fetchImpl: fakeCentral(r2), token: 'TEST_READ_ONLY' })).status, 'AUTHORITY_CONFLICT');
    rmSync(paths.latest);
    assert.equal((await checker.checkLiveFreshness({ snapshot, fetchImpl: fakeCentral(r2), token: 'TEST_READ_ONLY' })).status, 'AUTHORITY_CONFLICT');
  });
});

test('fixture-backed production checker rejects central tag, release, and same-revision source conflicts', async () => {
  await withSyntheticPinned(r2, async checker => {
    const snapshot = deriveWebsite(r2);
    const args = { snapshot, token: 'TEST_READ_ONLY' };
    const tagPath = `/git/ref/tags/${r2.release.registryRevision}`;
    const badTag = overrideCentral(fakeCentral(r2), tagPath, { object: { type: 'commit', sha: '4'.repeat(40) } });
    assert.equal((await checker.checkLiveFreshness({ ...args, fetchImpl: badTag })).status, 'AUTHORITY_CONFLICT');
    const releasePath = `/contents/releases/${r2.release.registryRevision}.json?ref=${r2.releaseCommitSha}`;
    const badRelease = overrideCentral(fakeCentral(r2), releasePath, encoded(Buffer.from(`${r2.releaseBytes.toString()}\n`)));
    assert.equal((await checker.checkLiveFreshness({ ...args, fetchImpl: badRelease })).status, 'AUTHORITY_CONFLICT');
    const main = '6'.repeat(40);
    const latestPath = `/contents/latest.json?ref=${main}`;
    const changedLatest = overrideCentral(fakeCentral(r2), latestPath, encoded(Buffer.from(`${r2.latestBytes.toString()}\n`)));
    const conflict = await checker.checkLiveFreshness({ ...args, fetchImpl: changedLatest });
    assert.equal(conflict.status, 'AUTHORITY_CONFLICT');
    assert.match(conflict.reason, /Current source identity differs/);
    assert.equal((await checker.checkLiveFreshness({ snapshot })).status, 'FRESHNESS_UNKNOWN');
    assert.equal((await checker.checkLiveFreshness({ ...args, fetchImpl: async () => ({ ok: false, status: 503 }) })).status, 'CENTRAL_AUTHORITY_UNAVAILABLE');
  });
});

test('fixture-backed module and pins are removed after a failed assertion', async () => {
  let pinnedPath;
  await assert.rejects(withSyntheticPinned(r2, async (_checker, paths) => {
    pinnedPath = paths.release;
    assert.fail('cleanup probe');
  }), /cleanup probe/);
  assert.equal(existsSync(pinnedPath), false);
});
