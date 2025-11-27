const axios = require('axios');

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

if (!GEMINI_KEY) {
  console.warn('[ai][gemini] GEMINI_API_KEY not set in environment (GEMINI_API_KEY).');
}

function buildContents(recentMessages = []) {
  const systemText = "You are a helpful, friendly AI assistant. Be concise, clear, and encouraging. When asked study questions, give explanations and short examples.";
  const parts = [];

  parts.push({ text: `SYSTEM: ${systemText}` });

  for (const m of recentMessages) {
    const role = m.sender === 'user' ? 'USER' : m.sender === 'assistant' ? 'ASSISTANT' : 'SYSTEM';
    parts.push({ text: `${role}: ${m.content}` });
  }

  return [
    {
      parts: parts.map(p => ({ text: p.text }))
    }
  ];
}


async function generateReply(recentMessages = []) {
  if (!GEMINI_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const payload = {
    contents: buildContents(recentMessages),
  };

  try {
    console.log('[ai][gemini] calling generateContent', { model: MODEL, recentMessages: recentMessages.length });
    const resp = await axios.post(ENDPOINT, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_KEY,
      },
      timeout: 60_000,
    });

    const data = resp?.data;
    if (!data) {
      console.warn('[ai][gemini] no data in response');
      return '';
    }

    const cand = data.candidates && data.candidates[0];
    if (cand && cand.content && Array.isArray(cand.content.parts) && cand.content.parts[0]) {
      const text = cand.content.parts.map(p => p.text || '').join('');
      return (text || '').trim();
    }

    if (Array.isArray(data.candidates) && data.candidates.length > 0) {
      const c = data.candidates[0];
      if (c && c.content && Array.isArray(c.content)) {
        const textParts = [];
        for (const block of c.content) {
          if (Array.isArray(block.parts)) {
            for (const part of block.parts) {
              if (part && part.text) textParts.push(part.text);
            }
          }
        }
        const joined = textParts.join('');
        if (joined) return joined.trim();
      }
    }

    if (data.output_text) return String(data.output_text).trim();

    console.warn('[ai][gemini] Could not locate assistant text in response shape. Returning empty string.');
    console.debug('[ai][gemini] raw response:', JSON.stringify(data).slice(0, 2000));
    return '';
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      const body = err.response.data;
      console.error(`[ai][gemini] HTTP ${status} -`, JSON.stringify(body, null, 2));
      const msg = body?.error?.message || (body?.candidates ? 'invalid response' : JSON.stringify(body));
      const e = new Error(`Gemini API error: HTTP ${status} - ${msg}`);
      e.status = status;
      e.body = body;
      throw e;
    }
    console.error('[ai][gemini] network/error:', err.message || err);
    throw err;
  }
}

module.exports = { generateReply };
