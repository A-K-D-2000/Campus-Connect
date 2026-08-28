const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  flair: {
    type: String,
    required: true,
    enum: ['Academic Doubt', 'Placement Experience', 'General Query'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  attachments: [{
    type: String,
  }],
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);