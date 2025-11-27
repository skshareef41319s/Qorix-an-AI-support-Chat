# Qorix — AI Support Chat

A minimalist, production-minded conversational support platform built with the MERN stack and integrated with Google Gemini Flash (Generative AI). Qorix combines classic full‑stack engineering with modern AI capabilities to deliver secure, scalable conversational support.

Live demo / Hosting: https://qorix-an-ai-support-chat.vercel.app/

## Overview

Qorix provides:
- JWT-based user authentication and per-user conversation history
- AI-powered real-time conversations using Google Gemini Flash
- A clean, minimal UI built with React + Vite
- A modular backend in Node/Express with Mongoose for MongoDB

This project explores how modern LLMs can be safely and effectively integrated into web applications, emphasizing security, simplicity, and observability.

## Features

- User authentication (JWT)
- AI chat powered by Google Gemini Flash
- Conversation history persisted per user
- Clean, responsive UI with smooth scrolling and typing indicators
- Environment-driven configuration and secure API key handling
- Modular AI service layer with prompt shaping and safety tuning

## Tech Stack

- Frontend: React, Vite, Axios, CSS
- Backend: Node.js, Express, MongoDB, Mongoose
- Authentication: JWT, bcrypt
- AI: Google Gemini Flash (via Google Generative AI API)

# Project Structure

```text
qorix-ai-support-chat/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatPage.jsx
│   │   │   └── ChatPage.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── ...
└── server/                 # Express backend
    ├── models/
    ├── routes/
    ├── services/
    │   └── ai.js           # LLM integration and prompt logic
    ├── middleware/
    │   └── auth.js
    └── index.js
```
## Requirements

- Node.js 18+
- MongoDB (local or Atlas)
- Google Generative AI API key (Gemini)
- Git

## Setup & Quick Start

1. Clone the repository
```bash
git clone https://github.com/skshareef41319s/qorix-ai-support-chat.git
cd qorix-ai-support-chat
```

2. Setup the server
```bash
cd server
npm install
```
Create `server/.env`:
```
PORT=5000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_api_key_here
MODEL=gemini-1.5-flash
```
Start the server (development):
```bash
npm run dev
```
Server runs on: http://localhost:5000

3. Setup the client
```bash
cd ../client
npm install
```
Create `client/.env`:
```
VITE_API_BASE=http://localhost:5000
```
Start the client:
```bash
npm run dev
```
Frontend runs on: http://localhost:5173

If you'd rather try the deployed version, the live demo is available at:
https://qorix-an-ai-support-chat.vercel.app/

## How the AI Integration Works

- The backend (server/services/ai.js) sends user messages to the Google Generative AI API configured to use Gemini Flash.
- Prompts are shaped to produce concise, friendly, and safe responses in Markdown format.
- The service includes response-length control and basic safety tuning to reduce hallucinations.

## Security Considerations

- Routes that require authentication are protected via JWT middleware.
- API keys and secrets are stored in environment variables (not checked into source control).
- Follow best practices when handling user-submitted content and when storing logs or conversation history.


## Testing the AI Endpoint (optional)

From the `server` folder you can run any included test script:
```bash
node test_openai.js
```
(Adjust the filename if necessary; this script demonstrates calling the configured AI model.)

## Contributing

Contributions are welcome. Suggested workflow:
1. Fork the repository
2. Create a feature branch (git checkout -b feat/your-change)
3. Make changes and include tests where appropriate
4. Open a pull request with a clear description of what you changed and why

Please open issues for bugs or feature requests.

## Contact

- GitHub: https://github.com/skshareef41319s
- Email: skshareef41319@gmail.com
- Phone: +91 80962 02611

Made with ❤️ — a merge of developer craft and AI.
