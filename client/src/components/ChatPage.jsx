// Requires: npm install react-markdown

import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import "./ChatPage.css";

const API = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function WelcomeHeader({ visible = true, topics = [], onStartTopic, onDismiss }) {
  if (!visible) return null;

  return (
    <div className="welcome-header" role="region" aria-label="Welcome">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <h1 className="welcome-title">Welcome to Qorix</h1>
          <p className="welcome-subtitle">Where questions find their calm, and answers find their meaning</p>
        </div>

        <div style={{ marginLeft: "auto" }}>
          <button
            aria-label="Dismiss welcome"
            onClick={onDismiss}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              color: "var(--muted)",
              padding: 6,
            }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="topic-scroll-container" aria-hidden={!visible}>
        <div className="topic-scroll-row" role="list">
          {[...topics, ...topics].map((topic, i) => (
            <div
              key={i}
              className="topic-card"
              role="button"
              tabIndex={0}
              onClick={() => onStartTopic(topic)}
              onKeyDown={(e) => { if (e.key === "Enter") onStartTopic(topic); }}
              title={`Start a chat: ${topic}`}
            >
              {topic}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const token = localStorage.getItem("token");
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);

  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const initialTopics = [
    "Weekend trip ideas",
    "Best budget flights",
    "Good hotels near me",
    "3-day packing tips",
    "Places to visit in India",
    "Beach places nearby",
    "Solo travel tips",
    "2-day road trip plan",
    "How to save on flights",
    "Travel safety tips"
  ];
  const [suggestedTopics, setSuggestedTopics] = useState(initialTopics);

  const [showTopics, setShowTopics] = useState(() => {
    try {
      return !localStorage.getItem("seenTopics");
    } catch {
      return true;
    }
  });

  const composerRef = useRef(null);
  const endRef = useRef(null);
  const messageScrollRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    loadConversations();
  }, [token]);

  useEffect(() => {
    if (activeConvo) {
      loadMessages(activeConvo._id);
      setTimeout(() => composerRef.current?.focus(), 140);
    } else {
      setMessages([]);
    }
  }, [activeConvo]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    if (messageScrollRef.current) {
      const el = messageScrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, aiTyping]);

  function markTopicsSeen() {
    try { localStorage.setItem("seenTopics", "1"); } catch {}
    setShowTopics(false);
  }

  async function loadConversations() {
    setLoadingConvos(true);
    try {
      const res = await axios.get(`${API}/api/conversations`, { headers: { Authorization: `Bearer ${token}` } });
      setConversations(res.data.conversations || []);
      if (!activeConvo && res.data.conversations?.length) setActiveConvo(res.data.conversations[0]);
    } catch (err) {
      console.error("Load convos", err);
    } finally {
      setLoadingConvos(false);
    }
  }

  async function createConversationAndSave(title) {
    try {
      const res = await axios.post(`${API}/api/conversations`, { title: title || "New Chat" }, { headers: { Authorization: `Bearer ${token}` } });
      const convo = res.data.conversation;
      setConversations(prev => [convo, ...prev]);
      setActiveConvo(convo);
      setShowNewModal(false);
      markTopicsSeen();
      return convo;
    } catch (err) {
      console.error("Create convo", err);
      alert("Failed to create chat. Try again.");
      throw err;
    }
  }

  async function deleteConversation(e, convoId) {
    e.stopPropagation();
    if (!window.confirm("Delete this chat?")) return;
    try {
      await axios.delete(`${API}/api/conversations/${convoId}`, { headers: { Authorization: `Bearer ${token}` } });
      setConversations(prev => prev.filter(c => c._id !== convoId));
      if (activeConvo && activeConvo._id === convoId) {
        const remaining = conversations.filter(c => c._id !== convoId);
        setActiveConvo(remaining.length ? remaining[0] : null);
      }
    } catch (err) {
      console.error("Delete convo", err);
      alert("Failed to delete chat.");
    }
  }


  async function loadMessages(convoId) {
    setLoadingMsgs(true);
    try {
      const res = await axios.get(`${API}/api/messages/${convoId}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(res.data.messages || []);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 80);
    } catch (err) {
      console.error("Load messages", err);
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }

  async function sendMessageProgrammatic(convoId, content) {
    if (!content || !convoId) return;
    const tempId = `tmp-${Date.now()}`;
    const optimistic = { _id: tempId, sender: "user", content, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    setSending(true);
    setAiTyping(true);

    try {
      const res = await axios.post(`${API}/api/messages/${convoId}`, { content, sender: "user" }, { headers: { Authorization: `Bearer ${token}` }});
      const { userMessage, assistantMessage } = res.data;
      setMessages(prev => {
        const filtered = prev.filter(m => m._id !== tempId);
        return [...filtered, userMessage, assistantMessage];
      });

      setConversations(prev => {
        const others = prev.filter(c => c._id !== convoId);
        const current = prev.find(c => c._id === convoId) || { _id: convoId };
        return [current, ...others];
      });
    } catch (err) {
      console.error("Programmatic send", err);
      setMessages(prev => [...prev.filter(m => m._id !== tempId), { _id: `err-${Date.now()}`, sender: "assistant", content: "Failed to send.", createdAt: new Date().toISOString() }]);
    } finally {
      setSending(false);
      setAiTyping(false);
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !activeConvo || sending) return;
    const content = text.trim();
    const convoId = activeConvo._id;
    const tempId = `tmp-${Date.now()}`;
    const optimistic = { _id: tempId, sender: "user", content, createdAt: new Date().toISOString() };

    setMessages(prev => [...prev, optimistic]);
    setText("");
    setSending(true);
    setAiTyping(true);

    try {
      const res = await axios.post(`${API}/api/messages/${convoId}`, { content, sender: "user" }, { headers: { Authorization: `Bearer ${token}` } });
      const { userMessage, assistantMessage } = res.data;
      setMessages(prev => {
        const filtered = prev.filter(m => m._id !== tempId);
        return [...filtered, userMessage, assistantMessage];
      });

      setConversations(prev => {
        const others = prev.filter(c => c._id !== convoId);
        const current = prev.find(c => c._id === convoId) || activeConvo;
        return [current, ...others];
      });
    } catch (err) {
      console.error("Send msg", err);
      setMessages(prev => [...prev.filter(m => m._id !== tempId), { _id: `err-${Date.now()}`, sender: "assistant", content: "Sorry — failed to send. Try again.", createdAt: new Date().toISOString() }]);
    } finally {
      setSending(false);
      setAiTyping(false);
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => composerRef.current?.focus(), 80);
    }
  }


  function openNewModal(prefill = "") {
    setNewTitle(prefill || "");
    setShowNewModal(true);
    markTopicsSeen();
    setTimeout(() => document.querySelector(".newchat-input")?.focus(), 80);
  }

  async function handleStartTopic(topic) {
    setSuggestedTopics(prev => prev.filter(t => t !== topic));
    markTopicsSeen();

    try {
      const convo = await createConversationAndSave(topic);
      setTimeout(() => sendMessageProgrammatic(convo._id, topic), 220);
    } catch (err) {
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    try { localStorage.removeItem("seenTopics"); } catch {}
    window.location.reload();
  }


  return (
    <div className="chat-wrapper light">
      <aside className="chat-sidebar" aria-label="Chat sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="brand-name" style={{ fontSize: "38px" }}>Qorix</div>
          </div>

          <button className="new-chat-btn" onClick={() => openNewModal()}>
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>New Chat</span>
          </button>
        </div>

        <div className={`topic-scroll-container ${showTopics ? "topics-visible" : "topics-hidden"}`}>
          <div className="topic-scroll-row" aria-hidden>
            {[...suggestedTopics, ...suggestedTopics].map((t, i) => (
              <div key={i} className="topic-card" onClick={() => handleStartTopic(t)}>{t}</div>
            ))}
          </div>
        </div>

        <div className="sidebar-list" role="navigation" aria-label="Conversations">
          {loadingConvos ? (
            <div className="sidebar-empty">Loading chats...</div>
          ) : conversations.length === 0 ? (
            <div className="sidebar-empty">No saved chats yet.</div>
          ) : (
            conversations.map((c) => (
              <div
                key={c._id}
                className={`sidebar-item ${activeConvo && c._id === activeConvo._id ? "active" : ""}`}
                onClick={() => { markTopicsSeen(); setActiveConvo(c); }}
                role="button"
                tabIndex={0}
              >
                <div className="item-title">{c.title}</div>
                <button className="item-delete-btn" onClick={(e) => deleteConversation(e, c._id)} aria-label={`Delete ${c.title}`}>✕</button>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-bottom">
          <button className="logout-small" onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className={`chat-main ${activeConvo ? "fade-in" : "empty-mode"}`}>
        {(!activeConvo && showTopics) && (
          <WelcomeHeader visible={showTopics} topics={suggestedTopics} onStartTopic={handleStartTopic} onDismiss={markTopicsSeen} />
        )}

        {!activeConvo ? (
          <div className="main-empty">
            <div className="hero-emoji">💬</div>
            <h2 className="hero-title">Start a helpful conversation</h2>
            <p className="hero-sub">Click "New Chat" or tap a suggested topic to begin.</p>
            <button className="primary-cta" onClick={() => openNewModal()}>＋ New Chat</button>
          </div>
        ) : (
          <div className="chat-card">
            <div className="chat-body">
              <div ref={messageScrollRef} className="message-scroll" role="log" aria-live="polite">
                {loadingMsgs ? (
                  <div className="loader-row">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="empty-convo">Say hi — your assistant is ready.</div>
                ) : (
                  messages.map((m) => (
                    <div key={m._id || m.createdAt} className={`msg-row ${m.sender === "user" ? "user" : "assistant"}`}>
                      <div className="msg-bubble">
                        {m.sender === "assistant" ? (
                          <ReactMarkdown>{String(m.content || "")}</ReactMarkdown>
                        ) : (
                          <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                        )}
                      </div>
                      <div className="msg-ts">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  ))
                )}

                {aiTyping && (
                  <div className="msg-row assistant typing">
                    <div className="msg-bubble"><span className="typing-dot" /> <span className="typing-dot" /> <span className="typing-dot" /></div>
                  </div>
                )}

                <div ref={endRef} />
              </div>

              <form className="composer-row" onSubmit={handleSend}>
                <input
                  ref={composerRef}
                  className="composer-input"
                  placeholder={sending ? "Sending…" : "Type a message..."}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={sending}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(e); }}
                  aria-label="Message"
                />
                <button className="send-button" type="submit" disabled={!text.trim() || sending}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20 1-7 7-13z" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {showNewModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onMouseDown={() => setShowNewModal(false)}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <h3>Create a new chat</h3>
            <input
              className="newchat-input"
              placeholder="Enter a name for this chat (eg. Java exam tips)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createConversationAndSave(newTitle.trim()); }}
            />
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setShowNewModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={async () => {
                const convo = await createConversationAndSave(newTitle.trim() || "New Chat");
                if (convo && newTitle.trim()) setTimeout(() => sendMessageProgrammatic(convo._id, newTitle.trim()), 200);
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}