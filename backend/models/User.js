// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  age: {
    type: String,
    required: true,
  },
  locality: {
    type: String,
    required: true,
  },
  landOwned: {
    type: String,
    required: true,
  },
  soilType: {
    type: String,
    required: true,
  },
  cropPlanted: {
    type: String,
    required: true,
  },
});

// Hash the password before saving to the database
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password during login
userSchema.methods.matchPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);