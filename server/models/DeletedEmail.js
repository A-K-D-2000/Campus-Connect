const mongoose = require('mongoose');

const deletedEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  // TTL index: MongoDB deletes this document 24 hours after deletedAt
  deletedAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24,
  },
});

module.exports = mongoose.model('DeletedEmail', deletedEmailSchema);