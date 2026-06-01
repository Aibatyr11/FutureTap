import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/NavBar';
import { Bot, User, Send, Sparkles, MessageSquare, History, Lightbulb, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGroqResponse, getBackendChatResponse } from '../services/aiService';

const Chat = () => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Добро пожаловать в TalantTap AI! Я твой персональный помощник в мире кружков и развития. О чем хочешь поговорить?",
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [clubContext, setClubContext] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function fetchClubContext() {
      try {
        const res = await fetch('/api/clubs/');
        if (res.ok) {
          const data = await res.json();
          const clubs = Array.isArray(data) ? data : data.results || [];
          const contextStr = clubs.map(c => `- ${c.title} (Категория: ${c.category}, Возраст: ${c.ageRange}, Место: ${c.location})`).join('\n');
          setClubContext(contextStr);
        }
      } catch (e) {
        console.error("Failed to fetch club context:", e);
      }
    }
    fetchClubContext();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (customText = null) => {
    const textToSend = customText || inputValue;
    if (!textToSend.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customText) setInputValue('');
    setIsTyping(true);

    try {
      // Пытаемся получить ответ от бэкенда (с учетом контекста RAG)
      try {
        const response = await getBackendChatResponse([...messages, userMessage]);
        const botResponse = {
          id: Date.now() + 1,
          text: response,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botResponse]);
      } catch (backendError) {
        console.warn("Backend chat failed (possibly not authenticated), falling back to Groq:", backendError);
        // Fallback на Groq
        const response = await getGroqResponse([...messages, userMessage], clubContext);
        const botResponse = {
          id: Date.now() + 1,
          text: response,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botResponse]);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "К сожалению, мне не удалось получить ответ от AI. Проверь подключение или попробуй позже.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    { text: "Краткий отчет по последнему уроку", icon: <Zap className="w-4 h-4 text-yellow-500" /> },
    { text: "Посоветуй кружки для программистов", icon: <Zap className="w-4 h-4" /> },
    { text: "Как записаться на пробное занятие?", icon: <Lightbulb className="w-4 h-4" /> },
    { text: "Какие есть спортивные секции?", icon: <Sparkles className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar */}
        <div className="hidden lg:flex w-80 flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              История чатов
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl text-sm font-medium cursor-pointer border border-indigo-100">
                Подбор кружка робототехники
              </div>
              <div className="p-3 hover:bg-slate-50 text-slate-600 rounded-2xl text-sm transition-colors cursor-pointer">
                Вопросы по оплате
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-lg">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              Pro Помощник
            </h3>
            <p className="text-indigo-100 text-sm leading-relaxed mb-4">
              Я анализирую твои интересы, чтобы предлагать только самое лучшее.
            </p>
            <button className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-2xl text-sm font-bold transition-all backdrop-blur-sm">
              Узнать больше
            </button>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {/* Top Bar */}
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Bot className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-lg">TalantTap Assistant</h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Now</span>
                </div>
              </div>
            </div>
            <button className="p-3 hover:bg-slate-50 rounded-2xl transition-colors outline-none">
              <MessageSquare className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 scrollbar-hide">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-4 max-w-[75%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm ${
                    msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-indigo-600'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`group relative p-4 rounded-3xl text-sm leading-relaxed ${
                    msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-50 text-slate-700 rounded-tl-none'
                  }`}>
                    {msg.text}
                    <div className={`text-[10px] mt-2 font-bold opacity-40 uppercase tracking-tighter ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-50 p-4 rounded-3xl rounded-tl-none flex gap-1.5 items-center">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></motion.div>
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></motion.div>
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></motion.div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          <div className="px-8 pb-4 flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s.text)}
                className="px-4 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
              >
                {s.icon}
                {s.text}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="px-8 py-6 bg-white border-t border-slate-50">
            <div className="relative flex items-center gap-3 bg-slate-50 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-200 transition-all">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Спроси меня о чем угодно..."
                className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm text-slate-700 placeholder:text-slate-400"
              />
              <button
                onClick={() => handleSend()}
                className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest">
              AI Powered by TalantTap Intelligence
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
