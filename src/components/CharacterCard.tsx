import { Character } from '@/types/character';
import Icon from '@/components/ui/icon';

interface CharacterCardProps {
  character: Character;
  isActive?: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  if (hours < 24) return `${hours} ч назад`;
  return `${days} д назад`;
}

export default function CharacterCard({ character, isActive, onSelect, onDelete, onEdit }: CharacterCardProps) {
  const missedTime = Date.now() - (character.lastSeen || 0);
  const isMissed = missedTime > 3600000; // 1 hour

  return (
    <div
      className={`candy-card p-5 relative overflow-hidden cursor-pointer group ${
        isActive ? 'ring-3 ring-purple-400 ring-offset-2' : ''
      }`}
      onClick={onSelect}
    >
      {/* Background gradient blob */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-15 blur-xl"
        style={{ background: character.color }}
      />

      {/* Active badge */}
      {isActive && (
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-purple-500 text-white text-xs font-nunito font-bold rounded-full flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          Активен
        </div>
      )}

      {/* Actions */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button
          onClick={e => { e.stopPropagation(); onEdit(); }}
          className="w-7 h-7 rounded-lg bg-white shadow-md hover:bg-purple-50 flex items-center justify-center transition-all"
        >
          <Icon name="Settings" size={13} className="text-gray-400" />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="w-7 h-7 rounded-lg bg-white shadow-md hover:bg-red-50 flex items-center justify-center transition-all"
        >
          <Icon name="Trash2" size={13} className="text-red-400" />
        </button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center pt-4 pb-3">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg mb-3 transition-transform group-hover:scale-110"
            style={{ background: `linear-gradient(135deg, ${character.color}, ${character.color}99)` }}
          >
            {character.sprites.idle ? (
              <img
                src={character.sprites.idle}
                alt={character.name}
                className="w-full h-full object-contain rounded-full"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : character.emoji}
          </div>
          {/* Missed indicator */}
          {isMissed && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-400 rounded-full flex items-center justify-center text-xs border-2 border-white animate-pulse">
              💔
            </div>
          )}
        </div>

        <h3 className="font-nunito font-black text-lg text-gray-800">{character.name}</h3>
        <p className="font-nunito text-xs text-gray-400 mt-0.5">
          {character.personality?.name || 'Персонаж'}
        </p>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        {/* Happiness */}
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {character.happiness > 70 ? '😄' : character.happiness > 40 ? '😊' : '🥺'}
          </span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${character.happiness}%`,
                background: character.happiness > 60 ? '#34D399' : character.happiness > 30 ? '#FCD34D' : '#FF6B9D',
              }}
            />
          </div>
          <span className="text-xs font-nunito font-bold text-gray-400 w-7 text-right">{character.happiness}%</span>
        </div>

        {/* Sprites count */}
        <div className="flex items-center justify-between text-xs text-gray-400 font-nunito font-semibold">
          <span>🎨 Спрайтов: {Object.keys(character.sprites).length}/14</span>
          <span>⏰ {timeAgo(character.lastSeen || character.createdAt)}</span>
        </div>
      </div>

      {/* Select button */}
      <button
        className={`w-full mt-4 py-2.5 rounded-2xl font-nunito font-bold text-sm transition-all ${
          isActive
            ? 'bg-purple-100 text-purple-700 cursor-default'
            : 'btn-candy'
        }`}
        onClick={e => { e.stopPropagation(); if (!isActive) onSelect(); }}
      >
        {isActive ? '✓ Выбран' : 'Выбрать'}
      </button>
    </div>
  );
}
