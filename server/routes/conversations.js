const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Conversation = require('../models/conversation');
const Message = require('../models/message');

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  try {
    const owner = req.user.id;
    const { title } = req.body;
    const convo = await Conversation.create({ title: title || 'New Chat', owner, participants: [owner] });
    res.status(201).json({ conversation: convo });
  } catch (err) {
    console.error('Create conversation error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const convos = await Conversation.find({ participants: userId }).sort({ updatedAt: -1 }).lean();
    res.json({ conversations: convos });
  } catch (err) {
    console.error('List convos error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const convoId = req.params.id;
    const userId = req.user.id;
    const convo = await Conversation.findById(convoId).lean();
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });
    if (!convo.participants.map(String).includes(String(userId))) return res.status(403).json({ error: 'Forbidden' });

    const messages = await Message.find({ conversationId: convoId }).sort({ createdAt: 1 }).limit(200).lean();
    res.json({ conversation: convo, messages });
  } catch (err) {
    console.error('Get conversation error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const convoId = req.params.id;
    const userId = req.user.id;
    const convo = await Conversation.findById(convoId);
    if (!convo) return res.status(404).json({ error: 'Not found' });
    if (String(convo.owner) !== String(userId)) return res.status(403).json({ error: 'Forbidden' });

    await Message.deleteMany({ conversationId: convoId });
    await Conversation.findByIdAndDelete(convoId);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete conversation error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
