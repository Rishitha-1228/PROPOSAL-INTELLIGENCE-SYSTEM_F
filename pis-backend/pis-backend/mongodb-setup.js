'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const dns      = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

if (!process.env.MONGODB_URI) {
  console.error('❌  MONGODB_URI not found. Make sure .env is present and dotenv is installed.');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  first_name:  { type: String, required: true },
  last_name:   { type: String, required: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  password:    { type: String, required: true },
  role:        { type: String, enum: ['admin', 'editor', 'viewer'], default: 'editor' },
  institution: { type: String, default: 'My Institution' },
  is_active:   { type: Boolean, default: true },
  last_login:  { type: Date }
}, { timestamps: true });

const CompetencySchema = new mongoose.Schema({
  id:         { type: String, required: true, unique: true },
  cluster:    { type: String, required: true },
  name:       { type: String, required: true },
  definition: { type: String, required: true }
}, { timestamps: true });

const ModuleSchema = new mongoose.Schema({
  tenant_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  module_id:         { type: String, required: true },
  title:             { type: String, required: true },
  short_description: { type: String, required: true },
  domain:            { type: String, required: true },
  duration_hrs:      { type: Number, required: true },
  format:            { type: String },
  audience_level:    { type: String, enum: ['Mid', 'Senior', 'Top'] },
  competencies:      [String],
  lead_faculty:      String,
  industry_tags:     [String],
  times_used:        { type: Number, default: 0 },
  avg_nps:           { type: Number, default: 0 },
  status:            { type: String, enum: ['Active', 'Archived'], default: 'Active' }
}, { timestamps: true });

const OpportunitySchema = new mongoose.Schema({
  tenant_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client_name: { type: String, required: true },
  brief_text:  { type: String, required: true },

  interpreted: {
    goals:               [String],
    audience:            String,
    constraints:         [String],
    themes:              [String],
    pedagogical_posture: String,
    confidence_score:    Number,
    ambiguities:         [String]
  },

  questions: [{
    theme_code:    String,
    question_text: String,
    rationale:     String,
    status:        { type: String, default: 'selected' },
    answer_text:   String,
    capture_state: { type: String, default: 'not_asked' }
  }],

  competencies: [{
    competency_id:   String,
    competency_name: String,
    fit_score:       Number,
    rationale:       String
  }],

  modules: [{
    module_id:    String,
    title:        String,
    domain:       String,
    duration_hrs: Number,
    faculty:      String,
    evidence:     String,
    nps:          Number
  }],

  architecture: { phases: mongoose.Schema.Types.Mixed },
  approach_note: {
    sections: mongoose.Schema.Types.Mixed,
    version:  { type: Number, default: 1 }
  },

  score: {
    total:     Number,
    breakdown: mongoose.Schema.Types.Mixed,
    gaps:      [String]
  },

  status:   { type: String, default: 'new' },
  outcome:  { type: String, enum: ['pending', 'won', 'lost'], default: 'pending' },
  due_date: Date

}, { timestamps: true });

const LLMCallSchema = new mongoose.Schema({
  tenant_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  opportunity_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
  agent:          String,
  model:          String,
  input_tokens:   Number,
  output_tokens:  Number,
  cost_usd:       Number,
  latency_ms:     Number,
  success:        Boolean,
  error:          String
}, { timestamps: true });

const User       = mongoose.model('User',       UserSchema);
const Competency = mongoose.model('Competency', CompetencySchema);
const Module     = mongoose.model('Module',     ModuleSchema);
const Opportunity= mongoose.model('Opportunity',OpportunitySchema);
const LLMCall    = mongoose.model('LLMCall',    LLMCallSchema);


const competenciesData = [
  { id: 'LPM01', cluster: 'Leadership & People Mastery', name: 'Self-Awareness & Authentic Leadership',   definition: 'Understanding one\'s own strengths, values, and impact on others to lead with authenticity and consistency.' },
  { id: 'LPM02', cluster: 'Leadership & People Mastery', name: 'Team Development & Coaching',              definition: 'Building high-performing teams through structured coaching, feedback, and development conversations.' },
  { id: 'LPM03', cluster: 'Leadership & People Mastery', name: 'Inclusive Leadership',                     definition: 'Creating environments where diverse perspectives are actively sought, heard, and integrated into decisions.' },
  { id: 'LPM04', cluster: 'Leadership & People Mastery', name: 'Executive Presence & Personal Brand',      definition: 'Projecting credibility, confidence, and gravitas in high-stakes situations and across organisational levels.' },
  { id: 'LPM05', cluster: 'Leadership & People Mastery', name: 'Leading Through Change',                   definition: 'Guiding individuals and teams through uncertainty, resistance, and transformation with clarity and empathy.' },

  { id: 'SCT01', cluster: 'Strategic & Commercial Thinking', name: 'Strategic Foresight & Scenario Planning', definition: 'Anticipating future trends, disruptions, and opportunities to position the organisation for long-term advantage.' },
  { id: 'SCT02', cluster: 'Strategic & Commercial Thinking', name: 'Business Model Innovation',               definition: 'Designing, testing, and scaling new ways of creating, delivering, and capturing value.' },
  { id: 'SCT03', cluster: 'Strategic & Commercial Thinking', name: 'Growth Strategy & New Markets',           definition: 'Identifying and pursuing organic and inorganic growth opportunities across geographies and segments.' },
  { id: 'SCT04', cluster: 'Strategic & Commercial Thinking', name: 'Competitive Intelligence & Positioning',  definition: 'Monitoring the competitive landscape and translating insights into differentiated strategic choices.' },
  { id: 'SCT05', cluster: 'Strategic & Commercial Thinking', name: 'Capital Allocation & Investment Logic',   definition: 'Evaluating strategic investments, M&A, and resource allocation decisions using financial and strategic criteria.' },

  { id: 'DAF01', cluster: 'Digital & AI Fluency', name: 'Digital Business Fluency',          definition: 'Understanding how digital technologies reshape industries, operating models, and customer expectations.' },
  { id: 'DAF02', cluster: 'Digital & AI Fluency', name: 'AI for Decision Making',             definition: 'Applying AI and machine learning insights to improve the speed, quality, and consistency of business decisions.' },
  { id: 'DAF03', cluster: 'Digital & AI Fluency', name: 'Data-Driven Culture Leadership',     definition: 'Building organisational capability to collect, interpret, and act on data at every level.' },
  { id: 'DAF04', cluster: 'Digital & AI Fluency', name: 'Technology Strategy & Governance',   definition: 'Making informed choices about technology investment, risk, and governance at the enterprise level.' },
  { id: 'DAF05', cluster: 'Digital & AI Fluency', name: 'AI Ethics & Responsible Innovation', definition: 'Ensuring AI deployments are fair, explainable, and aligned with organisational and societal values.' },

  { id: 'INC01', cluster: 'Innovation & Change', name: 'Design Thinking & Human-Centred Innovation', definition: 'Applying empathy-driven problem framing and rapid prototyping to create user-centric solutions.' },
  { id: 'INC02', cluster: 'Innovation & Change', name: 'Agile & Lean Ways of Working',               definition: 'Applying iterative, hypothesis-driven methods to accelerate delivery and reduce waste.' },
  { id: 'INC03', cluster: 'Innovation & Change', name: 'Innovation Portfolio Management',            definition: 'Balancing core, adjacent, and transformational innovation bets across different time horizons.' },
  { id: 'INC04', cluster: 'Innovation & Change', name: 'Change Architecture & Mobilisation',         definition: 'Designing and executing large-scale change programmes that shift mindsets, behaviours, and systems.' },
  { id: 'INC05', cluster: 'Innovation & Change', name: 'Entrepreneurial Mindset & Risk Appetite',    definition: 'Cultivating a bias for action, tolerance for ambiguity, and willingness to experiment in established organisations.' },

  { id: 'DMJ01', cluster: 'Decision Making & Judgement', name: 'Complex Problem Structuring',           definition: 'Breaking down ambiguous, multi-variable problems into tractable components with clear hypotheses.' },
  { id: 'DMJ02', cluster: 'Decision Making & Judgement', name: 'Decision Under Uncertainty',            definition: 'Making high-quality decisions with incomplete information using probabilistic thinking and scenario analysis.' },
  { id: 'DMJ03', cluster: 'Decision Making & Judgement', name: 'Ethical Reasoning & Integrity',         definition: 'Applying consistent ethical principles to business dilemmas, trade-offs, and stakeholder conflicts.' },
  { id: 'DMJ04', cluster: 'Decision Making & Judgement', name: 'Critical Thinking & Cognitive Bias Awareness', definition: 'Recognising and mitigating cognitive biases that distort individual and group decision making.' },
  { id: 'DMJ05', cluster: 'Decision Making & Judgement', name: 'Systems Thinking',                     definition: 'Understanding how interdependencies and feedback loops within complex systems produce emergent outcomes.' },

  { id: 'CMC01', cluster: 'Customer & Market Centricity', name: 'Customer Insight & Empathy',          definition: 'Generating deep understanding of customer needs, behaviours, and unmet pain points through qualitative and quantitative research.' },
  { id: 'CMC02', cluster: 'Customer & Market Centricity', name: 'Brand Strategy & Positioning',        definition: 'Building and sustaining brand equity through consistent positioning, messaging, and customer experience.' },
  { id: 'CMC03', cluster: 'Customer & Market Centricity', name: 'Commercial Acumen & P&L Ownership',   definition: 'Managing revenue, margin, and cost levers to deliver sustainable commercial performance.' },
  { id: 'CMC04', cluster: 'Customer & Market Centricity', name: 'Go-to-Market Strategy',               definition: 'Designing and executing channel, pricing, and distribution strategies that drive market penetration.' },
  { id: 'CMC05', cluster: 'Customer & Market Centricity', name: 'Key Account & Partnership Management',definition: 'Building strategic relationships with high-value customers and partners to create mutual long-term value.' },

  { id: 'OFE01', cluster: 'Operational & Financial Excellence', name: 'Financial Statement Fluency',              definition: 'Reading, interpreting, and using financial statements to inform operational and strategic decisions.' },
  { id: 'OFE02', cluster: 'Operational & Financial Excellence', name: 'Operational Excellence & Process Improvement', definition: 'Identifying and eliminating waste, bottlenecks, and variation in core business processes.' },
  { id: 'OFE03', cluster: 'Operational & Financial Excellence', name: 'Supply Chain & Ecosystem Thinking',        definition: 'Optimising end-to-end value chains including suppliers, partners, and last-mile delivery.' },
  { id: 'OFE04', cluster: 'Operational & Financial Excellence', name: 'Risk Management & Resilience',             definition: 'Identifying, quantifying, and mitigating strategic, operational, and financial risks.' },
  { id: 'OFE05', cluster: 'Operational & Financial Excellence', name: 'ESG & Sustainable Business',               definition: 'Integrating environmental, social, and governance considerations into strategy and operations.' },

  { id: 'ICS01', cluster: 'Influence, Communication & Stakeholder Management', name: 'Executive Communication & Storytelling', definition: 'Crafting and delivering compelling narratives that inform, inspire, and drive action at senior levels.' },
  { id: 'ICS02', cluster: 'Influence, Communication & Stakeholder Management', name: 'Negotiation & Persuasion',               definition: 'Achieving favourable outcomes in complex, multi-party negotiations while preserving relationships.' },
  { id: 'ICS03', cluster: 'Influence, Communication & Stakeholder Management', name: 'Stakeholder Mapping & Management',       definition: 'Identifying, prioritising, and engaging stakeholders to build alignment and reduce resistance.' },
  { id: 'ICS04', cluster: 'Influence, Communication & Stakeholder Management', name: 'Cross-Cultural Leadership',              definition: 'Leading effectively across cultural, geographic, and organisational boundaries.' },
  { id: 'ICS05', cluster: 'Influence, Communication & Stakeholder Management', name: 'Boardroom & C-Suite Communication',      definition: 'Presenting with authority and precision to boards, investors, and executive committees.' },
];

const modulesData = [
  { module_id:'MOD001', title:'AI for the C-Suite',                       short_description:'Equips senior leaders to evaluate AI opportunities, govern AI deployments, and lead AI-enabled strategy. Combines frameworks with live case discussions from FMCG, banking, and tech sectors.',                                                                   domain:'Digital & AI',              duration_hrs:3,   format:'Case Discussion', audience_level:'Top',    competencies:['DAF01','DAF02','SCT01'],          lead_faculty:'Prof. Sharma', industry_tags:['Technology','BFSI','FMCG'],                   times_used:12, avg_nps:8.4 },
  { module_id:'MOD002', title:'Leading High-Performance Teams',           short_description:'Practical frameworks for building, motivating, and sustaining high-performance teams in complex matrix organisations. Includes 360-degree feedback exercise.',                                                                                                      domain:'Leadership & People',       duration_hrs:2.5, format:'Workshop',        audience_level:'Senior', competencies:['LPM02','LPM03','LPM05'],          lead_faculty:'Prof. Mehta',  industry_tags:['All sectors'],                                times_used:18, avg_nps:8.2 },
  { module_id:'MOD003', title:'Strategic Foresight & Scenario Planning',  short_description:'Structured methodology for building 3-5 year strategic scenarios. Participants apply the framework to their own business unit using live industry data.',                                                                                                          domain:'Strategy & Commercial',     duration_hrs:3,   format:'Simulation',      audience_level:'Senior', competencies:['SCT01','SCT03','DMJ02'],          lead_faculty:'Prof. Rao',    industry_tags:['All sectors','Manufacturing','Pharma'],       times_used:9,  avg_nps:8.6 },
  { module_id:'MOD004', title:'Commercial Strategy in Disruption',        short_description:'How to reframe commercial strategy when incumbent business models are under threat. Uses disruption cases from Indian and global markets.',                                                                                                                           domain:'Strategy & Commercial',     duration_hrs:2.5, format:'Case Discussion', audience_level:'Senior', competencies:['SCT02','SCT03','CMC03'],          lead_faculty:'Prof. Nair',   industry_tags:['FMCG','Retail','Technology'],                 times_used:14, avg_nps:7.9 },
  { module_id:'MOD005', title:'Data-Driven Decision Making',               short_description:'Builds comfort with data interpretation and analytical frameworks for senior leaders without deep technical backgrounds. Includes hands-on dashboard exercises.',                                                                                                    domain:'Digital & AI',              duration_hrs:2,   format:'Workshop',        audience_level:'Mid',    competencies:['DAF03','DMJ01','DAF02'],          lead_faculty:'Prof. Desai',  industry_tags:['All sectors'],                                times_used:22, avg_nps:8.0 },
  { module_id:'MOD006', title:'Behavioural Change for Leaders',           short_description:'Evidence-based frameworks for driving sustainable behaviour change in individuals and organisations. Draws on behavioural economics and neuroscience.',                                                                                                              domain:'Leadership & People',       duration_hrs:2.5, format:'Workshop',        audience_level:'Senior', competencies:['LPM05','INC04','LPM02'],          lead_faculty:'Prof. Rao',    industry_tags:['All sectors'],                                times_used:11, avg_nps:7.8 },
  { module_id:'MOD007', title:'Growth Strategy Simulation',               short_description:'Immersive business simulation where teams compete to grow market share in a contested B2B market. Debriefed against real growth strategy frameworks.',                                                                                                              domain:'Strategy & Commercial',     duration_hrs:3,   format:'Simulation',      audience_level:'Senior', competencies:['SCT03','CMC03','DMJ02'],          lead_faculty:'Prof. Nair',   industry_tags:['FMCG','B2B Services','Manufacturing'],        times_used:8,  avg_nps:8.5 },
  { module_id:'MOD008', title:'Executive Presence & Communication',       short_description:'Developing the communication skills, gravitas, and presence required to influence at the C-suite and board level. Includes recorded practice sessions.',                                                                                                           domain:'Communication & Influence', duration_hrs:1.5, format:'Workshop',        audience_level:'Senior', competencies:['ICS01','LPM04','ICS05'],          lead_faculty:'Prof. Sharma', industry_tags:['All sectors'],                                times_used:16, avg_nps:8.2 },
  { module_id:'MOD009', title:'Innovation & Design Thinking',             short_description:'End-to-end design thinking process applied to a real business challenge brought by participants. Teams prototype and pitch solutions on day 2.',                                                                                                                     domain:'Innovation & Change',       duration_hrs:4,   format:'Workshop',        audience_level:'Mid',    competencies:['INC01','INC05','DMJ01'],          lead_faculty:'Prof. Mehta',  industry_tags:['Technology','Consumer','Healthcare'],         times_used:13, avg_nps:8.3 },
  { module_id:'MOD010', title:'Financial Acumen for Non-Finance Leaders', short_description:'Builds financial literacy for senior leaders from non-finance backgrounds. Covers P&L reading, capital allocation, and investment logic through real case studies.',                                                                                               domain:'Finance & Operations',      duration_hrs:3,   format:'Case Discussion', audience_level:'Senior', competencies:['OFE01','CMC03','SCT05'],          lead_faculty:'Prof. Desai',  industry_tags:['All sectors'],                                times_used:19, avg_nps:8.1 },
  { module_id:'MOD011', title:'Leading AI-Enabled Teams',                 short_description:'Prepares leaders to manage teams that work alongside AI tools. Covers role redesign, upskilling pathways, and the human-AI collaboration model.',                                                                                                                  domain:'Digital & AI',              duration_hrs:2,   format:'Workshop',        audience_level:'Senior', competencies:['DAF02','LPM02','DAF01'],          lead_faculty:'Prof. Nair',   industry_tags:['Technology','BFSI','Telecom'],                times_used:7,  avg_nps:8.0 },
  { module_id:'MOD012', title:'Stakeholder Management & Influence',       short_description:'Frameworks for mapping, prioritising, and engaging complex stakeholder ecosystems. Includes negotiation simulation with cross-functional stakeholders.',                                                                                                            domain:'Communication & Influence', duration_hrs:2,   format:'Simulation',      audience_level:'Senior', competencies:['ICS03','ICS02','LPM03'],          lead_faculty:'Prof. Sharma', industry_tags:['All sectors'],                                times_used:15, avg_nps:7.9 },
  { module_id:'MOD013', title:'Customer Centricity & Market Insight',     short_description:'Structured approach to generating customer insight and translating it into product, service, and experience decisions. Uses field research and ethnography methods.',                                                                                               domain:'Marketing & Customer',      duration_hrs:2.5, format:'Workshop',        audience_level:'Mid',    competencies:['CMC01','CMC04','INC01'],          lead_faculty:'Prof. Mehta',  industry_tags:['FMCG','Retail','Consumer'],                   times_used:10, avg_nps:8.1 },
  { module_id:'MOD014', title:'Agile Leadership & Ways of Working',       short_description:'Introduces agile principles for senior leaders — not just for tech teams. Covers sprint planning, backlog prioritisation, and building agile culture.',                                                                                                            domain:'Innovation & Change',       duration_hrs:2,   format:'Workshop',        audience_level:'Senior', competencies:['INC02','INC04','LPM05'],          lead_faculty:'Prof. Rao',    industry_tags:['Technology','BFSI','All sectors'],            times_used:11, avg_nps:7.8 },
  { module_id:'MOD015', title:'ESG Strategy & Sustainable Business',      short_description:'Building ESG frameworks that create shareholder value while meeting stakeholder expectations. Covers reporting standards, materiality assessment, and green strategy.',                                                                                            domain:'Sustainability',            duration_hrs:2,   format:'Case Discussion', audience_level:'Senior', competencies:['OFE05','SCT01','DMJ03'],          lead_faculty:'Prof. Desai',  industry_tags:['Manufacturing','Energy','FMCG'],              times_used:6,  avg_nps:7.9 },
  { module_id:'MOD016', title:'Negotiation Masterclass',                  short_description:'Advanced negotiation skills for senior leaders dealing with complex multi-party deals. Combines theory with live negotiation simulations.',                                                                                                                        domain:'Communication & Influence', duration_hrs:3,   format:'Simulation',      audience_level:'Top',    competencies:['ICS02','ICS03','DMJ02'],          lead_faculty:'Prof. Sharma', industry_tags:['All sectors'],                                times_used:9,  avg_nps:8.6 },
  { module_id:'MOD017', title:'Operational Excellence & Process Improvement', short_description:'Lean and Six Sigma principles applied to service and manufacturing operations. Includes a live process improvement project.',                                                                                                                                domain:'Finance & Operations',      duration_hrs:3,   format:'Workshop',        audience_level:'Mid',    competencies:['OFE02','OFE03','DMJ01'],          lead_faculty:'Prof. Nair',   industry_tags:['Manufacturing','Logistics','Healthcare'],     times_used:14, avg_nps:8.0 },
  { module_id:'MOD018', title:'Cross-Cultural Leadership',                short_description:'Leading across cultures in multinational environments. Covers cultural intelligence frameworks, communication styles, and managing distributed teams.',                                                                                                              domain:'Leadership & People',       duration_hrs:1.5, format:'Workshop',        audience_level:'Senior', competencies:['ICS04','LPM03','ICS01'],          lead_faculty:'Prof. Mehta',  industry_tags:['All sectors','MNC'],                          times_used:8,  avg_nps:7.9 },
  { module_id:'MOD019', title:'Risk Management & Business Resilience',    short_description:'Enterprise risk identification, quantification, and mitigation frameworks. Includes a crisis simulation exercise.',                                                                                                                                               domain:'Finance & Operations',      duration_hrs:2.5, format:'Simulation',      audience_level:'Senior', competencies:['OFE04','DMJ02','SCT01'],          lead_faculty:'Prof. Desai',  industry_tags:['BFSI','Manufacturing','All sectors'],         times_used:10, avg_nps:8.1 },
  { module_id:'MOD020', title:'AI Commercial Strategy Capstone',          short_description:'Participants apply AI strategy frameworks to a real business challenge from their organisation. Teams present to a panel of faculty and peers.',                                                                                                                  domain:'Digital & AI',              duration_hrs:4,   format:'Capstone',        audience_level:'Top',    competencies:['DAF02','SCT03','DAF01'],          lead_faculty:'Prof. Rao',    industry_tags:['All sectors'],                                times_used:5,  avg_nps:8.8 },
];

const usersData = [
  { first_name:'Admin',  last_name:'User',   email:'admin@pis.com',  password:'Admin1234!',  role:'admin',  institution:'PIS Institute' },
  { first_name:'Editor', last_name:'User',   email:'editor@pis.com', password:'Editor1234!', role:'editor', institution:'PIS Institute' },
  { first_name:'Viewer', last_name:'User',   email:'viewer@pis.com', password:'Viewer1234!', role:'viewer', institution:'PIS Institute' },
];

function makeSampleOpportunities(adminId) {
  return [
    {
      tenant_id:   adminId,
      client_name: 'TechCorp Industries',
      brief_text:  'We need a 3-day leadership programme for our top 40 senior managers (VP and above). The focus should be on strategic thinking, AI fluency, and executive communication. Our leaders are technically strong but struggle with ambiguity and board-level presence.',
      status:      'questions_generated',
      outcome:     'pending',
      due_date:    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now

      interpreted: {
        goals: [
          'Develop strategic thinking capabilities across VP-level leaders',
          'Build AI fluency and comfort with AI-driven decision making',
          'Strengthen executive communication and boardroom presence',
          'Improve ability to operate under ambiguity'
        ],
        audience:   '40 senior managers at VP level and above, technically strong backgrounds',
        constraints: ['3-day duration', 'cohort of 40 participants'],
        themes:     ['Strategic Leadership', 'AI Fluency', 'Executive Communication', 'Ambiguity Management'],
        pedagogical_posture: 'Action-learning with real business challenges; peer learning among experienced leaders',
        confidence_score: 87,
        ambiguities: [
          'Industry verticals represented in the cohort',
          'Whether AI fluency means literacy or hands-on application',
          'Desired outcomes measurable post-programme'
        ]
      },

      questions: [
        { theme_code: 'AI_FLUENCY',   question_text: 'When you say AI fluency, do you want leaders to understand AI conceptually, or to be hands-on with tools like ChatGPT and Copilot in their daily work?', rationale: 'This determines whether we deploy literacy modules or applied AI workshops.',  status: 'selected', capture_state: 'not_asked' },
        { theme_code: 'AUDIENCE',     question_text: 'Are the 40 participants all from the same business unit, or cross-functional? Are there prior relationships or is this a new cohort?',                   rationale: 'Cross-functional cohorts benefit from peer learning designs; siloed ones need more scaffolding.', status: 'selected', capture_state: 'not_asked' },
        { theme_code: 'MEASUREMENT',  question_text: 'What does success look like 90 days after the programme? Any specific behavioural shifts or business metrics you would use to evaluate impact?',        rationale: 'Anchors design to measurable outcomes and helps us frame the capstone activity.',  status: 'selected', capture_state: 'not_asked' },
      ]
    },
    {
      tenant_id:   adminId,
      client_name: 'Meridian Bank',
      brief_text:  'Looking for a half-day session on risk management and decision making for our credit committee — 12 senior directors. They need to sharpen their ability to make high-quality decisions under regulatory uncertainty.',
      status:      'new',
      outcome:     'pending',
      due_date:    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    }
  ];
}



async function ensureIndexes() {
  await User.collection.createIndex({ email: 1 },       { unique: true });
  await Competency.collection.createIndex({ id: 1 },      { unique: true });
  await Competency.collection.createIndex({ cluster: 1 });
  await Module.collection.createIndex({ tenant_id: 1, module_id: 1 });
  await Module.collection.createIndex({ domain: 1 });
  await Module.collection.createIndex({ competencies: 1 });
  await Module.collection.createIndex({ audience_level: 1 });
  await Module.collection.createIndex({ status: 1 });
  await Opportunity.collection.createIndex({ tenant_id: 1 });
  await Opportunity.collection.createIndex({ tenant_id: 1, status: 1 });
  await Opportunity.collection.createIndex({ tenant_id: 1, outcome: 1 });
  await Opportunity.collection.createIndex({ createdAt: -1 });
  await LLMCall.collection.createIndex({ tenant_id: 1 });
  await LLMCall.collection.createIndex({ opportunity_id: 1 });
  await LLMCall.collection.createIndex({ createdAt: -1 });
  await LLMCall.collection.createIndex({ agent: 1, success: 1 });
}



const setup = async () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  PIS Backend — MongoDB Database Setup');
  console.log('═══════════════════════════════════════════');
  console.log('');

  console.log('⏳ Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected:', mongoose.connection.host);
  console.log('   Database :', mongoose.connection.name);
  console.log('');

  console.log('🗑️  Clearing existing data...');
  const [uc, cc, mc, oc, lc] = await Promise.all([
    User.deleteMany({}),
    Competency.deleteMany({}),
    Module.deleteMany({}),
    Opportunity.deleteMany({}),
    LLMCall.deleteMany({})
  ]);
  console.log(`   Users:         ${uc.deletedCount} removed`);
  console.log(`   Competencies:  ${cc.deletedCount} removed`);
  console.log(`   Modules:       ${mc.deletedCount} removed`);
  console.log(`   Opportunities: ${oc.deletedCount} removed`);
  console.log(`   LLMCalls:      ${lc.deletedCount} removed`);
  console.log('');

  console.log('👤 Creating seed users...');
  const hashedUsers = await Promise.all(
    usersData.map(async u => ({
      ...u,
      password: await bcrypt.hash(u.password, 10)
    }))
  );
  const createdUsers = await User.insertMany(hashedUsers);
  const adminUser = createdUsers.find(u => u.role === 'admin');
  createdUsers.forEach(u => {
    const raw = usersData.find(d => d.email === u.email);
    console.log(`   ✅ ${u.role.padEnd(6)}  ${u.email.padEnd(22)}  password: ${raw.password}`);
  });
  console.log('');
  console.log('🎯 Seeding competencies...');
  await Competency.insertMany(competenciesData);
  const clusters = [...new Set(competenciesData.map(c => c.cluster))];
  clusters.forEach(cl => {
    const count = competenciesData.filter(c => c.cluster === cl).length;
    console.log(`   ${count} competencies — ${cl}`);
  });
  console.log(`   Total: ${competenciesData.length} competencies across ${clusters.length} clusters`);
  console.log('');
  console.log('📚 Seeding training modules...');
  const seedTenantId = adminUser._id;
  const modulesWithTenant = modulesData.map(m => ({ ...m, tenant_id: seedTenantId }));
  await Module.insertMany(modulesWithTenant);
  const domains = [...new Set(modulesData.map(m => m.domain))];
  domains.forEach(d => {
    const mods = modulesData.filter(m => m.domain === d);
    console.log(`   ${String(mods.length).padStart(2)} modules — ${d}`);
  });
  console.log(`   Total: ${modulesData.length} modules across ${domains.length} domains`);
  console.log('');

  console.log('💼 Creating sample opportunities...');
  const opps = await Opportunity.insertMany(makeSampleOpportunities(adminUser._id));
  opps.forEach(o => {
    console.log(`   ✅ "${o.client_name}" — status: ${o.status}`);
  });
  console.log('');

  console.log('🔍 Building indexes...');
  await ensureIndexes();
  console.log('   ✅ All indexes created');
  console.log('');

  const [totalUsers, totalComps, totalMods, totalOpps] = await Promise.all([
    User.countDocuments(),
    Competency.countDocuments(),
    Module.countDocuments(),
    Opportunity.countDocuments()
  ]);

  console.log('═══════════════════════════════════════════');
  console.log('  🎉 Setup Complete!');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('  Collections:');
  console.log(`    users          ${totalUsers}`);
  console.log(`    competencies   ${totalComps}`);
  console.log(`    modules        ${totalMods}`);
  console.log(`    opportunities  ${totalOpps}`);
  console.log(`    llmcalls       0 (populated at runtime)`);
  console.log('');
  console.log('  Login credentials:');
  usersData.forEach(u => {
    console.log(`    ${u.email.padEnd(22)} / ${u.password}`);
  });
  console.log('');
  console.log('  Start server:  cd pis-backend && node index.js');
  console.log('');

  process.exit(0);
};

setup().catch(err => {
  console.error('');
  console.error('❌ Setup failed:', err.message);
  console.error('');
  if (err.message.includes('ECONNREFUSED') || err.message.includes('querySrv')) {
    console.error('   Tip: Check your MONGODB_URI in .env — Atlas SRV lookup failed.');
    console.error('   Make sure your IP is whitelisted in Atlas Network Access.');
  }
  if (err.code === 11000) {
    console.error('   Tip: Duplicate key — try running the script again (it clears data first).');
  }
  process.exit(1);
});
