
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { GoogleGenAI, Chat as GenAIChat, GenerateContentResponse } from "@google/genai";
import { Send, Sparkles, Bot, User as UserIcon, Loader2, Zap, RefreshCw, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const Chat = () => {
  const { currentUser } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'welcome', 
      role: 'model', 
      text: `Namaste ${currentUser?.displayName}! I am your dedicated NTR World Companion. I'm here to clear your doubts about the Young Tiger's movies and journey. How can I help?` 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<GenAIChat | null>(null);

  const initChat = async () => {
    try {
      const apiKey = process.env.API_KEY;
      
      if (!apiKey) {
        setMessages(prev => [...prev, { id: 'error', role: 'model', text: 'Error: API_KEY not found in environment.' }]);
        return;
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });
      chatSessionRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: `You are "Tiger Talk", the official AI companion for the NTR World fan community.
          
          CORE RESPONSIBILITIES:
          1. Answer questions ("doubts") related to Jr NTR (Nandamuri Taraka Rama Rao) and his movies (RRR, Devara, etc.).
          2. Provide updates on his upcoming projects based on your knowledge.
          3. If the user is frustrated, motivate them with high-energy "Mass" dialogues from his movies.
          
          STRICT MODERATION & SAFETY GUIDELINES:
          1. DO NOT tolerate abuse, hate speech, or derogatory language. If the user uses such language, politely but firmly refuse to engage and warn them.
          2. DO NOT discuss controversial political topics or other actors in a negative light.
          3. Stay ON TOPIC. If a user asks about something unrelated to NTR or Telugu cinema, politely steer the conversation back to the Young Tiger.
          
          Persona: Loyal, respectful, energetic ("Mass"), and brotherly ("Anna").`,
          temperature: 0.7,
        },
      });
    } catch (error) {
      console.error("Failed to init AI", error);
    }
  };

  // Initialize Gemini Chat Session
  useEffect(() => {
    initChat();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleReset = () => {
    setMessages([{ 
      id: 'welcome', 
      role: 'model', 
      text: `Chat cleared! Let's start fresh. Ask me anything about NTR's movies.` 
    }]);
    initChat(); // Re-initialize session to clear context
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || inputText;
    
    if (!textToSend.trim() || !chatSessionRef.current) return;

    const userMsgId = Date.now().toString();
    
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', text: textToSend }]);
    setInputText('');
    setIsTyping(true);

    try {
      const resultStream = await chatSessionRef.current.sendMessageStream({ message: textToSend });
      
      const botMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: botMsgId, role: 'model', text: '' }]);

      let fullText = '';
      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        const textChunk = c.text;
        if (textChunk) {
          fullText += textChunk;
          setMessages(prev => 
            prev.map(msg => msg.id === botMsgId ? { ...msg, text: fullText } : msg)
          );
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: 'err-' + Date.now(), role: 'model', text: "Sorry Tiger, I'm having trouble connecting to the mainframe. Try again!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action: string) => {
    let prompt = "";
    if (action === "vent") prompt = "I'm feeling really frustrated and down. I need some serious motivation right now. Wake up the Tiger in me!";
    if (action === "trivia") prompt = "Tell me an unknown fact about NTR.";
    if (action === "dialogue") prompt = "Give me a powerful dialogue from Devara or RRR.";
    
    if (prompt) {
        handleSendMessage(prompt);
    }
  };

  return (
    <div className="p-4 lg:p-8 h-[calc(100vh-4rem)] flex flex-col max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-ntr-gold/20 rounded-full border border-ntr-gold/50">
            <Sparkles className="text-ntr-gold" size={24} />
            </div>
            <div>
            <h1 className="text-2xl font-display font-black text-white leading-none">TIGER TALK AI</h1>
            <p className="text-gray-400 text-sm">Official Fan Companion • Strictly Moderated</p>
            </div>
        </div>
        <button 
            onClick={handleReset}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition tooltip"
            title="Reset Chat"
        >
            <RefreshCw size={20} />
        </button>
      </div>

      <div className="flex-1 glass-panel rounded-2xl overflow-hidden flex flex-col border border-white/10 shadow-2xl relative">
         {/* Chat Area */}
         <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
           {messages.map((msg) => (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               key={msg.id} 
               className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
             >
               <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                 msg.role === 'user' ? 'bg-gray-700' : 'bg-ntr-gold text-black'
               }`}>
                 {msg.role === 'user' ? <UserIcon size={20} /> : <Bot size={20} />}
               </div>
               
               <div className={`max-w-[80%] rounded-2xl p-4 ${
                 msg.role === 'user' 
                   ? 'bg-white/10 text-white rounded-tr-none' 
                   : 'bg-ntr-orange/10 border border-ntr-orange/20 text-gray-100 rounded-tl-none'
               }`}>
                 <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
               </div>
             </motion.div>
           ))}
           {isTyping && (
             <div className="flex gap-4">
               <div className="w-10 h-10 rounded-full bg-ntr-gold text-black flex items-center justify-center shrink-0">
                 <Bot size={20} />
               </div>
               <div className="bg-ntr-orange/10 border border-ntr-orange/20 rounded-2xl p-4 rounded-tl-none flex items-center gap-2">
                 <Loader2 className="animate-spin text-ntr-orange" size={16} />
                 <span className="text-xs text-ntr-orange animate-pulse">Thinking...</span>
               </div>
             </div>
           )}
           <div ref={messagesEndRef} />
         </div>

         {/* Quick Actions overlay if empty state (optional) or just below input */}
         {!isTyping && (
            <div className="absolute bottom-24 left-0 right-0 px-6 flex gap-2 overflow-x-auto justify-center pb-2 z-10">
               <button onClick={() => handleQuickAction('vent')} className="whitespace-nowrap px-4 py-2 bg-red-900/80 backdrop-blur-md border border-red-500/50 rounded-full text-xs text-red-100 font-bold hover:bg-red-800 transition flex items-center gap-2 shadow-lg shadow-red-900/50">
                 <Zap size={14} className="fill-current" /> Frustrated? Vent Here
               </button>
               <button onClick={() => handleQuickAction('dialogue')} className="whitespace-nowrap px-4 py-2 bg-gray-800/80 backdrop-blur-md border border-gray-600 rounded-full text-xs text-gray-300 hover:bg-gray-700 transition">
                 🎬 Best Dialogues
               </button>
               <button onClick={() => handleQuickAction('trivia')} className="whitespace-nowrap px-4 py-2 bg-gray-800/80 backdrop-blur-md border border-gray-600 rounded-full text-xs text-gray-300 hover:bg-gray-700 transition">
                 ❓ Random Trivia
               </button>
            </div>
         )}

         {/* Input Area */}
         <div className="p-4 bg-black/40 border-t border-white/5 relative z-20">
           <form 
             onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
             className="flex gap-2 relative"
           >
             <input
               type="text"
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               placeholder="Type your message..."
               className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-ntr-orange focus:ring-1 focus:ring-ntr-orange outline-none transition placeholder:text-gray-600"
             />
             <button 
               type="submit" 
               disabled={isTyping || !inputText.trim()}
               className="bg-ntr-gold hover:bg-ntr-goldDark disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl px-6 transition flex items-center justify-center"
             >
               <Send size={20} />
             </button>
           </form>
         </div>
      </div>
    </div>
  );
};
