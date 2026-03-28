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

// Физические константы
const GRAVITY = 0.55;
const GROUND_FRICTION = 0.78;
const AIR_RESISTANCE = 0.97;
const BOUNCE_FACTOR = 0.28;
const CHAR_W = 90;
const CHAR_H = 90;
const WALL_CLIMB_SPEED = 2.2;
const RUN_SPEED = 4.5;
const FLY_SPEED = 2.8;

type Surface = 'air' | 'ground' | 'wall-left' | 'wall-right' | 'ceiling';
type FaceDir = 'right' | 'left';

const IDLE_MESSAGES = [
  'Привет! 👋', 'Чем занимаешься? 😊', 'Поиграем? 🎮',
  'Хочу поговорить! 💬', 'Мне скучно... 🥺', 'Посмотри на меня! 😄',
  'Я умею лазать по стенам! 🧗', 'Хочу полетать! 🦋',
];

export default function OverlayCharacter({ character, onChat, onAction, onClose }: OverlayCharacterProps) {
  // Позиция и скорость
  const posRef = useRef({ x: window.innerWidth - 200, y: window.innerHeight - 200 });
  const velRef = useRef({ x: 0, y: 0 });
  const surfaceRef = useRef<Surface>('air');
  const faceRef = useRef<FaceDir>('right');
  const animRef = useRef<AnimationState>('fall');
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number>(0);
  const behaviorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const flyModeRef = useRef(false);
  const flyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const climbDirRef = useRef<'up' | 'down'>('up');

  // React state только для рендера
  const [renderPos, setRenderPos] = useState(posRef.current);
  const [renderAnim, setRenderAnim] = useState<AnimationState>('fall');
  const [renderFace, setRenderFace] = useState<FaceDir>('right');
  const [bubble, setBubble] = useState<SpeechBubble>({ text: '', visible: false });
  const [isDragging, setIsDragging] = useState(false);
  const [isFlying, setIsFlying] = useState(false);

  const showBubble = useCallback((text: string, duration = 3000) => {
    setBubble({ text, visible: true });
    if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => setBubble({ text: '', visible: false }), duration);
  }, []);

  const setAnim = useCallback((a: AnimationState) => {
    animRef.current = a;
    setRenderAnim(a);
  }, []);

  const setFace = useCallback((d: FaceDir) => {
    faceRef.current = d;
    setRenderFace(d);
  }, []);

  // Главный физический цикл
  useEffect(() => {
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const GROUND = () => H() - CHAR_H - 60; // 60px — панель управления

    const lastBehaviorTick = 0;
    let behaviorPhase: 'idle' | 'run' | 'climb' | 'fly' | 'jump' = 'idle';
    let behaviorTarget = { x: 0, y: 0 };
    let behaviorTicks = 0;
    let tickCount = 0;

    const pickNewBehavior = () => {
      const roll = Math.random();
      const surface = surfaceRef.current;

      if (flyModeRef.current) {
        behaviorPhase = 'fly';
        behaviorTarget = {
          x: 80 + Math.random() * (W() - 200),
          y: 60 + Math.random() * (H() * 0.6),
        };
        behaviorTicks = 120 + Math.random() * 180;
        return;
      }

      if (roll < 0.30) {
        behaviorPhase = 'run';
        const dir = Math.random() > 0.5 ? 1 : -1;
        behaviorTarget.x = posRef.current.x + dir * (100 + Math.random() * 250);
        behaviorTicks = 60 + Math.random() * 80;
      } else if (roll < 0.55 && (surface === 'wall-left' || surface === 'wall-right')) {
        behaviorPhase = 'climb';
        climbDirRef.current = Math.random() > 0.5 ? 'up' : 'down';
        behaviorTicks = 60 + Math.random() * 100;
      } else if (roll < 0.65 && surface === 'ground') {
        behaviorPhase = 'jump';
        velRef.current.y = -(9 + Math.random() * 5);
        velRef.current.x = (Math.random() - 0.5) * 6;
        behaviorTicks = 40;
      } else if (roll < 0.72) {
        // Подойти к стене
        behaviorPhase = 'run';
        behaviorTarget.x = Math.random() > 0.5 ? W() - CHAR_W - 5 : 5;
        behaviorTicks = 120;
      } else {
        behaviorPhase = 'idle';
        behaviorTicks = 80 + Math.random() * 120;
        if (Math.random() < 0.3) {
          showBubble(IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)]);
        }
      }
    };

    const tick = () => {
      if (isDraggingRef.current) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      tickCount++;
      const p = posRef.current;
      const v = velRef.current;
      const surface = surfaceRef.current;
      const ground = GROUND();
      const w = W();

      // Поведение AI
      behaviorTicks--;
      if (behaviorTicks <= 0) {
        pickNewBehavior();
      }

      if (behaviorPhase === 'run') {
        const dx = behaviorTarget.x - p.x;
        if (Math.abs(dx) > 8 && surface === 'ground') {
          const dir = dx > 0 ? 1 : -1;
          v.x += dir * 0.8;
          v.x = Math.max(-RUN_SPEED, Math.min(RUN_SPEED, v.x));
          setFace(dir > 0 ? 'right' : 'left');
          setAnim('run');
        } else {
          behaviorPhase = 'idle';
          behaviorTicks = 30;
        }
      } else if (behaviorPhase === 'climb') {
        if (surface === 'wall-left' || surface === 'wall-right') {
          const dir = climbDirRef.current === 'up' ? -1 : 1;
          v.y = dir * WALL_CLIMB_SPEED;
          v.x = 0;
          setAnim('climb');
          setFace(surface === 'wall-left' ? 'right' : 'left');
          // Прыгнуть со стены при случае
          if (Math.random() < 0.008) {
            const jumpDir = surface === 'wall-left' ? 1 : -1;
            v.x = jumpDir * (4 + Math.random() * 3);
            v.y = -(7 + Math.random() * 4);
            setAnim('jump');
            showBubble('Прыжок! 🦘', 1000);
            behaviorPhase = 'idle';
            behaviorTicks = 50;
          }
        } else {
          behaviorPhase = 'idle';
          behaviorTicks = 20;
        }
      } else if (behaviorPhase === 'fly') {
        const dx = behaviorTarget.x - p.x;
        const dy = behaviorTarget.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 20) {
          v.x += (dx / dist) * 0.5;
          v.y += (dy / dist) * 0.5;
          v.x = Math.max(-FLY_SPEED, Math.min(FLY_SPEED, v.x));
          v.y = Math.max(-FLY_SPEED, Math.min(FLY_SPEED, v.y));
          setFace(dx > 0 ? 'right' : 'left');
        } else {
          behaviorTarget = {
            x: 80 + Math.random() * (w - 200),
            y: 60 + Math.random() * (window.innerHeight * 0.6),
          };
        }
        setAnim('fly');
      } else if (behaviorPhase === 'jump') {
        setAnim(v.y < 0 ? 'jump' : 'fall');
      } else {
        // idle — небольшие случайные движения
        if (surface === 'ground') {
          if (Math.random() < 0.015 && Math.abs(v.x) < 0.5) {
            setAnim('idle');
          }
        }
      }

      // Физика: гравитация
      if (!flyModeRef.current) {
        if (surface === 'wall-left' || surface === 'wall-right') {
          // На стене — замедленное скольжение
          if (behaviorPhase !== 'climb') {
            v.y += GRAVITY * 0.15;
            v.y = Math.min(v.y, 1.5);
          }
        } else if (surface === 'ground') {
          v.y = 0;
          v.x *= GROUND_FRICTION;
          if (Math.abs(v.x) < 0.2) v.x = 0;
        } else {
          v.y += GRAVITY;
          v.x *= AIR_RESISTANCE;
        }
      } else {
        // Полёт — сопротивление воздуха
        v.x *= 0.92;
        v.y *= 0.92;
      }

      // Новая позиция
      let nx = p.x + v.x;
      let ny = p.y + v.y;
      let newSurface: Surface = 'air';

      // Столкновение с землёй
      if (ny >= ground) {
        ny = ground;
        if (v.y > 2) {
          v.y = -v.y * BOUNCE_FACTOR;
          if (Math.abs(v.y) < 1) v.y = 0;
        } else {
          v.y = 0;
        }
        newSurface = 'ground';
        if (behaviorPhase !== 'run') setAnim('idle');
      }

      // Столкновение с потолком (навбар ~64px)
      if (ny <= 64) {
        ny = 64;
        v.y = Math.abs(v.y) * BOUNCE_FACTOR;
      }

      // Столкновение со стенами
      if (nx <= 0) {
        nx = 0;
        v.x = Math.abs(v.x) * 0.3;
        newSurface = 'wall-left';
        if (behaviorPhase === 'run') {
          behaviorPhase = 'climb';
          climbDirRef.current = 'up';
          behaviorTicks = 80 + Math.random() * 60;
        }
      } else if (nx >= w - CHAR_W) {
        nx = w - CHAR_W;
        v.x = -Math.abs(v.x) * 0.3;
        newSurface = 'wall-right';
        if (behaviorPhase === 'run') {
          behaviorPhase = 'climb';
          climbDirRef.current = 'up';
          behaviorTicks = 80 + Math.random() * 60;
        }
      }

      if (newSurface === 'air' && ny < ground) newSurface = 'air';

      // Анимация по физическому состоянию (если не перебита поведением)
      if (behaviorPhase !== 'climb' && behaviorPhase !== 'run' && behaviorPhase !== 'fly') {
        if (newSurface === 'air') {
          setAnim(v.y < -1 ? 'jump' : v.y > 1 ? 'fall' : 'idle');
        } else if (newSurface === 'wall-left' || newSurface === 'wall-right') {
          if (behaviorPhase !== 'climb') setAnim('climb');
        }
      }

      surfaceRef.current = newSurface;
      posRef.current = { x: nx, y: ny };

      // Обновляем рендер каждые 2 кадра для производительности
      if (tickCount % 2 === 0) {
        setRenderPos({ x: nx, y: ny });
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    // Запускаем режим полёта периодически
    const scheduleFly = () => {
      flyTimerRef.current = setTimeout(() => {
        if (!isDraggingRef.current) {
          flyModeRef.current = true;
          setIsFlying(true);
          setAnim('fly');
          showBubble('Я лечу! 🦋✨', 2000);
          const flyDuration = 5000 + Math.random() * 8000;
          setTimeout(() => {
            flyModeRef.current = false;
            setIsFlying(false);
            velRef.current.y = 1;
          }, flyDuration);
        }
        scheduleFly();
      }, 20000 + Math.random() * 30000);
    };
    scheduleFly();

    return () => {
      cancelAnimationFrame(frameRef.current);
      if (flyTimerRef.current) clearTimeout(flyTimerRef.current);
    };
  }, []);

  // Приветствие при появлении
  useEffect(() => {
    const diff = Date.now() - (character.lastSeen || 0);
    if (diff > 1800000) {
      const msgs = character.personality?.missedMessages || ['Скучал по тебе! 🥺'];
      setTimeout(() => showBubble(msgs[Math.floor(Math.random() * msgs.length)], 5000), 1500);
    } else {
      const greets = character.personality?.greetings || ['Привет! 😊'];
      setTimeout(() => showBubble(greets[Math.floor(Math.random() * greets.length)], 3000), 800);
    }
  }, [character.id]);

  // Drag — mouse
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    dragOffsetRef.current = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y };
    velRef.current = { x: 0, y: 0 };
    setAnim('grab');
    showBubble('Вееееее! 🎉', 1500);
    e.preventDefault();
  };

  // Drag — touch
  const onTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const touch = e.touches[0];
    isDraggingRef.current = true;
    setIsDragging(true);
    dragOffsetRef.current = { x: touch.clientX - posRef.current.x, y: touch.clientY - posRef.current.y };
    velRef.current = { x: 0, y: 0 };
    setAnim('grab');
    showBubble('Вееееее! 🎉', 1500);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;
    let lastX = posRef.current.x;
    let lastY = posRef.current.y;

    const onMove = (e: MouseEvent) => {
      const nx = Math.max(0, Math.min(window.innerWidth - CHAR_W, e.clientX - dragOffsetRef.current.x));
      const ny = Math.max(64, Math.min(window.innerHeight - CHAR_H - 60, e.clientY - dragOffsetRef.current.y));
      velRef.current = { x: (nx - lastX) * 0.5, y: (ny - lastY) * 0.5 };
      lastX = nx; lastY = ny;
      posRef.current = { x: nx, y: ny };
      setRenderPos({ x: nx, y: ny });
    };
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const nx = Math.max(0, Math.min(window.innerWidth - CHAR_W, touch.clientX - dragOffsetRef.current.x));
      const ny = Math.max(64, Math.min(window.innerHeight - CHAR_H - 60, touch.clientY - dragOffsetRef.current.y));
      velRef.current = { x: (nx - lastX) * 0.5, y: (ny - lastY) * 0.5 };
      lastX = nx; lastY = ny;
      posRef.current = { x: nx, y: ny };
      setRenderPos({ x: nx, y: ny });
      e.preventDefault();
    };
    const onUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      surfaceRef.current = 'air';
      // Бросок — кидаем с сохранённой скоростью
      velRef.current.x *= 1.5;
      velRef.current.y *= 1.5;
      setAnim('fall');
      showBubble('Бум! 💥', 1000);
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
  }, [isDragging]);

  const handleAction = (action: 'hit' | 'kiss' | 'pet') => {
    const reactions = character.personality?.reactions?.[action] || ['!'];
    showBubble(reactions[Math.floor(Math.random() * reactions.length)], 2500);
    onAction(action);
    if (action === 'hit') {
      velRef.current.x = (Math.random() - 0.5) * 10;
      velRef.current.y = -5;
      surfaceRef.current = 'air';
    }
  };

  // Вычисляем вращение при полёте/перетаскивании
  const isOnWall = renderAnim === 'climb';
  const wallRotate = isOnWall
    ? (surfaceRef.current === 'wall-left' ? -90 : 90)
    : 0;
  const dragRotate = isDragging ? (faceRef.current === 'left' ? 8 : -8) : 0;
  const flyTilt = isFlying && !isDragging ? (velRef.current.x > 0.3 ? -15 : velRef.current.x < -0.3 ? 15 : 0) : 0;

  const rotate = isDragging ? dragRotate : isOnWall ? wallRotate : flyTilt;
  const scaleX = faceRef.current === 'left' ? -1 : 1;

  return (
    <div
      style={{
        position: 'fixed',
        left: renderPos.x,
        top: renderPos.y,
        zIndex: 9999,
        width: CHAR_W,
        userSelect: 'none',
      }}
    >
      {/* Speech bubble */}
      {bubble.visible && (
        <div
          className="animate-speech-pop absolute bg-white rounded-2xl px-4 py-2 text-sm font-nunito font-semibold shadow-xl border-2 border-purple-200"
          style={{
            bottom: CHAR_H + 8,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 200,
            whiteSpace: 'normal',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        >
          {bubble.text}
          <div className="absolute left-1/2 -bottom-2.5 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-purple-200 rotate-45" />
        </div>
      )}

      {/* Character body */}
      <div
        className="relative select-none"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        style={{
          transform: `scaleX(${scaleX}) rotate(${rotate}deg)`,
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging || isOnWall ? 'none' : 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          filter: isDragging
            ? `drop-shadow(0 16px 24px ${character.color}88) drop-shadow(0 6px 8px rgba(0,0,0,0.3))`
            : isFlying
            ? `drop-shadow(0 4px 20px ${character.color}99) brightness(1.08)`
            : `drop-shadow(0 4px 8px ${character.color}44)`,
        }}
      >
        {/* Glow при захвате */}
        {isDragging && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${character.color}44 0%, transparent 70%)`,
              transform: 'scale(1.5)',
              animation: 'pulse 1s ease-in-out infinite',
            }}
          />
        )}

        {/* Следы/искры при полёте */}
        {isFlying && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full opacity-60 animate-sparkle"
                style={{
                  width: 6 - i * 1.5,
                  height: 6 - i * 1.5,
                  background: character.color,
                  left: `${40 + i * 15}%`,
                  top: `${50 + i * 10}%`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        )}

        <CharacterSprite character={character} animation={renderAnim} size={CHAR_W} />

        {/* Тень на земле когда держат */}
        {isDragging && (
          <div
            className="absolute left-1/2 pointer-events-none rounded-full"
            style={{
              width: 55,
              height: 9,
              background: 'rgba(0,0,0,0.18)',
              filter: 'blur(4px)',
              bottom: -4,
              transform: 'translateX(-50%)',
            }}
          />
        )}
      </div>

      {/* Тень на земле (постоянная) */}
      {!isDragging && surfaceRef.current !== 'wall-left' && surfaceRef.current !== 'wall-right' && (
        <div
          className="absolute left-1/2 pointer-events-none rounded-full"
          style={{
            width: Math.max(20, 55 - (window.innerHeight - CHAR_H - 60 - renderPos.y) * 0.12),
            height: 7,
            background: 'rgba(0,0,0,0.1)',
            filter: 'blur(3px)',
            bottom: -(window.innerHeight - CHAR_H - 60 - renderPos.y + 6),
            transform: 'translateX(-50%)',
            opacity: Math.max(0, 1 - (window.innerHeight - CHAR_H - 60 - renderPos.y) / 300),
          }}
        />
      )}

      {/* Панель управления */}
      <div className="flex items-center justify-center gap-1 mt-1">
        <button onClick={() => handleAction('hit')}
          className="w-7 h-7 rounded-full bg-white shadow-md hover:scale-110 transition-all text-sm border border-red-100"
          title="Ударить">👊</button>
        <button onClick={() => handleAction('kiss')}
          className="w-7 h-7 rounded-full bg-white shadow-md hover:scale-110 transition-all text-sm border border-pink-100"
          title="Поцеловать">💋</button>
        <button onClick={() => handleAction('pet')}
          className="w-7 h-7 rounded-full bg-white shadow-md hover:scale-110 transition-all text-sm border border-yellow-100"
          title="Погладить">🤚</button>
        <button
          onClick={() => {
            flyModeRef.current = !flyModeRef.current;
            setIsFlying(flyModeRef.current);
            if (flyModeRef.current) {
              showBubble('Я лечу! 🦋✨', 2000);
            } else {
              velRef.current.y = 1;
            }
          }}
          className={`w-7 h-7 rounded-full shadow-md hover:scale-110 transition-all text-sm border ${isFlying ? 'bg-purple-200 border-purple-300' : 'bg-white border-blue-100'}`}
          title="Летать">🦋</button>
        <button onClick={onChat}
          className="w-7 h-7 rounded-full bg-white shadow-md hover:scale-110 transition-all border border-purple-100"
          title="Чат">
          <Icon name="MessageCircle" size={14} className="text-purple-500 mx-auto" />
        </button>
        <button onClick={onClose}
          className="w-6 h-6 rounded-full bg-white shadow-md hover:scale-110 transition-all border border-gray-100"
          title="Закрыть">
          <Icon name="X" size={11} className="text-gray-400 mx-auto" />
        </button>
      </div>

      {/* Полоска счастья */}
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
