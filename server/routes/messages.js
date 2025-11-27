const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Message = require('../models/message');
const Conversation = require('../models/conversation');
const { generateReply } = require('../services/ai');

const router = express.Router();

router.get('/:conversationId', requireAuth, async (req, res) => {
  const { conversationId } = req.params;
  try {
    const convo = await Conversation.findById(conversationId);
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });
    if (!convo.participants.map(String).includes(String(req.user.id))) return res.status(403).json({ error: 'Forbidden' });

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).limit(200);
    res.json({ messages });
  } catch (err) {
    console.error('Get messages error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:conversationId', requireAuth, async (req, res) => {
  const { conversationId } = req.params;
  const { content, sender = 'user', meta } = req.body;

  if (!content || !content.trim()) return res.status(400).json({ error: 'Empty message' });

  try {
    const convo = await Conversation.findById(conversationId);
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });
    if (!convo.participants.map(String).includes(String(req.user.id))) return res.status(403).json({ error: 'Forbidden' });

    const userMessage = await Message.create({
      conversationId,
      sender,
      userId: req.user.id,
      content: content.trim(),
      meta: meta || {}
    });

    convo.updatedAt = new Date();
    await convo.save();

    const recent = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const recentChron = recent.reverse().map(m => ({
      sender: m.sender,
      content: (m.sender === 'assistant' && m.meta && m.meta.summary) ? `${m.content}\n\nSummary:${m.meta.summary}` : m.content
    }));

    let assistantText = '';
    try {
      assistantText = await generateReply(recentChron);
    } catch (aiErr) {
      assistantText = "I'm sorry — I'm having trouble answering right now. Please try again in a moment.";
    }

    const assistantMsg = await Message.create({
      conversationId,
      sender: 'assistant',
      userId: null,
      content: assistantText,
      meta: {}
    });

    res.status(201).json({ userMessage, assistantMessage: assistantMsg });
  } catch (err) {
    console.error('Create message + AI reply error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
