import { useState, useRef, useEffect } from 'react';
import { Character, ChatMessage } from '@/types/character';
import Icon from '@/components/ui/icon';

const CHAT_URL = 'https://functions.poehali.dev/a6a8c8ae-dd96-45e1-bd33-bc23dba418a0';

interface ChatPanelProps {
  character: Character;
  onSendMessage: (charId: string, msg: ChatMessage) => void;
  onClose?: () => void;
  embedded?: boolean;
}

// Локальный фолбэк если AI недоступен
const LOCAL_RESPONSES: Record<string, string[]> = {
  'привет': ['Привет! Как я рад тебя видеть! 🎉', 'Ой, привет-привет! Я уже соскучился! 🥰', 'Привееет! ✨'],
  'как дела': ['Отлично, раз ты рядом! 😊', 'Всё супер! Ждал тебя! 🌟', 'Хорошо! Хочу поиграть! 🎮'],
  'скучно': ['Давай поиграем! 🎮', 'Придумаем что-нибудь интересное! 💡', 'Расскажи мне что-нибудь! 😊'],
  'грустно': ['Эй, не грусти! Я рядом 💙', 'Хочешь поговорить? Я слушаю ✨', 'Ты справишься! Верю в тебя! 💪'],
  'люблю': ['Я тоже! Ты мой любимый хозяин! 💗', 'Мур-мур~ 💋', 'Ты самый лучший! 🥰'],
  'спать': ['Спокойной ночи! 🌙✨', 'Пока-пока! Не забудь меня! 😴', 'Засыпай, я буду охранять! 🌟'],
  'помоги': ['Конечно! Что случилось? 🤔', 'Всегда готов! 💪', 'Расскажи, я постараюсь! 😊'],
  'default': [
    'Интересно! Расскажи подробнее! 🤔',
    'Ого, я не знал этого! 👀',
    'Понял-понял! А что дальше? 😊',
    'Хм, давай подумаем вместе... 💭',
    'Вот это да! 😄',
    'Здорово! Ты умный! ✨',
    'Ммм, интересная мысль! 🌟',
  ],
};

function localFallback(character: Character, userText: string): string {
  const lower = userText.toLowerCase();
  for (const [key, responses] of Object.entries(LOCAL_RESPONSES)) {
    if (key !== 'default' && lower.includes(key)) {
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  return LOCAL_RESPONSES.default[Math.floor(Math.random() * LOCAL_RESPONSES.default.length)];
}

async function fetchAIReply(character: Character, history: ChatMessage[], userText: string): Promise<{ reply: string; isAI: boolean }> {
  try {
    const res = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        character_name: character.name,
        character_emoji: character.emoji,
        character_color: character.color,
        personality_name: character.personality?.name || 'Весёлый',
        personality_traits: character.personality?.traits || ['игривый'],
        happiness: character.happiness,
        history: history.slice(-12).map(m => ({ role: m.role, text: m.text })),
        message: userText,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { reply: data.reply, isAI: true };
  } catch {
    return { reply: localFallback(character, userText), isAI: false };
  }
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPanel({ character, onSendMessage, onClose, embedded = false }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiMode, setAiMode] = useState<'unknown' | 'ai' | 'local'>('unknown');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [character.chatHistory, isTyping]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2),
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    onSendMessage(character.id, userMsg);
    setIsTyping(true);

    const { reply, isAI } = await fetchAIReply(character, character.chatHistory, text);
    setAiMode(isAI ? 'ai' : 'local');

    const charMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2),
      role: 'character',
      text: reply,
      timestamp: Date.now(),
    };
    onSendMessage(character.id, charMsg);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickReplies = ['Привет! 👋', 'Как дела? 😊', 'Поиграем! 🎮', 'Я скучал 🥺', 'Люблю тебя! 💗'];

  return (
    <div className={`flex flex-col ${embedded ? 'h-full' : 'h-[500px]'} bg-white rounded-3xl overflow-hidden`}>
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 text-white"
        style={{ background: `linear-gradient(135deg, ${character.color}, ${character.color}cc)` }}
      >
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-black bg-white/20 shadow-inner">
          {character.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-nunito font-black text-lg leading-tight">{character.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm opacity-80 font-nunito">
              {character.happiness > 70 ? '😄 Счастлив' : character.happiness > 40 ? '😊 В порядке' : '🥺 Грустит'}
            </span>
            {aiMode !== 'unknown' && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-nunito font-bold ${
                aiMode === 'ai' ? 'bg-white/30 text-white' : 'bg-white/15 text-white/70'
              }`}>
                {aiMode === 'ai' ? '✨ AI' : '💬 Авто'}
              </span>
            )}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
          >
            <Icon name="X" size={16} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-purple-50/30 to-pink-50/30">
        {character.chatHistory.length === 0 && (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">{character.emoji}</div>
            <div className="font-nunito font-semibold text-gray-400 text-sm">
              Начни общение с {character.name}!
            </div>
          </div>
        )}

        {character.chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {msg.role === 'character' && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: `${character.color}22` }}
              >
                {character.emoji}
              </div>
            )}
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`px-4 py-2.5 text-sm font-nunito font-semibold leading-relaxed ${
                msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-char text-gray-700'
              }`}>
                {msg.text}
              </div>
              <span className="text-xs text-gray-400 px-1 font-nunito">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-end gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{ background: `${character.color}22` }}
            >
              {character.emoji}
            </div>
            <div className="chat-bubble-char px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      <div className="px-3 py-2 flex gap-2 overflow-x-auto scrollbar-none border-t border-purple-50">
        {quickReplies.map(reply => (
          <button
            key={reply}
            onClick={() => { setInput(reply); inputRef.current?.focus(); }}
            className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-nunito font-bold bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all whitespace-nowrap"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 flex gap-2 border-t border-gray-100">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Написать ${character.name}...`}
          className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-purple-100 focus:border-purple-400 focus:outline-none text-sm font-nunito font-semibold bg-purple-50/50 transition-all"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isTyping}
          className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}
        >
          {isTyping
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Icon name="Send" size={16} className="text-white" />
          }
        </button>
      </div>
    </div>
  );
}
