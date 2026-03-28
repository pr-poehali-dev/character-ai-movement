import { useState, useEffect, useRef } from 'react';
import { Character, AnimationState } from '@/types/character';

interface CharacterSpriteProps {
  character: Character;
  animation: AnimationState;
  size?: number;
  onClick?: () => void;
  onAction?: (action: 'hit' | 'kiss' | 'pet') => void;
  interactive?: boolean;
  className?: string;
}

const EMOJI_ANIMATIONS: Record<AnimationState, string> = {
  idle: '😊',
  walk: '🚶',
  run: '🏃',
  jump: '🦘',
  grab: '😲',
  fall: '😱',
  sit: '🧘',
  sleep: '😴',
  wave: '👋',
  dance: '💃',
  hit: '😢',
  kiss: '😘',
  pet: '🥰',
  happy: '😄',
  sad: '😢',
};

interface FloatingEffect {
  id: number;
  emoji: string;
  x: number;
}

export default function CharacterSprite({
  character,
  animation,
  size = 80,
  onClick,
  onAction,
  interactive = false,
  className = '',
}: CharacterSpriteProps) {
  const [currentAnim, setCurrentAnim] = useState<AnimationState>(animation);
  const [effects, setEffects] = useState<FloatingEffect[]>([]);
  const [isReacting, setIsReacting] = useState(false);
  const effectCounter = useRef(0);

  useEffect(() => {
    setCurrentAnim(animation);
  }, [animation]);

  const addEffect = (emoji: string) => {
    const id = effectCounter.current++;
    const x = Math.random() * 60 - 30;
    setEffects(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => setEffects(prev => prev.filter(e => e.id !== id)), 1000);
  };

  const handleAction = (action: 'hit' | 'kiss' | 'pet') => {
    if (isReacting) return;
    setIsReacting(true);

    const animMap: Record<string, AnimationState> = { hit: 'hit', kiss: 'kiss', pet: 'pet' };
    const effectMap = { hit: '💥', kiss: '💋', pet: '✨' };

    setCurrentAnim(animMap[action]);
    addEffect(effectMap[action]);
    onAction?.(action);

    setTimeout(() => {
      setCurrentAnim('idle');
      setIsReacting(false);
    }, 1500);
  };

  const sprite = character.sprites[currentAnim] || character.sprites.idle;
  const displayEmoji = EMOJI_ANIMATIONS[currentAnim];

  const animClass = {
    idle: 'animate-bounce-char',
    walk: '',
    run: '',
    jump: '',
    grab: 'animate-wiggle',
    fall: 'animate-fall',
    sit: '',
    sleep: '',
    wave: 'animate-wiggle',
    dance: 'animate-wiggle',
    hit: 'animate-wiggle',
    kiss: '',
    pet: '',
    happy: 'animate-bounce-char',
    sad: '',
  }[currentAnim] || '';

  return (
    <div
      className={`relative flex flex-col items-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Floating effects */}
      {effects.map(effect => (
        <div
          key={effect.id}
          className="absolute animate-heart-pop pointer-events-none text-2xl z-10"
          style={{ bottom: '100%', left: `calc(50% + ${effect.x}px)`, transform: 'translateX(-50%)' }}
        >
          {effect.emoji}
        </div>
      ))}

      {/* Character body */}
      <div
        className={`cursor-pointer transition-transform ${animClass}`}
        style={{ width: size, height: size }}
        onClick={onClick}
      >
        {sprite ? (
          <img
            src={sprite}
            alt={character.name}
            style={{ width: size, height: size, objectFit: 'contain', imageRendering: 'pixelated' }}
            draggable={false}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-full font-nunito font-black text-white shadow-lg"
            style={{
              width: size,
              height: size,
              background: `linear-gradient(135deg, ${character.color}, ${character.color}99)`,
              fontSize: size * 0.45,
              boxShadow: `0 4px 20px ${character.color}55`,
            }}
          >
            {displayEmoji || character.emoji}
          </div>
        )}
      </div>

      {/* Action buttons for interactive mode */}
      {interactive && (
        <div className="absolute -bottom-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleAction('hit')}
            className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 text-sm transition-all hover:scale-110 flex items-center justify-center"
            title="Ударить"
          >👊</button>
          <button
            onClick={() => handleAction('kiss')}
            className="w-7 h-7 rounded-full bg-pink-100 hover:bg-pink-200 text-sm transition-all hover:scale-110 flex items-center justify-center"
            title="Поцеловать"
          >💋</button>
          <button
            onClick={() => handleAction('pet')}
            className="w-7 h-7 rounded-full bg-yellow-100 hover:bg-yellow-200 text-sm transition-all hover:scale-110 flex items-center justify-center"
            title="Погладить"
          >🤚</button>
        </div>
      )}
    </div>
  );
}