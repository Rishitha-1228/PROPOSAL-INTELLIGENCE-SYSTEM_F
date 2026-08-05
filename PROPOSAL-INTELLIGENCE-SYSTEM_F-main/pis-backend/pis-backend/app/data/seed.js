// Run this once to load all data into MongoDB
// Command: node app/data/seed.js

const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

const Module = require('../models/Module');
const competenciesData = require('./competencies');
const modulesData = require('./modules');

// Create Competency model inline
const CompetencySchema = new mongoose.Schema({
  id:         { type: String, required: true, unique: true },
  cluster:    { type: String, required: true },
  name:       { type: String, required: true },
  definition: { type: String, required: true }
}, { timestamps: true });

const Competency = mongoose.models.Competency ||
  mongoose.model('Competency', CompetencySchema);

const seed = async () => {
  try {
    // Connect
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Clear existing data
    await Competency.deleteMany({});
    await Module.deleteMany({});
    console.log('🗑️  Cleared existing seed data');

    // Seed competencies
    await Competency.insertMany(competenciesData);
    console.log(`✅ Seeded ${competenciesData.length} competencies`);

    // Seed modules — use a default tenant for seed data
    const modulesWithTenant = modulesData.map(m => ({
      ...m,
      tenant_id: new mongoose.Types.ObjectId('000000000000000000000001')
    }));
    await Module.insertMany(modulesWithTenant);
    console.log(`✅ Seeded ${modulesData.length} modules`);

    console.log('');
    console.log('🎉 Seed complete!');
    console.log(`   ${competenciesData.length} competencies across 8 clusters`);
    console.log(`   ${modulesData.length} modules across 9 domains`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();