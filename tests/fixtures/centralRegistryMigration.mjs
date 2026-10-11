// Synthetic HC-204 authority only. These bytes never replace the production R1 pins.
import { readFileSync } from 'node:fs';
import { digest, fingerprint, parseStrictJson } from '../../tools/central-registry-integrity.mjs';

const read = path => readFileSync(new URL(`../../config/${path}`, import.meta.url));
export const r1Website = parseStrictJson(read('codex-model-registry.snapshot.json'));
export const r1Release = parseStrictJson(read('central-registry-r1.release.json'));

function bundle(revision, predecessorRevision, transition, centralPayload, releaseCommitSha) {
  const approvalEvidence = `https://linear.app/baukasten/issue/EO-16#comment-${revision === 'mra-r000002' ? '22222222-2222-4222-8222-222222222222' : '33333333-3333-4333-8333-333333333333'}`;
  const release = {
    registryRevision: revision,
    predecessorRevision,
    transition: { ...transition, approvalEvidence },
    fingerprint: fingerprint(centralPayload),
    centralPayload,
  };
  const releaseBytes = Buffer.from(JSON.stringify(release));
  const approvalBytes = Buffer.from(JSON.stringify({
    schemaVersion: 1,
    authority: 'EO-16',
    decision: 'approved',
    registryRevision: revision,
    fingerprint: release.fingerprint,
    releaseSha256: digest(releaseBytes),
    approvalReference: approvalEvidence,
  }));
  const latestBytes = Buffer.from(JSON.stringify({
    schemaVersion: 1,
    approvedRevision: revision,
    fingerprint: release.fingerprint,
    approvalReference: approvalEvidence,
    tag: revision,
    releaseCommitSha,
  }));
  return { release, releaseBytes, approvalBytes, latestBytes, releaseCommitSha };
}

const r2Payload = structuredClone(r1Release.centralPayload);
r2Payload.ordinaryLanes.L3.active.model = 'synthetic-hc204-l3-r2';
export const r2 = bundle('mra-r000002', 'mra-r000001', { kind: 'forward' }, r2Payload, '2'.repeat(40));
export const r3 = bundle('mra-r000003', 'mra-r000002', { kind: 'rollback', restoresRevision: 'mra-r000001' }, structuredClone(r1Release.centralPayload), '3'.repeat(40));

export function deriveWebsite(authority) {
  const snapshot = structuredClone(r1Website);
  snapshot.activeBindings.standard.model = authority.release.centralPayload.ordinaryLanes.L3.active.model;
  snapshot.centralRegistry.registryRevision = authority.release.registryRevision;
  snapshot.centralRegistry.fingerprint = authority.release.fingerprint;
  const source = snapshot.centralRegistry.release;
  source.tag = authority.release.registryRevision;
  source.releaseCommitSha = authority.releaseCommitSha;
  source.approvalReference = authority.release.transition.approvalEvidence;
  source.releaseSha256 = digest(authority.releaseBytes);
  source.approvalSha256 = digest(authority.approvalBytes);
  source.latestSha256 = digest(authority.latestBytes);
  return snapshot;
}
