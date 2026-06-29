// Default competency framework — sourced from PIS_Default_Competency_Framework.xlsx
// This is the system default used automatically for every tenant until they
// upload their own framework (see competencyFrameworkService.js).

const competencies = [
  // ── CLUSTER 1: Leadership & People Mastery ──
  { id: 'LPM01', cluster: 'Leadership & People Mastery', name: 'Self-awareness & Reflective Practice', definition: 'The capacity to observe one\'s own patterns, biases, and impact on others, and to learn deliberately from experience.' },
  { id: 'LPM02', cluster: 'Leadership & People Mastery', name: 'Leading High-Performance Teams', definition: 'Setting direction, designing for psychological safety and accountability, and getting the best out of a diverse team.' },
  { id: 'LPM03', cluster: 'Leadership & People Mastery', name: 'Coaching & Developing Others', definition: 'Growing people\'s capability through structured coaching, stretch assignments, and timely feedback.' },
  { id: 'LPM04', cluster: 'Leadership & People Mastery', name: 'Inclusive & Cross-cultural Leadership', definition: 'Leading across cultures, generations, and identities such that every team member contributes their best.' },
  { id: 'LPM05', cluster: 'Leadership & People Mastery', name: 'Leading Through Change', definition: 'Mobilising people and resources through ambiguity, disruption, and transformation.' },

  // ── CLUSTER 2: Strategic & Commercial Thinking ──
  { id: 'SCT01', cluster: 'Strategic & Commercial Thinking', name: 'Business Model Thinking', definition: 'Designing and challenging the logic by which an organisation creates, delivers, and captures value.' },
  { id: 'SCT02', cluster: 'Strategic & Commercial Thinking', name: 'Competitive Strategy & Industry Analysis', definition: 'Reading the competitive landscape, anticipating moves, and choosing where and how to compete.' },
  { id: 'SCT03', cluster: 'Strategic & Commercial Thinking', name: 'Growth Strategy & New Markets', definition: 'Identifying, sizing, and prioritising growth opportunities — organic, M&A, and partnerships.' },
  { id: 'SCT04', cluster: 'Strategic & Commercial Thinking', name: 'Capital Allocation & Portfolio Choices', definition: 'Deciding where to invest, divest, harvest, or experiment — and explaining why.' },
  { id: 'SCT05', cluster: 'Strategic & Commercial Thinking', name: 'Long-range Strategic Planning', definition: 'Looking 3–10 years out and shaping resource allocation, partnerships, and capabilities accordingly.' },

  // ── CLUSTER 3: Digital & AI Fluency ──
  { id: 'DAF01', cluster: 'Digital & AI Fluency', name: 'Digital Business Fluency', definition: 'Understanding how digital technologies, platforms, and ecosystems change competitive dynamics.' },
  { id: 'DAF02', cluster: 'Digital & AI Fluency', name: 'AI for Decision Making', definition: 'Using AI capabilities (predictive models, foundation models, agents) as commercial decision aids.' },
  { id: 'DAF03', cluster: 'Digital & AI Fluency', name: 'Data-Driven Reasoning', definition: 'Framing questions, interpreting data, and avoiding common analytical errors.' },
  { id: 'DAF04', cluster: 'Digital & AI Fluency', name: 'Cybersecurity & Digital Risk', definition: 'Understanding cyber and digital risk as a business issue and overseeing risk posture credibly.' },
  { id: 'DAF05', cluster: 'Digital & AI Fluency', name: 'Leading Digital Transformation', definition: 'Orchestrating people, process, and technology change to realise digital value at scale.' },

  // ── CLUSTER 4: Innovation & Change ──
  { id: 'INC01', cluster: 'Innovation & Change', name: 'Customer Discovery & Problem Framing', definition: 'Finding and framing real customer problems worth solving before committing build resources.' },
  { id: 'INC02', cluster: 'Innovation & Change', name: 'Design Thinking & Service Design', definition: 'Using human-centred and service-design methods to imagine and prototype new experiences.' },
  { id: 'INC03', cluster: 'Innovation & Change', name: 'Experimentation & Lean Startup', definition: 'Running disciplined experiments to validate or invalidate hypotheses cheaply.' },
  { id: 'INC04', cluster: 'Innovation & Change', name: 'Organisational Change Management', definition: 'Sequencing the people, process, and structural changes needed to land transformation.' },
  { id: 'INC05', cluster: 'Innovation & Change', name: 'Ambidexterity & Corporate Innovation', definition: 'Running today\'s business and tomorrow\'s business in parallel without one starving the other.' },

  // ── CLUSTER 5: Decision Making & Judgement ──
  { id: 'DMJ01', cluster: 'Decision Making & Judgement', name: 'Analytical & Critical Thinking', definition: 'Decomposing problems, evaluating evidence, and reasoning to defensible conclusions.' },
  { id: 'DMJ02', cluster: 'Decision Making & Judgement', name: 'Decision Under Uncertainty', definition: 'Making timely, defensible decisions when data is incomplete and consequences are large.' },
  { id: 'DMJ03', cluster: 'Decision Making & Judgement', name: 'Scenario Planning & Futures', definition: 'Imagining multiple plausible futures and stress-testing strategy against each.' },
  { id: 'DMJ04', cluster: 'Decision Making & Judgement', name: 'Risk & Resilience', definition: 'Identifying, sizing, and pre-empting risks; building organisations that bend rather than break.' },
  { id: 'DMJ05', cluster: 'Decision Making & Judgement', name: 'Ethical Judgement & Integrity', definition: 'Recognising ethical issues, reasoning through dilemmas, and choosing rightly even when costly.' },

  // ── CLUSTER 6: Customer & Market Centricity ──
  { id: 'CMC01', cluster: 'Customer & Market Centricity', name: 'Customer Insight & Empathy', definition: 'Knowing customers as people — their context, jobs, and frustrations — and translating insight into action.' },
  { id: 'CMC02', cluster: 'Customer & Market Centricity', name: 'Brand & Reputation Strategy', definition: 'Building and protecting brand and reputation as a long-term value driver.' },
  { id: 'CMC03', cluster: 'Customer & Market Centricity', name: 'Pricing & Value Capture', definition: 'Setting prices and packaging to capture a fair share of customer value created.' },
  { id: 'CMC04', cluster: 'Customer & Market Centricity', name: 'Marketing & Demand Generation', definition: 'Building demand systems — content, channels, and campaigns — that convert efficiently to revenue.' },
  { id: 'CMC05', cluster: 'Customer & Market Centricity', name: 'Customer Experience Design', definition: 'Designing end-to-end customer journeys that deliver on the brand promise and create advocates.' },

  // ── CLUSTER 7: Operational & Financial Excellence ──
  { id: 'OFE01', cluster: 'Operational & Financial Excellence', name: 'Financial Acumen for Non-finance Leaders', definition: 'Reading the financial statements, understanding the drivers, and using finance as a leadership tool.' },
  { id: 'OFE02', cluster: 'Operational & Financial Excellence', name: 'Performance Management & KPIs', definition: 'Designing measurement systems that drive the right behaviours and surface the right signals.' },
  { id: 'OFE03', cluster: 'Operational & Financial Excellence', name: 'Operations Strategy & Excellence', definition: 'Designing operations for cost, quality, speed, and flexibility trade-offs that match strategy.' },
  { id: 'OFE04', cluster: 'Operational & Financial Excellence', name: 'Supply Chain & Procurement', definition: 'Designing resilient, cost-effective supply chains and using procurement strategically.' },
  { id: 'OFE05', cluster: 'Operational & Financial Excellence', name: 'Project & Programme Leadership', definition: 'Delivering complex, multi-stakeholder programmes on time, on scope, and on value.' },

  // ── CLUSTER 8: Influence, Communication & Stakeholder Management ──
  { id: 'ICS01', cluster: 'Influence, Communication & Stakeholder Management', name: 'Executive Presence & Communication', definition: 'Showing up with clarity, credibility, and warmth in high-stakes settings.' },
  { id: 'ICS02', cluster: 'Influence, Communication & Stakeholder Management', name: 'Negotiation', definition: 'Creating and claiming value in negotiations across deals, partnerships, and internal arguments.' },
  { id: 'ICS03', cluster: 'Influence, Communication & Stakeholder Management', name: 'Storytelling with Data', definition: 'Translating analysis into narrative that moves audiences to action.' },
  { id: 'ICS04', cluster: 'Influence, Communication & Stakeholder Management', name: 'Stakeholder & Coalition Building', definition: 'Mapping stakeholders, building coalitions, and sequencing influence to land important moves.' },
  { id: 'ICS05', cluster: 'Influence, Communication & Stakeholder Management', name: 'Board & Investor Engagement', definition: 'Engaging boards, investors, and analysts credibly and consistently.' },

];

module.exports = competencies;