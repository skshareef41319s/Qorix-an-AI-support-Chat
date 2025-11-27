require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');
const Conversation = require('../models/conversation');
const Message = require('../models/message');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find();
  for (const u of users) {
    let convo = await Conversation.findOne({ owner: u._id });
    if (!convo) {
      convo = await Conversation.create({ title: `Chat — ${u.name || u.email}`, owner: u._id, participants: [u._id] });
      console.log('Created convo', convo._id.toString(), 'for', u.email);
    }
    const orphanMessages = await Message.find({ userId: u._id, $or: [{ conversationId: { $exists: false } }, { conversationId: null }] });
    for (const m of orphanMessages) {
      m.conversationId = convo._id;
      await m.save();
      console.log('Reassigned message', m._id.toString());
    }
  }
  console.log('Migration done');
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
