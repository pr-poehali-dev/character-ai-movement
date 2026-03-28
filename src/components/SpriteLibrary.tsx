import { useRef, useState } from 'react';
import { Character, AnimationState } from '@/types/character';
import Icon from '@/components/ui/icon';

interface SpriteLibraryProps {
  character: Character;
  onUpload: (charId: string, state: AnimationState, dataUrl: string) => void;
}

const ANIMATION_STATES: { key: AnimationState; label: string; emoji: string; desc: string }[] = [
  { key: 'idle', label: 'Покой', emoji: '😊', desc: 'Стоит на месте' },
  { key: 'walk', label: 'Ходьба', emoji: '🚶', desc: 'Медленно идёт' },
  { key: 'run', label: 'Бег', emoji: '🏃', desc: 'Быстро бежит' },
  { key: 'jump', label: 'Прыжок', emoji: '🦘', desc: 'Прыгает вверх' },
  { key: 'grab', label: 'В руках ✨', emoji: '😲', desc: 'Когда держат/тащат' },
  { key: 'fall', label: 'Падение', emoji: '😱', desc: 'Падает вниз' },
  { key: 'sit', label: 'Сидит', emoji: '🧘', desc: 'Сидит на месте' },
  { key: 'sleep', label: 'Сон', emoji: '😴', desc: 'Спит' },
  { key: 'wave', label: 'Машет', emoji: '👋', desc: 'Машет рукой' },
  { key: 'dance', label: 'Танец', emoji: '💃', desc: 'Танцует' },
  { key: 'hit', label: 'Удар', emoji: '😢', desc: 'Реакция на удар' },
  { key: 'kiss', label: 'Поцелуй', emoji: '😘', desc: 'Реакция на поцелуй' },
  { key: 'pet', label: 'Поглаживание', emoji: '🥰', desc: 'Реакция на поглаживание' },
  { key: 'happy', label: 'Радость', emoji: '😄', desc: 'Очень счастлив' },
  { key: 'sad', label: 'Грусть', emoji: '😢', desc: 'Грустит' },
];

export default function SpriteLibrary({ character, onUpload }: SpriteLibraryProps) {
  const [dragOver, setDragOver] = useState<AnimationState | null>(null);
  const [preview, setPreview] = useState<{ state: AnimationState; url: string } | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFile = (state: AnimationState, file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onUpload(character.id, state, dataUrl);
      setPreview({ state, url: dataUrl });
      setTimeout(() => setPreview(null), 2000);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (state: AnimationState, e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(state, file);
  };

  const handleInputChange = (state: AnimationState, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(state, file);
  };

  const uploadedCount = Object.keys(character.sprites).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
        <div className="text-4xl">{character.emoji}</div>
        <div>
          <div className="font-nunito font-black text-gray-800 text-lg">{character.name}</div>
          <div className="font-nunito text-sm text-gray-500">
            Загружено спрайтов: <span className="font-bold text-purple-600">{uploadedCount}</span> / {ANIMATION_STATES.length}
          </div>
          <div className="mt-1.5 h-2 bg-gray-200 rounded-full overflow-hidden w-40">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(uploadedCount / ANIMATION_STATES.length) * 100}%`,
                background: 'linear-gradient(90deg, #A855F7, #EC4899)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Hint */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <Icon name="Info" size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm font-nunito font-semibold text-blue-700 leading-relaxed">
          Загружай PNG или GIF для каждой анимации. Лучший размер — 64×64 или 128×128 пикселей.
          Если спрайт не загружен — используется emoji-заглушка.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {ANIMATION_STATES.map(({ key, label, emoji, desc }) => {
          const hasSprite = !!character.sprites[key];
          const isSuccess = preview?.state === key;

          return (
            <div
              key={key}
              className={`sprite-drop-zone p-3 flex flex-col items-center gap-2 cursor-pointer transition-all
                ${dragOver === key ? 'drag-over' : ''}
                ${isSuccess ? 'border-green-400 bg-green-50' : ''}
              `}
              onDragOver={e => { e.preventDefault(); setDragOver(key); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(key, e)}
              onClick={() => inputRefs.current[key]?.click()}
            >
              <input
                ref={el => inputRefs.current[key] = el}
                type="file"
                accept="image/png,image/gif,image/jpeg,image/webp"
                className="hidden"
                onChange={e => handleInputChange(key, e)}
              />

              {/* Preview / placeholder */}
              <div className="relative w-14 h-14 rounded-xl overflow-hidden">
                {hasSprite ? (
                  <img
                    src={character.sprites[key]}
                    alt={label}
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-50">
                    {emoji}
                  </div>
                )}
                {isSuccess && (
                  <div className="absolute inset-0 bg-green-400/80 flex items-center justify-center rounded-xl">
                    <Icon name="Check" size={24} className="text-white" />
                  </div>
                )}
                {hasSprite && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                    <Icon name="Check" size={9} className="text-white" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="font-nunito font-bold text-xs text-gray-700">{label}</div>
                <div className="font-nunito text-xs text-gray-400">{desc}</div>
              </div>

              <div className="flex items-center gap-1 text-xs text-purple-500 font-nunito font-semibold">
                <Icon name="Upload" size={11} />
                <span>{hasSprite ? 'Заменить' : 'Загрузить'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}