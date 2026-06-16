const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ── Connect MongoDB ───────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err.message));

// ── Routes ────────────────────────────────────
app.use('/api/auth', require('./app/routes/auth'));
app.use('/api/opportunities', require('./app/routes/opportunities'));

// ── Health check ──────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'PIS Backend running',
    version: '2.0',
    agents_ready: ['Agent 1: Brief Interpreter', 'Agent 2: Question Generator'],
    agents_coming: ['Agent 3', 'Agent 4', 'Agent 5', 'Agent 6']
  });
});

app.listen(process.env.PORT, () => {
  console.log('');
  console.log('🚀 PIS Backend v2 running on port', process.env.PORT);
  console.log('');
  console.log('Auth routes:');
  console.log('  POST http://localhost:5000/api/auth/signup');
  console.log('  POST http://localhost:5000/api/auth/login');
  console.log('  GET  http://localhost:5000/api/auth/me');
  console.log('');
  console.log('Opportunity routes:');
  console.log('  POST http://localhost:5000/api/opportunities');
  console.log('  POST http://localhost:5000/api/opportunities/:id/questions');
  console.log('  GET  http://localhost:5000/api/opportunities');
  console.log('  GET  http://localhost:5000/api/opportunities/:id');
});