

const competencies = [
  // ── CLUSTER 1: Leadership & People Mastery ──
  { id: 'LPM01', cluster: 'Leadership & People Mastery', name: 'Self-Awareness & Authentic Leadership', definition: 'Understanding one\'s own strengths, values, and impact on others to lead with authenticity and consistency.' },
  { id: 'LPM02', cluster: 'Leadership & People Mastery', name: 'Team Development & Coaching', definition: 'Building high-performing teams through structured coaching, feedback, and development conversations.' },
  { id: 'LPM03', cluster: 'Leadership & People Mastery', name: 'Inclusive Leadership', definition: 'Creating environments where diverse perspectives are actively sought, heard, and integrated into decisions.' },
  { id: 'LPM04', cluster: 'Leadership & People Mastery', name: 'Executive Presence & Personal Brand', definition: 'Projecting credibility, confidence, and gravitas in high-stakes situations and across organisational levels.' },
  { id: 'LPM05', cluster: 'Leadership & People Mastery', name: 'Leading Through Change', definition: 'Guiding individuals and teams through uncertainty, resistance, and transformation with clarity and empathy.' },

  // ── CLUSTER 2: Strategic & Commercial Thinking ──
  { id: 'SCT01', cluster: 'Strategic & Commercial Thinking', name: 'Strategic Foresight & Scenario Planning', definition: 'Anticipating future trends, disruptions, and opportunities to position the organisation for long-term advantage.' },
  { id: 'SCT02', cluster: 'Strategic & Commercial Thinking', name: 'Business Model Innovation', definition: 'Designing, testing, and scaling new ways of creating, delivering, and capturing value.' },
  { id: 'SCT03', cluster: 'Strategic & Commercial Thinking', name: 'Growth Strategy & New Markets', definition: 'Identifying and pursuing organic and inorganic growth opportunities across geographies and segments.' },
  { id: 'SCT04', cluster: 'Strategic & Commercial Thinking', name: 'Competitive Intelligence & Positioning', definition: 'Monitoring the competitive landscape and translating insights into differentiated strategic choices.' },
  { id: 'SCT05', cluster: 'Strategic & Commercial Thinking', name: 'Capital Allocation & Investment Logic', definition: 'Evaluating strategic investments, M&A, and resource allocation decisions using financial and strategic criteria.' },

  // ── CLUSTER 3: Digital & AI Fluency ──
  { id: 'DAF01', cluster: 'Digital & AI Fluency', name: 'Digital Business Fluency', definition: 'Understanding how digital technologies reshape industries, operating models, and customer expectations.' },
  { id: 'DAF02', cluster: 'Digital & AI Fluency', name: 'AI for Decision Making', definition: 'Applying AI and machine learning insights to improve the speed, quality, and consistency of business decisions.' },
  { id: 'DAF03', cluster: 'Digital & AI Fluency', name: 'Data-Driven Culture Leadership', definition: 'Building organisational capability to collect, interpret, and act on data at every level.' },
  { id: 'DAF04', cluster: 'Digital & AI Fluency', name: 'Technology Strategy & Governance', definition: 'Making informed choices about technology investment, risk, and governance at the enterprise level.' },
  { id: 'DAF05', cluster: 'Digital & AI Fluency', name: 'AI Ethics & Responsible Innovation', definition: 'Ensuring AI deployments are fair, explainable, and aligned with organisational and societal values.' },

  // ── CLUSTER 4: Innovation & Change ──
  { id: 'INC01', cluster: 'Innovation & Change', name: 'Design Thinking & Human-Centred Innovation', definition: 'Applying empathy-driven problem framing and rapid prototyping to create user-centric solutions.' },
  { id: 'INC02', cluster: 'Innovation & Change', name: 'Agile & Lean Ways of Working', definition: 'Applying iterative, hypothesis-driven methods to accelerate delivery and reduce waste.' },
  { id: 'INC03', cluster: 'Innovation & Change', name: 'Innovation Portfolio Management', definition: 'Balancing core, adjacent, and transformational innovation bets across different time horizons.' },
  { id: 'INC04', cluster: 'Innovation & Change', name: 'Change Architecture & Mobilisation', definition: 'Designing and executing large-scale change programmes that shift mindsets, behaviours, and systems.' },
  { id: 'INC05', cluster: 'Innovation & Change', name: 'Entrepreneurial Mindset & Risk Appetite', definition: 'Cultivating a bias for action, tolerance for ambiguity, and willingness to experiment in established organisations.' },

  // ── CLUSTER 5: Decision Making & Judgement ──
  { id: 'DMJ01', cluster: 'Decision Making & Judgement', name: 'Complex Problem Structuring', definition: 'Breaking down ambiguous, multi-variable problems into tractable components with clear hypotheses.' },
  { id: 'DMJ02', cluster: 'Decision Making & Judgement', name: 'Decision Under Uncertainty', definition: 'Making high-quality decisions with incomplete information using probabilistic thinking and scenario analysis.' },
  { id: 'DMJ03', cluster: 'Decision Making & Judgement', name: 'Ethical Reasoning & Integrity', definition: 'Applying consistent ethical principles to business dilemmas, trade-offs, and stakeholder conflicts.' },
  { id: 'DMJ04', cluster: 'Decision Making & Judgement', name: 'Critical Thinking & Cognitive Bias Awareness', definition: 'Recognising and mitigating cognitive biases that distort individual and group decision making.' },
  { id: 'DMJ05', cluster: 'Decision Making & Judgement', name: 'Systems Thinking', definition: 'Understanding how interdependencies and feedback loops within complex systems produce emergent outcomes.' },

  // ── CLUSTER 6: Customer & Market Centricity ──
  { id: 'CMC01', cluster: 'Customer & Market Centricity', name: 'Customer Insight & Empathy', definition: 'Generating deep understanding of customer needs, behaviours, and unmet pain points through qualitative and quantitative research.' },
  { id: 'CMC02', cluster: 'Customer & Market Centricity', name: 'Brand Strategy & Positioning', definition: 'Building and sustaining brand equity through consistent positioning, messaging, and customer experience.' },
  { id: 'CMC03', cluster: 'Customer & Market Centricity', name: 'Commercial Acumen & P&L Ownership', definition: 'Managing revenue, margin, and cost levers to deliver sustainable commercial performance.' },
  { id: 'CMC04', cluster: 'Customer & Market Centricity', name: 'Go-to-Market Strategy', definition: 'Designing and executing channel, pricing, and distribution strategies that drive market penetration.' },
  { id: 'CMC05', cluster: 'Customer & Market Centricity', name: 'Key Account & Partnership Management', definition: 'Building strategic relationships with high-value customers and partners to create mutual long-term value.' },

  // ── CLUSTER 7: Operational & Financial Excellence ──
  { id: 'OFE01', cluster: 'Operational & Financial Excellence', name: 'Financial Statement Fluency', definition: 'Reading, interpreting, and using financial statements to inform operational and strategic decisions.' },
  { id: 'OFE02', cluster: 'Operational & Financial Excellence', name: 'Operational Excellence & Process Improvement', definition: 'Identifying and eliminating waste, bottlenecks, and variation in core business processes.' },
  { id: 'OFE03', cluster: 'Operational & Financial Excellence', name: 'Supply Chain & Ecosystem Thinking', definition: 'Optimising end-to-end value chains including suppliers, partners, and last-mile delivery.' },
  { id: 'OFE04', cluster: 'Operational & Financial Excellence', name: 'Risk Management & Resilience', definition: 'Identifying, quantifying, and mitigating strategic, operational, and financial risks.' },
  { id: 'OFE05', cluster: 'Operational & Financial Excellence', name: 'ESG & Sustainable Business', definition: 'Integrating environmental, social, and governance considerations into strategy and operations.' },

  // ── CLUSTER 8: Influence, Communication & Stakeholder Management ──
  { id: 'ICS01', cluster: 'Influence, Communication & Stakeholder Management', name: 'Executive Communication & Storytelling', definition: 'Crafting and delivering compelling narratives that inform, inspire, and drive action at senior levels.' },
  { id: 'ICS02', cluster: 'Influence, Communication & Stakeholder Management', name: 'Negotiation & Persuasion', definition: 'Achieving favourable outcomes in complex, multi-party negotiations while preserving relationships.' },
  { id: 'ICS03', cluster: 'Influence, Communication & Stakeholder Management', name: 'Stakeholder Mapping & Management', definition: 'Identifying, prioritising, and engaging stakeholders to build alignment and reduce resistance.' },
  { id: 'ICS04', cluster: 'Influence, Communication & Stakeholder Management', name: 'Cross-Cultural Leadership', definition: 'Leading effectively across cultural, geographic, and organisational boundaries.' },
  { id: 'ICS05', cluster: 'Influence, Communication & Stakeholder Management', name: 'Boardroom & C-Suite Communication', definition: 'Presenting with authority and precision to boards, investors, and executive committees.' },
];

module.exports = competencies;