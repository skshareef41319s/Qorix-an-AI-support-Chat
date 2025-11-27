import React, { useEffect, useState } from 'react';
import LoginCard from './LoginCard';
import ChatPage from './components/ChatPage';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const onStorage = () => setToken(localStorage.getItem('token'));
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return token ? <ChatPage /> : <LoginCard onLogin={() => setToken(localStorage.getItem('token'))} />;
}
