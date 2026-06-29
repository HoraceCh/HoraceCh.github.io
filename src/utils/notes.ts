export const categoryDefinitions = [
  {
    name: 'Paper Reading',
    description:
      'Reading records for papers, surveys, models, datasets, and benchmarks related to robotics, embodied AI, and VLA.',
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
