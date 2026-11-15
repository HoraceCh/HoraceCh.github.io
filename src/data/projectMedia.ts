import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export type ProjectMedia = {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly srcset: string;
};

const projectMedia: ReadonlyMap<string, ProjectMedia> = new Map([
  ['ai-retrieval-tool', {
    src: '/images/home/ai-retrieval-ui-1200.webp',
    alt: 'AI_RETRIEVAL_X interface showing research intent input, query controls and semantic map.',
    width: 1200,
    height: 1311,
    srcset: '/images/home/ai-retrieval-ui-480.webp 480w, /images/home/ai-retrieval-ui-768.webp 768w, /images/home/ai-retrieval-ui-1200.webp 1200w',
  }],
  ['robomaster-2026-engineering-robot', {
    src: '/images/home/rm26-robot-1200.webp',
    alt: 'RoboMaster 2026 engineering robot photographed with its chassis and arm visible.',
    width: 1200,
    height: 800,
    srcset: '/images/home/rm26-robot-480.webp 480w, /images/home/rm26-robot-768.webp 768w, /images/home/rm26-robot-1200.webp 1200w',
  }],
]);

export function getProjectMedia(projectId: string, publicDir = resolve('astro-public')): ProjectMedia | undefined {
  const media = projectMedia.get(projectId);
  if (!media) return undefined;
  const sources = [media.src, ...media.srcset.split(', ').map((source) => source.slice(0, source.lastIndexOf(' ')))];
  return sources.every((src) => existsSync(resolve(publicDir, src.slice(1)))) ? media : undefined;
}
