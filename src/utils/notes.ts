export const categoryDefinitions = [
  {
    name: 'Paper Reading',
    description:
      'Reading records for papers, surveys, models, datasets, and benchmarks related to robotics, embodied AI, and VLA.',
  },
  {
    name: 'Information Retrieval',
    description:
      'Notes about search concepts, library resources, indexes, databases, and intellectual property literature.',
  },
  {
    name: 'Robotics & Control',
    description:
      'Notes about robot systems, kinematics, dynamics, control, simulation, and engineering foundations.',
  },
  {
    name: 'Mechanical Design',
    description:
      'Notes about CAD, mechanism design, manufacturing, structural thinking, and mechanical engineering practice.',
  },
  {
    name: 'AI-assisted Workflow',
    description:
      'Notes about using AI tools for literature search, learning, project management, writing, and technical workflows.',
  },
  {
    name: 'Project Logs',
    description:
      'Development records, design decisions, implementation notes, and retrospectives from personal projects.',
  },
  {
    name: 'Learning Methods',
    description:
      'Notes about how I learn, organize knowledge, read papers, and build long-term technical understanding.',
  },
  {
    name: 'Programming Languages',
    description: 'Public notes and references on programming language fundamentals and practice.',
  },
  {
    name: 'CS Fundamentals',
    description: 'Computer science fundamentals covering algorithms, data structures, and implementation notes.',
  },
];

export const pathDefinitions = [
  {
    title: 'Robotics Foundations',
    purpose: 'Build the engineering and control background needed for robot systems.',
    steps: ['Mechanical design basics', 'Kinematics', 'Dynamics', 'Control systems', 'Simulation', 'Project logs'],
  },
  {
    title: 'Embodied AI / VLA',
    purpose: 'Understand how models connect vision, language, and action in robotic systems.',
    steps: [
      'Machine learning basics',
      'Vision-language models',
      'Robot learning',
      'VLA papers',
      'Datasets and benchmarks',
      'Reproduction / implementation notes',
    ],
  },
  {
    title: 'AI-assisted Research Workflow',
    purpose: 'Use AI tools to improve literature search, knowledge organization, and project execution.',
    steps: [
      'Literature search',
      'Paper reading template',
      'Knowledge extraction',
      'Note organization',
      'Agent workflow',
      'Project documentation',
    ],
  },
];

export const typeLabels: Record<string, string> = {
  'paper-reading': 'Paper reading',
  'concept-note': 'Concept note',
  'project-log': 'Project log',
  'learning-note': 'Learning note',
  'engineering-note': 'Engineering note',
  'workflow-note': 'Workflow note',
};

export const statusDescriptions: Record<string, string> = {
  seed: 'Early note or placeholder.',
  growing: 'Actively expanding.',
  evergreen: 'Stable reference.',
  archived: 'Kept for history.',
};

export const publicTagDefinitions = [
  {
    label: 'C',
    aliases: ['c', 'C语言'],
  },
] as const;

export interface PublicTagConcept {
  label: string;
  slug: string;
  sourceTags: string[];
}

export function canonicalPublicTagLabel(tag: string) {
  return publicTagDefinitions.find(
    (definition) => definition.label === tag || definition.aliases.some((alias) => alias === tag),
  )?.label ?? tag;
}

export function buildPublicTagConcepts(tags: Iterable<string>, toSlug: (value: string) => string): PublicTagConcept[] {
  const conceptsByLabel = new Map<string, Set<string>>();

  for (const tag of tags) {
    const label = canonicalPublicTagLabel(tag);
    const sourceTags = conceptsByLabel.get(label) ?? new Set<string>();
    sourceTags.add(tag);
    conceptsByLabel.set(label, sourceTags);
  }

  const concepts = [...conceptsByLabel.entries()].map(([label, sourceTags]) => ({
    label,
    slug: toSlug(label),
    sourceTags: [...sourceTags],
  }));
  const labelsBySlug = new Map<string, string>();

  for (const concept of concepts) {
    const existingLabel = labelsBySlug.get(concept.slug);
    if (existingLabel && existingLabel !== concept.label) {
      throw new Error(
        `Public tag slug collision: "${existingLabel}" and "${concept.label}" both map to "${concept.slug}". Declare an alias before publishing.`,
      );
    }
    labelsBySlug.set(concept.slug, concept.label);
  }

  return concepts.sort((a, b) => a.label.localeCompare(b.label));
}

export function noteHasPublicTag(tags: Iterable<string>, label: string) {
  return [...tags].some((tag) => canonicalPublicTagLabel(tag) === label);
}
