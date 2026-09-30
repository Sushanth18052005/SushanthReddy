/**
 * Single source of truth for every piece of copy on the site.
 *
 * Provenance, in order of weight:
 *  1. Resume — "Sushanth_Reddy_Test (1).pdf" (authoritative for roles, dates, metrics).
 *  2. GitHub  — github.com/Sushanth18052005 (project repositories).
 *  3. Patent  — Indian Patent Application 202541059395 A.
 *  4. LinkedIn — linkedin.com/in/sushanth-reddy-peddireddy-656816253 (identity + profile links).
 *
 * No metric, employer, award or credential here is invented. Where the resume does not
 * state a number, the copy describes scope and stack rather than claiming a result.
 */

export const profile = {
  name: 'Sushanth Reddy',
  legalName: 'Peddireddy Sushanth Reddy',
  monogram: 'PSR',
  discipline: 'AI/ML & Software Engineer',
  location: 'Hyderabad, India',
  timezone: 'Asia/Kolkata',
  email: 'sushanthreddyp2005@gmail.com',
  phoneDisplay: '+91 63039 51269',
  phoneHref: '+916303951269',
  github: 'https://github.com/Sushanth18052005',
  linkedin: 'https://www.linkedin.com/in/sushanth-reddy-peddireddy-656816253/',
  resumeUrl: '/Sushanth_Reddy_Resume.pdf',
  status: { label: 'Open to AI/ML & software roles', note: 'Class of 2026' },
} as const

export const hero = {
  eyebrow: 'AI/ML engineering · Full-stack software · Hyderabad, IN',
  titleLines: ['Sushanth', 'Reddy'],
  statement: 'I build machine learning systems that turn medical scans and video into decisions a human can trust.',
  standfirst:
    'Final-year B.Tech in CS (AI & ML) at KMIT and co-inventor of an Indian patent. I build the models and the full-stack software around them — PyTorch and transformers on one side, React, Node, Flask, Docker and AWS on the other. Currently doing model engineering at Centific.',
  rail: 'Scroll',
} as const

export const heroStats = [
  { value: '1', unit: 'patent', label: 'Indian patent co-invented', detail: '202541059395 A · published 2025' },
  { value: '8.06', unit: '/10', label: 'CGPA at KMIT', detail: 'B.Tech CSE — AI & ML' },
  { value: '1st', unit: 'place', label: 'Centific Premier Hackathon 2.0', detail: 'AI COE stream' },
] as const

export const marqueeStack = [
  'Generative AI',
  'Retrieval-Augmented Generation',
  'Agentic AI',
  'Model Context Protocol',
  'Computer Vision',
  'Transformers',
  'Large Language Models',
  'PyTorch',
  'TensorFlow',
  'EfficientNet',
  'U-Net',
  'ViT-B/16',
  'Flask',
  'React',
  'Node.js',
  'Docker',
  'AWS',
  'Unreal Engine',
  'MongoDB',
  'Python',
  'Java',
  'C++',
] as const

export const profileSection = {
  index: '01',
  label: 'Profile',
  statement: [
    { text: 'I work at the seam between ', accent: false },
    { text: 'research-grade deep learning', accent: true },
    { text: ' and software that actually ships.', accent: false },
  ],
  body: [
    'My route into machine learning started with a question I could not leave alone: if a model can find a tumour in an ultrasound frame, why is the answer still a number on a screen instead of something a radiologist can walk around and inspect? That question became a five-person project, then a published Indian patent.',
    'Since then I have kept both halves of the craft in view — segmentation and transformer pipelines on one side, and the Flask, Node, Docker and AWS plumbing that lets those models survive contact with real users on the other. At Centific I work on model engineering and evaluation, and on agentic workflows that reason over business context.',
    'I care about interfaces too. A prediction that nobody understands is not a product, which is why the systems I build tend to end in something visual: a rendered volume, a cited timestamp, a report written in plain language.',
  ],
} as const

export const focusAreas = [
  {
    index: '01',
    title: 'Medical imaging',
    body: 'Classification and boundary segmentation across ultrasound, CT and MRI — EfficientNet backbones, U-Net and U-NetR decoders, and ViT-B/16 attention in PyTorch.',
    tags: ['Segmentation', 'Classification', 'PyTorch'],
  },
  {
    index: '02',
    title: 'Generative & agentic AI',
    body: 'Retrieval-augmented pipelines, tool-using agents and MCP servers over messy real-world data, plus LLM-written radiology reports grounded in model output.',
    tags: ['RAG', 'MCP', 'LLM'],
  },
  {
    index: '03',
    title: 'Model engineering',
    body: 'Evaluation harnesses, validation loops and optimisation passes on live models — the unglamorous work that decides whether a system is trustworthy.',
    tags: ['Evaluation', 'Validation', 'Deployment'],
  },
  {
    index: '04',
    title: 'Software engineering',
    body: 'The full-stack systems the models live in — React and Node front ends, Flask and Express APIs, MongoDB, containerised with Docker and shipped on AWS — on top of solid DSA and OS fundamentals. Plus spatial 3D/VR interfaces in Unreal Engine when output needs to be inspected, not guessed at.',
    tags: ['Full-stack', 'APIs', 'Docker · AWS'],
  },
] as const

export const experience = [
  {
    company: 'Centific Global Technologies',
    role: 'AI Model Engineering Intern',
    period: 'Jun 2026 — Present',
    location: 'Hyderabad, India',
    current: true,
    summary:
      'Model engineering, evaluation and optimisation for real-world applications, working alongside cross-functional delivery teams.',
    points: [
      'Work on AI/ML model development, evaluation and optimisation for real-world applications.',
      'Collaborate with cross-functional teams to support model engineering, testing and performance improvement.',
      'Apply Python and modern AI/ML frameworks across experimentation, validation and deployment workflows.',
    ],
    highlight: {
      title: 'Business Analyst Agent',
      body: 'Designed and built an agent that reasons over business context and returns structured analysis — turning a manual reporting loop into a tool-driven workflow.',
    },
  },
] as const

export const education = {
  school: 'Keshav Memorial Institute of Technology',
  short: 'KMIT',
  degree: 'B.Tech — Computer Science & Engineering',
  specialisation: 'Artificial Intelligence & Machine Learning',
  period: 'Oct 2022 — Jun 2026',
  location: 'Hyderabad, India',
  scoreLabel: 'CGPA',
  score: '8.06 / 10.0',
  coursework: [
    'Machine Learning',
    'Deep Learning',
    'Computer Vision',
    'Natural Language Processing',
    'Data Structures & Algorithms',
    'Databases',
    'Operating Systems',
    'Cloud Computing',
  ],
} as const

export const patent = {
  index: '03',
  label: 'Patent',
  eyebrow: 'Indian Patent Application · Published 2025',
  applicationNo: '202541059395 A',
  title: 'Classification & Segmentation of Breast Cancer Mass in Ultrasound Imagery/Video with 3D Visualisation',
  filed: '20 June 2025',
  published: '27 June 2025',
  jurisdiction: 'India',
  role: 'Co-inventor',
  association: 'Filed in association with KMIT',
  intro:
    'A three-stage pipeline that finds a suspicious mass in ultrasound imagery, draws its boundary precisely, and then rebuilds the result as a volume a clinician can move through.',
  stages: [
    {
      no: 'Stage 01',
      key: 'Classify',
      title: 'Detection across frames',
      body: 'EfficientNet backbones screen ultrasound imagery and video frames for suspicious tissue, keeping the inference path light enough for a clinical setting.',
      stack: ['EfficientNet', 'Transfer learning'],
    },
    {
      no: 'Stage 02',
      key: 'Segment',
      title: 'Boundary extraction',
      body: 'U-Net, U-NetR and ViT-B/16 architectures were trained and compared for tumour segmentation and mass boundary delineation.',
      stack: ['U-Net', 'U-NetR', 'ViT-B/16'],
    },
    {
      no: 'Stage 03',
      key: 'Visualise',
      title: 'Spatial interpretation',
      body: 'Segmentation masks are rendered as an interactive 3D volume in Unreal Engine VR, so a radiologist can inspect the mass spatially instead of reading a flat composite.',
      stack: ['Unreal Engine', 'VR rendering'],
    },
  ],
  verifyUrl: 'https://iprsearch.ipindia.gov.in/PublicSearch/',
  verifyLabel: 'Search the IP India register',
} as const

export type Project = {
  readonly id: string
  readonly name: string
  readonly kind: string
  readonly year: string
  readonly summary: string
  readonly points: readonly string[]
  readonly stack: readonly string[]
  readonly repo: string
  readonly repoLabel: string
  readonly spec: readonly { readonly k: string; readonly v: string }[]
  readonly scene: 'video' | 'volume' | 'oncology'
}

export const projects: readonly Project[] = [
  {
    id: 'video-rag',
    name: 'Agentic Video RAG with MCP',
    kind: 'Retrieval & agents',
    year: '2026',
    summary:
      'Video question answering where every answer carries the timestamp it came from. The model decides which tool to call — ingest, semantic search or clip extraction — from the question itself.',
    points: [
      'End-to-end video question answering over retrieval-augmented generation with timestamp-based retrieval for precise navigation.',
      'Ragie API handles transcription, vector embedding creation and semantic search across video content.',
      'MCP tools expose ingestion, semantic search and automated clip extraction through MoviePy.',
      'An agentic workflow lets the LLM select and call tools autonomously from natural-language intent.',
    ],
    stack: ['Python', 'MCP', 'RAG', 'LLMs', 'Ragie API', 'MoviePy'],
    repo: 'https://github.com/Sushanth18052005/mcp-video-rag',
    repoLabel: 'mcp-video-rag',
    spec: [
      { k: 'Retrieval', v: 'Timestamp-aware semantic search' },
      { k: 'Transcription', v: 'Ragie API' },
      { k: 'Tools', v: 'Ingest · search · clip extraction' },
      { k: 'Agent', v: 'LLM-driven tool selection' },
    ],
    scene: 'video',
  },
  {
    id: 'med3d',
    name: 'GenAI Med3D',
    kind: 'Medical imaging platform',
    year: '2025',
    summary:
      'A web application that segments lungs and liver from medical scans, classifies nodules, and then asks a language model to write the radiology report the numbers imply.',
    points: [
      'Automated lung and liver segmentation with nodule classification from medical scans.',
      'Large language models wired into the deep learning pipeline to generate natural-language radiology reports from imaging results.',
      'Deployed on AWS with Docker for scalable, real-time clinical decision support.',
    ],
    stack: ['MERN', 'Flask', 'Docker', 'AWS', 'GenAI', 'Unreal Engine'],
    repo: 'https://github.com/Sushanth18052005/GenAi_Med3D',
    repoLabel: 'GenAi_Med3D',
    spec: [
      { k: 'Segmentation', v: 'Lung & liver' },
      { k: 'Reporting', v: 'LLM-generated radiology text' },
      { k: 'Delivery', v: 'AWS + Docker' },
      { k: 'Interface', v: 'MERN web app' },
    ],
    scene: 'volume',
  },
  {
    id: 'oncology',
    name: 'Breast Cancer Detection — AI & VR',
    kind: 'Patent-backed research',
    year: '2024',
    summary:
      'Led a five-person team building an AI system that detects breast cancer in ultrasound images and renders the segmentation as an immersive VR volume. The work produced a published Indian patent.',
    points: [
      'Five-member team; AI classification and tumour segmentation using EfficientNet, U-Net, U-NetR and ViT-B/16.',
      'Segmentation results rendered in Unreal Engine VR for 3D tumour visualisation, improving radiologist interpretability.',
      'Directly resulted in Indian Patent Application 202541059395 A.',
    ],
    stack: ['MERN', 'Flask', 'Unreal Engine', 'EfficientNet', 'U-Net', 'ViT-B/16'],
    repo: 'https://github.com/Sushanth18052005/Breast_Cancer_Detection_Visualization',
    repoLabel: 'Breast_Cancer_Detection_Visualization',
    spec: [
      { k: 'Team', v: 'Led 5 engineers' },
      { k: 'Models', v: 'EfficientNet · U-Net · U-NetR · ViT-B/16' },
      { k: 'Rendering', v: 'Unreal Engine VR' },
      { k: 'Outcome', v: 'Indian patent 202541059395 A' },
    ],
    scene: 'oncology',
  },
]

export const toolkit = {
  index: '05',
  label: 'Toolkit',
  groups: [
    {
      title: 'AI & Machine Learning',
      items: ['Machine Learning', 'Deep Learning', 'Transformers', 'LLMs', 'NLP', 'Generative AI', 'RAG', 'Agentic AI', 'MCP', 'Computer Vision'],
    },
    {
      title: 'Frameworks & Models',
      items: ['PyTorch', 'TensorFlow', 'EfficientNet', 'U-Net', 'U-NetR', 'ViT-B/16'],
    },
    {
      title: 'Languages',
      items: ['Python', 'Java', 'C++', 'C', 'JavaScript', 'SQL'],
    },
    {
      title: 'Computer science',
      items: ['Data Structures & Algorithms', 'Operating Systems', 'Databases', 'OOP', 'Cloud Computing'],
    },
    {
      title: 'Platform & Delivery',
      items: ['React.js', 'Node.js', 'Express', 'Flask', 'Docker', 'AWS', 'Unreal Engine', 'Git', 'GitHub'],
    },
    {
      title: 'Data',
      items: ['MongoDB', 'SQL'],
    },
    {
      title: 'Working style',
      items: ['Leadership', 'Teamwork', 'Technical communication', 'Rapid prototyping'],
    },
  ],
} as const

export const recognition = {
  index: '06',
  label: 'Recognition',
  awards: [
    {
      title: 'Centific Premier Hackathon 2.0',
      detail: 'Winner — AI COE stream',
      year: '2026',
    },
    {
      title: 'Smart India Hackathon — internal round',
      detail: 'Top performer, KMIT',
      year: '2025',
    },
    {
      title: 'National level badminton',
      detail: 'Competitive athlete',
      year: '—',
    },
    {
      title: 'Mathematics olympiads',
      detail: 'SIMO · SIPHO · SICHO · Ramanujan',
      year: 'Winner',
    },
  ],
  leadership: [
    {
      title: 'Head of Photography Club, KMIT',
      detail: 'Ran a 50+ member club and organised college-wide events.',
    },
    {
      title: 'Student Council Member, KMIT',
      detail: 'Represented the student body across campus initiatives.',
    },
    {
      title: 'Member, Rotaract Club',
      detail: 'Community service and outreach programmes.',
    },
  ],
} as const

export const contact = {
  index: '07',
  label: 'Contact',
  heading: ['Let us build something', 'worth patenting.'],
  body: 'I am finishing my degree in 2026 and looking for a team that ships — AI/ML or core software engineering. If you are building products that have to survive the real world, I would like to hear about it.',
} as const

export const navLinks = [
  { id: 'profile', label: 'Profile', index: '01' },
  { id: 'experience', label: 'Experience', index: '02' },
  { id: 'patent', label: 'Patent', index: '03' },
  { id: 'work', label: 'Work', index: '04' },
  { id: 'toolkit', label: 'Toolkit', index: '05' },
  { id: 'recognition', label: 'Recognition', index: '06' },
  { id: 'contact', label: 'Contact', index: '07' },
] as const
