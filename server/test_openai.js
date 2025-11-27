require('dotenv').config();
const { generateReply } = require('./services/ai');

(async () => {
  try {
    console.log('OPENAI_API_KEY present?', !!process.env.OPENAI_API_KEY);
    const reply = await generateReply([
      { sender: 'user', content: 'Hello, can you reply with a one-line greeting?' }
    ]);
    console.log('TEST REPLY:', reply);
  } catch (err) {
    console.error('TEST ERR:', err?.response?.data || err.message || err);
  }
})();
