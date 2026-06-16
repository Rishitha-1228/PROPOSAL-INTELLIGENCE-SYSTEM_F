const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name:  { type: String, required: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  password:   { type: String, required: true },
  role:       { type: String, enum: ['admin', 'editor', 'viewer'], default: 'editor' },
  institution:{ type: String, default: 'My Institution' },
  is_active:  { type: Boolean, default: true },
  last_login: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);