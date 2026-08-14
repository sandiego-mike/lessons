export type SubjectKey = "biology" | "geography";
export type ChapterStatus = "current" | "locked" | "complete" | "review";
export type LessonKind = "learn" | "interaction" | "check" | "evidence";

export type SourceRef = {
  subject: SubjectKey;
  chapter: number;
  pdf: string;
  pages: number[];
  section?: string;
};

export type LessonBlock = {
  id: string;
  kind: LessonKind;
  title: string;
  estimatedMinutes: string;
  source: SourceRef;
  learnText?: string[];
  keyIdea?: string;
  visual?: {
    title: string;
    items: string[];
  };
  prompt?: string;
  choices?: string[];
  correctAnswer?: string;
  feedback?: string;
  requiresResponse?: boolean;
};

export type WorksheetQuestion = {
  id: string;
  prompt: string;
  answerKey: string;
  source: SourceRef;
};

export type ChapterIndex = {
  subject: SubjectKey;
  chapter: number;
  title: string;
  pdf: string;
  pageCount: number;
  sourceStatus: "indexed" | "missing";
  status: ChapterStatus;
  bigIdea: string;
  objectives: string[];
  sections: Array<{ id: string; title: string; pages: number[]; vocabulary: string[] }>;
  concepts: string[];
  vocabulary: string[];
  diagrams: string[];
  notes: Array<{ heading: string; body: string; source: SourceRef }>;
  studyGuide: {
    knowThis: string[];
    understandThis: string[];
    explainThis: string[];
    applyThis: string[];
  };
  lessonBlocks: LessonBlock[];
  worksheet: {
    title: string;
    questions: WorksheetQuestion[];
  };
};

export type ExternalLearningResource = {
  id: string;
  provider: string;
  subject: SubjectKey;
  title: string;
  url: string;
  resourceType: "video lesson" | "lesson page";
  conceptIds: string[];
  chapterIds: number[];
  description: string;
  duration?: string;
  accessType: "public metadata" | "login may be required" | "subscription may be required";
  matchScore: number;
  parentApproved: boolean;
  studentVisible: boolean;
  status: "available" | "login_required" | "subscription_required" | "link_needs_review" | "unavailable";
  recommended: "optional" | "recommended";
  lastChecked: string;
};

export const biologySetupStatus = {
  pdfsDiscovered: 16,
  chaptersOrdered: true,
  chapterTitlesExtracted: true,
  sectionsExtracted: "Chapter 1 vertical slice complete",
  conceptsIdentified: "Chapter 1 vertical slice complete",
  semesterSplitCreated: true,
  issues: ["Chapter 16 PDF is missing"],
};

export const geographySetupStatus = {
  pdfsDiscovered: 40,
  chaptersOrdered: true,
  chapterTitlesExtracted: true,
  sectionsExtracted: "Chapter 1 vertical slice complete",
  conceptsIdentified: "Chapter 1 vertical slice complete",
  semesterSplitCreated: true,
  issues: [],
};

export const biologyChapters: ChapterIndex[] = [
  {
    subject: "biology",
    chapter: 1,
    title: "Biology: The Study of Life",
    pdf: "materials/biology/Chapter_1.pdf",
    pageCount: 32,
    sourceStatus: "indexed",
    status: "current",
    bigIdea:
      "Biology is the study of life. Biologists ask questions about living things, study how organisms interact with their environments, and use scientific methods to investigate the living world.",
    objectives: [
      "Identify the characteristics of life.",
      "Recognize how scientific methods are used to study living things.",
      "Recognize possible benefits from studying biology.",
      "Summarize the characteristics of living things.",
      "Compare different scientific methods.",
      "Differentiate among hypothesis, theory, and principle.",
    ],
    sections: [
      {
        id: "1.1",
        title: "What is biology?",
        pages: [3, 4, 5, 6, 7, 8, 9, 10],
        vocabulary: [
          "biology",
          "organism",
          "organization",
          "reproduction",
          "species",
          "growth",
          "development",
          "environment",
          "stimulus",
          "response",
          "homeostasis",
          "energy",
          "adaptation",
          "evolution",
        ],
      },
      {
        id: "1.2",
        title: "The Methods of Biology",
        pages: [11, 12, 13, 14, 15, 16, 17, 18],
        vocabulary: [
          "scientific methods",
          "hypothesis",
          "experiment",
          "control",
          "independent variable",
          "dependent variable",
          "data",
          "theory",
        ],
      },
    ],
    concepts: [
      "Biology means the study of life.",
      "Living things are organized, reproduce, grow and develop, respond to stimuli, maintain homeostasis, use energy, and adapt/evolve.",
      "Organisms interact with living and nonliving parts of their environment.",
      "Scientific methods begin with observations and testable questions.",
      "A hypothesis is a testable explanation, not a random guess.",
      "Controlled experiments compare a control group with an experimental group.",
      "Independent variables are changed; dependent variables are measured.",
    ],
    vocabulary: [
      "biology",
      "organism",
      "stimulus",
      "response",
      "homeostasis",
      "adaptation",
      "scientific methods",
      "hypothesis",
      "control",
      "independent variable",
      "dependent variable",
    ],
    diagrams: [
      "Figure 1.1: living things interacting with surroundings",
      "Figure 1.4: Lithops as living plants",
      "Figure 1.8: organisms responding to stimuli",
      "Figure 1.11: controlled soybean experiment",
    ],
    notes: [
      {
        heading: "What biology studies",
        body:
          "Biology is the study of life. Biologists do more than memorize organisms. They ask questions about what living things are like, how they work, how they interact, and how humans can understand or protect the living world.",
        source: { subject: "biology", chapter: 1, pdf: "Chapter_1.pdf", pages: [3, 4], section: "1.1" },
      },
      {
        heading: "How to recognize life",
        body:
          "A nonliving thing can show one life-like trait, but an organism must show all major characteristics of life. Living things have organization, reproduce, grow and develop, respond to their environment, maintain homeostasis, use energy, and adapt over generations.",
        source: { subject: "biology", chapter: 1, pdf: "Chapter_1.pdf", pages: [6, 7, 8, 9], section: "1.1" },
      },
      {
        heading: "How biologists investigate",
        body:
          "Biologists use scientific methods to answer questions. They observe carefully, form testable hypotheses, design investigations, collect data, and compare evidence with their explanation.",
        source: { subject: "biology", chapter: 1, pdf: "Chapter_1.pdf", pages: [11, 12, 13, 14], section: "1.2" },
      },
    ],
    studyGuide: {
      knowThis: ["Characteristics of life", "Hypothesis", "Control", "Independent variable", "Dependent variable"],
      understandThis: [
        "Why living things must be studied with their environments.",
        "Why a hypothesis must be testable.",
        "Why controlled experiments change one condition at a time.",
      ],
      explainThis: [
        "How a living thing is different from a nonliving thing that only seems alive.",
        "How a scientist uses observations to form a hypothesis.",
      ],
      applyThis: [
        "Classify examples as living/nonliving using multiple characteristics.",
        "Identify independent and dependent variables in a simple experiment.",
      ],
    },
    lessonBlocks: [
      {
        id: "bio-c1-life",
        kind: "learn",
        title: "What makes something alive?",
        estimatedMinutes: "10-14",
        source: { subject: "biology", chapter: 1, pdf: "Chapter_1.pdf", pages: [6, 7, 8, 9], section: "1.1" },
        learnText: [
          "Most people can usually tell that a bird or a plant is alive, but biology asks for a clearer test. A flame can move, grow, and produce more flames, but it is not alive. A real organism must show all major characteristics of life.",
          "Living things are organized. They are made of one or more cells, and their parts work together. Living things also reproduce, grow and develop, respond to stimuli, maintain stable internal conditions called homeostasis, use energy, and adapt over generations.",
        ],
        keyIdea:
          "A single life-like trait is not enough. An organism must show the major characteristics of life together.",
        visual: {
          title: "Characteristics of life",
          items: ["Organized cells", "Reproduction", "Growth and development", "Response to stimuli", "Homeostasis", "Energy use", "Adaptation over time"],
        },
      },
      {
        id: "bio-c1-classify",
        kind: "interaction",
        title: "Try it: is mildew alive?",
        estimatedMinutes: "6-8",
        source: { subject: "biology", chapter: 1, pdf: "Chapter_1.pdf", pages: [6], section: "1.1" },
        prompt:
          "The textbook asks whether mildew is alive. Choose the strongest reason mildew should be studied as a living thing.",
        choices: [
          "It can appear on bathroom surfaces.",
          "It can show life characteristics such as growth, organization, and reproduction.",
          "It is usually unpleasant.",
        ],
        correctAnswer: "It can show life characteristics such as growth, organization, and reproduction.",
        feedback:
          "Yes. The important point is not that mildew is familiar or unpleasant. The biology question is whether it shows the characteristics of life.",
        requiresResponse: true,
      },
      {
        id: "bio-c1-methods",
        kind: "learn",
        title: "How biologists answer questions",
        estimatedMinutes: "10-14",
        source: { subject: "biology", chapter: 1, pdf: "Chapter_1.pdf", pages: [11, 12, 13, 14], section: "1.2" },
        learnText: [
          "Biologists often begin with curiosity about an observation. The textbook gives examples such as moss growing in shady, moist places or earthworms appearing after rain.",
          "A hypothesis is a testable explanation for a question or problem. It is not a random guess. It grows out of observations, reading, and prior investigations. Scientists then collect data to test whether the evidence supports the hypothesis.",
          "In a controlled experiment, a control group is the standard for comparison. The experimental group receives the condition being tested. The independent variable is what the scientist changes. The dependent variable is what the scientist measures.",
        ],
        keyIdea:
          "Scientific methods connect observations to evidence. A good investigation tests one clear idea with data.",
      },
      {
        id: "bio-c1-check",
        kind: "check",
        title: "Quick check: variables",
        estimatedMinutes: "5-7",
        source: { subject: "biology", chapter: 1, pdf: "Chapter_1.pdf", pages: [14], section: "1.2" },
        prompt:
          "A student tests whether fertilizer changes soybean growth. The fertilizer is added to one group but not the control group. What is the independent variable?",
        choices: ["The growth rate of the plants", "The presence of fertilizer", "The kind of notebook used for data"],
        correctAnswer: "The presence of fertilizer",
        feedback:
          "Correct. The independent variable is what is deliberately changed. The measured plant growth is the dependent variable.",
        requiresResponse: true,
      },
      {
        id: "bio-c1-evidence",
        kind: "evidence",
        title: "Show what you know",
        estimatedMinutes: "8-12",
        source: { subject: "biology", chapter: 1, pdf: "Chapter_1.pdf", pages: [3, 6, 11, 14], section: "1.1-1.2" },
        prompt:
          "In 4-6 sentences, explain how a biologist could decide whether something is alive and how they could test one question about it scientifically.",
        requiresResponse: true,
      },
    ],
    worksheet: {
      title: "Core Chapter Worksheet",
      questions: [
        {
          id: "w1",
          prompt: "List four characteristics of living things and give one example of each.",
          answerKey:
            "Accept four of: organization/cells, reproduction, growth and development, response to stimuli, homeostasis, energy use, adaptation/evolution, with reasonable examples.",
          source: { subject: "biology", chapter: 1, pdf: "Chapter_1.pdf", pages: [6, 7, 8, 9], section: "1.1" },
        },
        {
          id: "w2",
          prompt: "Explain why a flame is not considered alive even though it can move and grow.",
          answerKey:
            "A flame has some life-like traits but does not show all characteristics of life, such as cellular organization, homeostasis, and reproduction as an organism.",
          source: { subject: "biology", chapter: 1, pdf: "Chapter_1.pdf", pages: [6], section: "1.1" },
        },
        {
          id: "w3",
          prompt:
            "A fox hears a rabbit and moves toward it. Identify the stimulus and the response.",
          answerKey:
            "Stimulus: the rabbit or signs of the rabbit. Response: the fox moving toward/pouncing on the rabbit.",
          source: { subject: "biology", chapter: 1, pdf: "Chapter_1.pdf", pages: [9], section: "1.1" },
        },
        {
          id: "w4",
          prompt:
            "A scientist adds fertilizer to one group of plants and no fertilizer to another group. Identify the control, independent variable, and dependent variable.",
          answerKey:
            "Control: plants without fertilizer. Independent variable: fertilizer. Dependent variable: plant growth/growth rate.",
          source: { subject: "biology", chapter: 1, pdf: "Chapter_1.pdf", pages: [14], section: "1.2" },
        },
        {
          id: "w5",
          prompt:
            "Write one testable hypothesis about where moss grows best.",
          answerKey:
            "Example: If moss receives more moisture and shade, then it will grow more densely than moss in dry, sunny conditions.",
          source: { subject: "biology", chapter: 1, pdf: "Chapter_1.pdf", pages: [11], section: "1.2" },
        },
      ],
    },
  },
  {
    subject: "biology",
    chapter: 2,
    title: "Principles of Ecology",
    pdf: "materials/biology/Chapter_2.pdf",
    pageCount: 32,
    sourceStatus: "indexed",
    status: "locked",
    bigIdea: "Organisms depend on biotic and abiotic parts of their environments.",
    objectives: [
      "Describe ecology and the work of ecologists.",
      "Identify important aspects of an organism's environment.",
      "Trace the flow of energy and nutrients in the living and nonliving worlds.",
    ],
    sections: [
      {
        id: "2.1",
        title: "Organisms and Their Environment",
        pages: [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45],
        vocabulary: ["ecology", "biosphere", "abiotic factor", "biotic factor", "population", "biological community", "ecosystem", "habitat", "niche"],
      },
    ],
    concepts: ["Ecology studies interactions.", "Abiotic and biotic factors shape survival.", "Populations, communities, and ecosystems are levels of organization."],
    vocabulary: ["ecology", "abiotic factor", "biotic factor", "population", "ecosystem", "habitat", "niche"],
    diagrams: ["Figure 2.1: drought as an abiotic factor", "Figure 2.4: ecological levels of organization"],
    notes: [],
    studyGuide: { knowThis: [], understandThis: [], explainThis: [], applyThis: [] },
    lessonBlocks: [],
    worksheet: { title: "Core Chapter Worksheet", questions: [] },
  },
];

export const geographyChapters: ChapterIndex[] = [
  {
    subject: "geography",
    chapter: 1,
    title: "Exploring Geography",
    pdf: "materials/world-geography/chapter-01.pdf",
    pageCount: 16,
    sourceStatus: "indexed",
    status: "current",
    bigIdea:
      "Geography studies Earth's physical features, living things, places, patterns, and how people interact with their environments.",
    objectives: [
      "Identify physical and human features geographers study.",
      "Explain location, place, region, movement, and human-environment interaction.",
      "Describe absolute and relative location.",
      "Compare formal, functional, and perceptual regions.",
      "Identify branches of geography and tools geographers use.",
    ],
    sections: [
      {
        id: "1.1",
        title: "Exploring Geography",
        pages: [19, 20, 21, 22],
        vocabulary: [
          "location",
          "absolute location",
          "hemisphere",
          "grid system",
          "relative location",
          "place",
          "region",
          "formal region",
          "functional region",
          "perceptual region",
          "ecosystem",
          "movement",
          "human-environment interaction",
        ],
      },
      {
        id: "1.2",
        title: "The Geographer's Craft",
        pages: [23],
        vocabulary: ["physical geography", "human geography", "meteorology", "cartography", "geographic information systems (GIS)"],
      },
    ],
    concepts: [
      "Geography is the study of Earth's physical features and living things.",
      "Location can be absolute or relative.",
      "Places have physical and human meaning.",
      "Regions group places by shared physical or human factors.",
      "Geographers study physical systems, human systems, movement, and human-environment interaction.",
      "Maps, GPS, and GIS help geographers solve real problems.",
    ],
    vocabulary: [
      "location",
      "absolute location",
      "relative location",
      "place",
      "region",
      "ecosystem",
      "movement",
      "human-environment interaction",
      "physical geography",
      "human geography",
      "GIS",
    ],
    diagrams: [
      "Diagram Study: hemispheres and the global grid",
      "Diagram Study: lines of latitude and longitude",
    ],
    notes: [
      {
        heading: "What geography studies",
        body:
          "Geography describes Earth and looks for patterns. Geographers study physical features, living things, people, places, and how these parts relate to one another.",
        source: { subject: "geography", chapter: 1, pdf: "chapter-01.pdf", pages: [19, 20], section: "1.1" },
      },
      {
        heading: "Location, place, and region",
        body:
          "Absolute location gives an exact position, often using latitude and longitude. Relative location describes where a place is compared with other places. A place has physical and human meaning. A region groups places that share features.",
        source: { subject: "geography", chapter: 1, pdf: "chapter-01.pdf", pages: [20, 21], section: "1.1" },
      },
    ],
    studyGuide: {
      knowThis: ["Absolute location", "Relative location", "Place", "Region", "Ecosystem", "Movement"],
      understandThis: [
        "Why geographers use location as a reference point.",
        "How regions can be physical or human.",
        "How people and environments influence each other.",
      ],
      explainThis: [
        "The difference between absolute and relative location.",
        "The difference among formal, functional, and perceptual regions.",
      ],
      applyThis: [
        "Describe a familiar place using location, place, and region.",
        "Use a map/grid idea to explain where something is.",
      ],
    },
    lessonBlocks: [
      {
        id: "geo-c1-geography",
        kind: "learn",
        title: "What do geographers study?",
        estimatedMinutes: "8-12",
        source: { subject: "geography", chapter: 1, pdf: "chapter-01.pdf", pages: [19, 20], section: "1.1" },
        learnText: [
          "Geography is more than memorizing place names. It studies Earth's physical features and the living things that inhabit the planet, including humans, animals, and plants.",
          "Geographers describe where things are located and how they relate to one another. They also look for patterns and try to explain why those patterns exist.",
        ],
        keyIdea:
          "Geographers study places, patterns, and relationships between people and environments.",
        visual: {
          title: "Six elements geographers consider",
          items: ["Location", "Places and regions", "Physical systems", "Human systems", "Environment and society", "Uses of geography"],
        },
      },
      {
        id: "geo-c1-location",
        kind: "interaction",
        title: "Try it: absolute or relative?",
        estimatedMinutes: "6-8",
        source: { subject: "geography", chapter: 1, pdf: "chapter-01.pdf", pages: [20], section: "1.1" },
        prompt:
          "Dallas, Texas is located at about 32 degrees north latitude and 96 degrees west longitude. Which kind of location is this?",
        choices: ["Absolute location", "Relative location", "Perceptual region"],
        correctAnswer: "Absolute location",
        feedback:
          "Correct. Absolute location gives an exact spot, often with latitude and longitude.",
        requiresResponse: true,
      },
      {
        id: "geo-c1-regions",
        kind: "learn",
        title: "Places and regions",
        estimatedMinutes: "8-12",
        source: { subject: "geography", chapter: 1, pdf: "chapter-01.pdf", pages: [21, 22], section: "1.1" },
        learnText: [
          "A place is a particular space with physical and human meaning. Every place has characteristics shaped by the environment and the people who live there.",
          "A region is an area united by specific factors. Some regions are physical, such as climate or vegetation. Others are human, such as language, government, religion, or trade networks.",
        ],
        keyIdea:
          "Regions help geographers organize Earth's complexity into meaningful patterns.",
      },
      {
        id: "geo-c1-evidence",
        kind: "evidence",
        title: "Show what you know",
        estimatedMinutes: "8-12",
        source: { subject: "geography", chapter: 1, pdf: "chapter-01.pdf", pages: [19, 20, 21, 22], section: "1.1" },
        prompt:
          "Describe your town or neighborhood using three geography ideas from this chapter: location, place, region, movement, or human-environment interaction.",
        requiresResponse: true,
      },
    ],
    worksheet: {
      title: "Core Chapter Worksheet",
      questions: [
        {
          id: "gw1",
          prompt: "Explain the difference between absolute location and relative location.",
          answerKey:
            "Absolute location gives an exact position, usually using latitude and longitude. Relative location describes where a place is in relation to another place.",
          source: { subject: "geography", chapter: 1, pdf: "chapter-01.pdf", pages: [20], section: "1.1" },
        },
        {
          id: "gw2",
          prompt: "Name three elements geographers consider when studying the world.",
          answerKey:
            "Accept three of: location, places and regions, physical systems, human systems, environment and society, uses of geography.",
          source: { subject: "geography", chapter: 1, pdf: "chapter-01.pdf", pages: [20], section: "1.1" },
        },
        {
          id: "gw3",
          prompt: "Give an example of a formal region and explain what common feature defines it.",
          answerKey:
            "Example: the Corn Belt, defined by corn as a major crop. Other valid formal regions share a common feature.",
          source: { subject: "geography", chapter: 1, pdf: "chapter-01.pdf", pages: [21], section: "1.1" },
        },
        {
          id: "gw4",
          prompt: "Describe one way humans can change or use their physical environment.",
          answerKey:
            "Answers should describe human-environment interaction, such as building cities, farms, canals, roads, or changing land use.",
          source: { subject: "geography", chapter: 1, pdf: "chapter-01.pdf", pages: [22], section: "1.1" },
        },
      ],
    },
  },
];

export const externalLearningResources: ExternalLearningResource[] = [
  {
    id: "studycom-bio-study-life",
    provider: "Study.com",
    subject: "biology",
    title: "Biology | Definition, Concepts & Fields",
    url: "https://study.com/academy/lesson/video/biology-the-study-of-life.html",
    resourceType: "video lesson",
    conceptIds: ["biology", "characteristics-of-life", "ecology"],
    chapterIds: [1],
    description:
      "Supplemental Study.com lesson for the meaning of biology and characteristics shared by living organisms.",
    duration: "about 6 minutes",
    accessType: "login may be required",
    matchScore: 0.86,
    parentApproved: true,
    studentVisible: true,
    status: "available",
    recommended: "optional",
    lastChecked: "2026-08-13",
  },
  {
    id: "studycom-bio-characteristics-life",
    provider: "Study.com",
    subject: "biology",
    title: "8 Characteristics of Life in Biology",
    url: "https://study.com/academy/lesson/8-characteristics-of-life-in-biology.html",
    resourceType: "video lesson",
    conceptIds: ["characteristics-of-life", "homeostasis", "adaptation"],
    chapterIds: [1],
    description:
      "Supplemental Study.com lesson that reinforces characteristics of living things. The in-app lesson remains the primary learning path.",
    duration: "about 5 minutes",
    accessType: "login may be required",
    matchScore: 0.91,
    parentApproved: true,
    studentVisible: true,
    status: "available",
    recommended: "optional",
    lastChecked: "2026-08-13",
  },
];
