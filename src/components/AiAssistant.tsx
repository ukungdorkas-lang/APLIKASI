import React from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  User,
  Bot,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { onSnapshot, doc, collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getChatAssistantResponse } from "../lib/gemini";
import { AppConfig } from "../types";
import Markdown from "react-markdown";
import { cn } from "../lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiAssistant() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [settings, setSettings] = React.useState<AppConfig | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    return onSnapshot(doc(db, "settings", "app"), (snap) => {
      if (snap.exists()) setSettings(snap.data() as AppConfig);
    });
  }, []);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const chatHistory = messages.map((m) => ({
        role: m.role,
        text: m.content,
      }));
      const response = await getChatAssistantResponse(
        inputValue,
        chatHistory,
        settings || undefined,
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
      try {
        await addDoc(collection(db, "ai_chats"), {
          userMessage: inputValue,
          assistantMessage: response,
          timestamp: Date.now(),
        });
      } catch (e) {
        console.error("Failed to save chat to database", e);
      }
    } catch (error) {
      console.error("Chat AI Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Mohon maaf, saya mengalami kendala teknis saat memproses pesan Anda. Silakan coba beberapa saat lagi.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-8 right-8 z-50 w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all",
          isOpen ? "opacity-0 pointer-events-none" : "bg-brand-red text-white",
        )}
      >
        <MessageSquare className="w-8 h-8" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-8 right-8 z-50 w-[90vw] sm:w-[400px] h-[600px] max-h-[80vh] bg-white rounded-[3rem] shadow-3xl border-4 border-slate-900 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-brand-dark p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center shadow-lg">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase italic tracking-tighter">
                    Asisten <span className="text-brand-red">Tanya Damkar</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">
                      AI Terintegrasi
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 shadow-inner"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl">
                    <Sparkles className="w-10 h-10 text-brand-red animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black italic tracking-tighter text-slate-900 uppercase">
                      Halo, Saya Asisten Virtual Damkar Malinau
                    </h4>
                    <p className="text-xs font-medium text-slate-400 italic leading-relaxed">
                      Siap membantu Anda seputar informasi pemadam kebakaran,
                      pelaporan darurat, dan panduan keselamatan. Apa yang ingin
                      Anda tanyakan?
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                      msg.role === "user"
                        ? "bg-slate-900 text-white"
                        : "bg-brand-red text-white",
                    )}
                  >
                    {msg.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed italic shadow-sm prose prose-sm",
                      msg.role === "user"
                        ? "bg-slate-900 text-white rounded-tr-none"
                        : "bg-white text-slate-700 rounded-tl-none border border-slate-100",
                    )}
                  >
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-red text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-brand-red animate-spin" />
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest animate-pulse">
                      Mengetik...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 bg-white border-t border-slate-100">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Ketik pesan Anda di sini..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 pr-14 text-sm font-bold outline-none focus:border-brand-red focus:bg-white transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-3 top-3 w-10 h-10 bg-brand-red text-white rounded-xl flex items-center justify-center hover:scale-105 disabled:opacity-50 transition-all shadow-lg shadow-red-200"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[8px] font-bold text-slate-400 mt-4 text-center italic tracking-widest uppercase">
                Didukung oleh{" "}
                <span className="text-brand-red">Google Gemini AI</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
