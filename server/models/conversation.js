const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  title: { type: String, default: 'New Chat' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  meta: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
