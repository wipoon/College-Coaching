'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm your College Coach 🎓 I'm here to help you with study tips, career exploration, planning for high school and college, and staying motivated. What would you like to talk about?",
};

const SUGGESTED_PROMPTS = [
  'What should I focus on this semester?',
  'Help me build a study schedule',
  'What extracurriculars should I try?',
  'Tell me about different types of colleges',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasUserMessage = messages.some((m) => m.role === 'user');

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (content: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          grade: 7,
          userId: 'default-student',
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      const data = await res.json();

      const assistantMsg: Message = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: data.response ?? data.reply ?? data.message ?? "Sorry, I couldn't generate a response. Try again!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content:
            "Oops — I'm having trouble connecting right now. Please try again in a moment! 🔄",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <h1 className="text-xl font-bold text-slate-800 mb-4">💬 AI College Coach</h1>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 space-y-1"
      >
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
          />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-slate-500">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">·</span>
                <span className="animate-bounce [animation-delay:0.1s]">·</span>
                <span className="animate-bounce [animation-delay:0.2s]">·</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested prompts */}
      {!hasUserMessage && (
        <div className="flex flex-wrap gap-2 mt-3">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={isLoading}
              className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="mt-3">
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
