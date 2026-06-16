import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

// ── Auto-attach token to every request ──────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pis_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── AUTH ─────────────────────────────────────────
export const loginUser = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const signupUser = async (data) => {
  const res = await api.post('/auth/signup', data);
  return res.data;
};

// ── OPPORTUNITIES ────────────────────────────────
export const createOpportunity = async (data) => {
  const res = await api.post('/opportunities', data);
  return res.data;
};

export const getOpportunities = async () => {
  const res = await api.get('/opportunities');
  return res.data;
};

export const getOpportunity = async (id) => {
  const res = await api.get(`/opportunities/${id}`);
  return res.data;
};

// ── AI AGENTS ────────────────────────────────────
export const generateQuestions = async (id) => {
  const res = await api.post(`/opportunities/${id}/questions`);
  return res.data;
};

export const mapCompetencies = async (id) => {
  const res = await api.post(`/opportunities/${id}/competencies`);
  return res.data;
};

export const recommendModules = async (id) => {
  const res = await api.post(`/opportunities/${id}/modules`);
  return res.data;
};

export const buildArchitecture = async (id) => {
  const res = await api.post(`/opportunities/${id}/architecture`);
  return res.data;
};

export const writeApproachNote = async (id) => {
  const res = await api.post(`/opportunities/${id}/approach-note`);
  return res.data;
};

export const scoreProposal = async (id) => {
  const res = await api.post(`/opportunities/${id}/score`);
  return res.data;
};

// ── Alias ────────────────────────────────────────
export const analyseBrief = createOpportunity;

export default api;