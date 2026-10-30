export type ProjectMedia = {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly srcset: string;
};

const projectMedia: ReadonlyMap<string, ProjectMedia> = new Map([
  ['ai-retrieval-tool', {
    src: '/images/home/ai-retrieval-ui-480.webp',
    alt: 'AI_RETRIEVAL_X interface showing research intent input, query controls and semantic map.',
    width: 480,
    height: 524,
    srcset: '/images/home/ai-retrieval-ui-480.webp 480w, /images/home/ai-retrieval-ui-768.webp 768w, /images/home/ai-retrieval-ui-1200.webp 1200w',
  }],
  ['robomaster-2026-engineering-robot', {
    src: '/images/home/rm26-robot-480.webp',
    alt: 'RoboMaster 2026 engineering robot photographed with its chassis and arm visible.',
    width: 480,
    height: 320,
    srcset: '/images/home/rm26-robot-480.webp 480w, /images/home/rm26-robot-768.webp 768w, /images/home/rm26-robot-1200.webp 1200w',
  }],
]);

export function getProjectMedia(projectId: string): ProjectMedia | undefined {
  return projectMedia.get(projectId);
}
