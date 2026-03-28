import { useState, useEffect, useRef, useCallback } from 'react';
import { Character, AnimationState } from '@/types/character';
import CharacterSprite from './CharacterSprite';
import Icon from '@/components/ui/icon';

interface OverlayCharacterProps {
  character: Character;
  onChat: () => void;
  onAction: (action: 'hit' | 'kiss' | 'pet') => void;
  onClose: () => void;
}

interface SpeechBubble {
  text: string;
  visible: boolean;
}

const IDLE_MESSAGES = [
  'Привет! 👋',
  'Чем занимаешься? 😊',
  'Поиграем? 🎮',
  'Хочу поговорить! 💬',
  'Мне скучно... 🥺',
];

type RunDirection = 'right' | 'left';

export default function OverlayCharacter({ character, onChat, onAction, onClose }: OverlayCharacterProps) {
  const [pos, setPos] = useState({ x: window.innerWidth - 150, y: window.innerHeight - 180 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [animation, setAnimation] = useState<AnimationState>('idle');
  const [bubble, setBubble] = useState<SpeechBubble>({ text: '', visible: false });
  const [runDir, setRunDir] = useState<RunDirection>('right');
  const [isRunning, setIsRunning] = useState(false);
  const runRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleRef = useRef<NodeJS.Timeout | null>(null);
  const idleRef = useRef<NodeJS.Timeout | null>(null);

  const showBubble = useCallback((text: string, duration = 3000) => {
    setBubble({ text, visible: true });
    if (bubbleRef.current) clearTimeout(bubbleRef.current);
    bubbleRef.current = setTimeout(() => setBubble({ text: '', visible: false }), duration);
  }, []);

  // Idle behavior — random messages & actions
  useEffect(() => {
    const scheduleIdle = () => {
      const delay = 8000 + Math.random() * 12000;
      idleRef.current = setTimeout(() => {
        if (!isDragging && !isRunning) {
          const roll = Math.random();
          if (roll < 0.4) {
            showBubble(IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)]);
          } else if (roll < 0.6) {
            doRun();
          } else if (roll < 0.75) {
            setAnimation('dance');
            setTimeout(() => setAnimation('idle'), 3000);
          } else if (roll < 0.9) {
            setAnimation('wave');
            setTimeout(() => setAnimation('idle'), 2000);
          }
        }
        scheduleIdle();
      }, delay);
    };
    scheduleIdle();
    return () => { if (idleRef.current) clearTimeout(idleRef.current); };
  }, [isDragging, isRunning, showBubble]);

  // Check if user hasn't been seen for a while
  useEffect(() => {
    const diff = Date.now() - (character.lastSeen || 0);
    if (diff > 1800000) { // 30 min
      const msgs = character.personality?.missedMessages || ['Скучал по тебе! 🥺'];
      setTimeout(() => showBubble(msgs[Math.floor(Math.random() * msgs.length)], 5000), 2000);
    } else {
      const greets = character.personality?.greetings || ['Привет! 😊'];
      setTimeout(() => showBubble(greets[Math.floor(Math.random() * greets.length)], 3000), 1000);
    }
  }, [character.id]);

  const doRun = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setAnimation('run');
    const dir: RunDirection = Math.random() > 0.5 ? 'right' : 'left';
    setRunDir(dir);
    const distance = 80 + Math.random() * 120;
    const steps = 30;
    let step = 0;
    const stepX = (dir === 'right' ? distance : -distance) / steps;

    const interval = setInterval(() => {
      step++;
      setPos(prev => {
        const nx = Math.max(10, Math.min(window.innerWidth - 110, prev.x + stepX));
        return { ...prev, x: nx };
      });
      if (step >= steps) {
        clearInterval(interval);
        setAnimation('idle');
        setIsRunning(false);
      }
    }, 40);
    runRef.current = interval as unknown as NodeJS.Timeout;
  }, [isRunning]);

  // Drag handling — mouse
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
    setAnimation('grab');
    showBubble('Вееееее! 🎉', 1500);
    e.preventDefault();
  };

  // Drag handling — touch
  const onTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragOffset({ x: touch.clientX - pos.x, y: touch.clientY - pos.y });
    setAnimation('grab');
    showBubble('Вееееее! 🎉', 1500);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => {
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 110, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 140, e.clientY - dragOffset.y)),
      });
    };
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 110, touch.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 140, touch.clientY - dragOffset.y)),
      });
      e.preventDefault();
    };
    const onUp = () => {
      setIsDragging(false);
      setAnimation('fall');
      showBubble('Бум! 💥', 1200);
      setTimeout(() => setAnimation('idle'), 800);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging, dragOffset]);

  const handleAction = (action: 'hit' | 'kiss' | 'pet') => {
    const reactions = character.personality?.reactions?.[action] || ['!'];
    const text = reactions[Math.floor(Math.random() * reactions.length)];
    showBubble(text, 2500);
    onAction(action);
  };

  return (
    <div
      className="overlay-window"
      style={{ left: pos.x, top: pos.y, bottom: 'auto', right: 'auto' }}
    >
      {/* Speech bubble */}
      {bubble.visible && (
        <div
          className="animate-speech-pop absolute bg-white rounded-2xl px-4 py-2 text-sm font-nunito font-semibold shadow-xl border-2 border-purple-200 whitespace-nowrap"
          style={{
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            maxWidth: 200,
            whiteSpace: 'normal',
            zIndex: 10000,
          }}
        >
          {bubble.text}
          <div className="absolute left-1/2 -bottom-2.5 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-purple-200 rotate-45" />
        </div>
      )}

      {/* Character */}
      <div
        className="group relative select-none"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        style={{
          transform: `scaleX(${runDir === 'left' ? -1 : 1}) rotate(${isDragging ? (runDir === 'left' ? 8 : -8) : 0}deg)`,
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          filter: isDragging
            ? `drop-shadow(0 16px 24px ${character.color}88) drop-shadow(0 6px 8px rgba(0,0,0,0.25))`
            : `drop-shadow(0 4px 8px ${character.color}44)`,
        }}
      >
        {/* Grab glow ring */}
        {isDragging && (
          <div
            className="absolute inset-0 rounded-full animate-pulse-glow pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${character.color}33 0%, transparent 70%)`,
              transform: 'scale(1.4)',
            }}
          />
        )}
        <CharacterSprite
          character={character}
          animation={animation}
          size={90}
        />
        {/* Shadow on ground when held high */}
        {isDragging && (
          <div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
            style={{
              width: 60,
              height: 10,
              background: 'rgba(0,0,0,0.15)',
              filter: 'blur(4px)',
              transform: `translateX(-50%) scaleX(${runDir === 'left' ? -1 : 1})`,
            }}
          />
        )}
      </div>

      {/* Control panel */}
      <div className="flex items-center justify-center gap-1 mt-1">
        <button
          onClick={() => handleAction('hit')}
          className="w-7 h-7 rounded-full bg-white shadow-md hover:scale-110 transition-all text-sm border border-red-100"
          title="Ударить"
        >👊</button>
        <button
          onClick={() => handleAction('kiss')}
          className="w-7 h-7 rounded-full bg-white shadow-md hover:scale-110 transition-all text-sm border border-pink-100"
          title="Поцеловать"
        >💋</button>
        <button
          onClick={() => handleAction('pet')}
          className="w-7 h-7 rounded-full bg-white shadow-md hover:scale-110 transition-all text-sm border border-yellow-100"
          title="Погладить"
        >🤚</button>
        <button
          onClick={() => { setAnimation('run'); doRun(); }}
          className="w-7 h-7 rounded-full bg-white shadow-md hover:scale-110 transition-all text-sm border border-green-100"
          title="Бежать"
        >🏃</button>
        <button
          onClick={onChat}
          className="w-7 h-7 rounded-full bg-white shadow-md hover:scale-110 transition-all border border-purple-100"
          title="Чат"
        >
          <Icon name="MessageCircle" size={14} className="text-purple-500 mx-auto" />
        </button>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-white shadow-md hover:scale-110 transition-all border border-gray-100"
          title="Закрыть"
        >
          <Icon name="X" size={11} className="text-gray-400 mx-auto" />
        </button>
      </div>

      {/* Happiness bar */}
      <div className="mt-1.5 mx-1">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${character.happiness}%`,
              background: character.happiness > 60 ? '#34D399' : character.happiness > 30 ? '#FCD34D' : '#FF6B9D',
            }}
          />
        </div>
      </div>
    </div>
  );
}