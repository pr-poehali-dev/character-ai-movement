import { useState } from 'react';
import { Character } from '@/types/character';
import { createDefaultCharacter } from '@/store/characterStore';
import Icon from '@/components/ui/icon';

interface CharacterCreatorProps {
  onCreated: (char: Character) => void;
  onCancel: () => void;
}

const EMOJI_OPTIONS = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐨', '🐸', '🦄', '🐲', '🌸', '⭐', '🔥', '💎', '🎮', '🎵', '🧸'];
const COLOR_OPTIONS = [
  '#A855F7', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444',
  '#8B5CF6', '#F97316', '#06B6D4', '#84CC16', '#F43F5E', '#6366F1',
];
const PERSONALITY_OPTIONS = [
  { id: 0, label: '🎉 Весёлый', desc: 'Энергичный, оптимистичный, любит играть' },
  { id: 1, label: '🌙 Загадочный', desc: 'Вдумчивый, мудрый, говорит загадками' },
];

export default function CharacterCreator({ onCreated, onCancel }: CharacterCreatorProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🐱');
  const [color, setColor] = useState('#A855F7');
  const [personality, setPersonality] = useState(0);
  const [nameError, setNameError] = useState('');

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) { setNameError('Придумай имя для персонажа!'); return; }
      if (name.trim().length < 2) { setNameError('Имя должно быть не короче 2 символов'); return; }
      setNameError('');
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      const char = createDefaultCharacter(name.trim(), emoji, color, personality);
      onCreated(char);
    }
  };

  const preview = createDefaultCharacter(name || 'Превью', emoji, color, personality);

  return (
    <div className="max-w-lg mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-nunito font-black text-sm transition-all ${
                s === step
                  ? 'text-white shadow-lg scale-110'
                  : s < step
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
              style={s <= step ? { background: 'linear-gradient(135deg, #A855F7, #EC4899)' } : {}}
            >
              {s < step ? <Icon name="Check" size={14} /> : s}
            </div>
            {s < 3 && (
              <div className={`w-12 h-0.5 rounded transition-all ${s < step ? 'bg-purple-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Name */}
      {step === 1 && (
        <div className="animate-fade-scale space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-3">✏️</div>
            <h2 className="font-nunito font-black text-2xl text-gray-800">Как зовут персонажа?</h2>
            <p className="text-gray-500 font-nunito mt-1">Придумай уникальное и запоминающееся имя</p>
          </div>
          <div>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setNameError(''); }}
              placeholder="Например: Котик, Дракоша, Пушок..."
              maxLength={20}
              autoFocus
              className={`w-full px-5 py-4 rounded-2xl border-2 font-nunito font-bold text-lg text-center focus:outline-none transition-all bg-white ${
                nameError ? 'border-red-400 bg-red-50' : 'border-purple-200 focus:border-purple-500'
              }`}
              onKeyDown={e => e.key === 'Enter' && handleNext()}
            />
            {nameError && (
              <p className="text-red-500 text-sm font-nunito font-semibold mt-2 text-center">{nameError}</p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Appearance */}
      {step === 2 && (
        <div className="animate-fade-scale space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-3">🎨</div>
            <h2 className="font-nunito font-black text-2xl text-gray-800">Выбери внешность</h2>
            <p className="text-gray-500 font-nunito mt-1">Пока без спрайтов — их можно добавить позже</p>
          </div>

          {/* Preview */}
          <div className="flex justify-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-xl animate-float"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
            >
              {emoji}
            </div>
          </div>

          {/* Emoji */}
          <div>
            <p className="font-nunito font-bold text-sm text-gray-600 mb-2">Выбери эмоджи</p>
            <div className="grid grid-cols-8 gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-xl text-2xl transition-all hover:scale-110 ${
                    emoji === e ? 'ring-2 ring-purple-500 bg-purple-50 scale-110' : 'bg-gray-50 hover:bg-purple-50'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <p className="font-nunito font-bold text-sm text-gray-600 mb-2">Основной цвет</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-full transition-all hover:scale-110 ${
                    color === c ? 'ring-3 ring-offset-2 ring-purple-500 scale-110' : ''
                  }`}
                  style={{ background: c, boxShadow: `0 4px 12px ${c}55` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Personality */}
      {step === 3 && (
        <div className="animate-fade-scale space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-3">🧠</div>
            <h2 className="font-nunito font-black text-2xl text-gray-800">Характер персонажа</h2>
            <p className="text-gray-500 font-nunito mt-1">От этого зависит как он будет общаться</p>
          </div>

          <div className="space-y-3">
            {PERSONALITY_OPTIONS.map(p => (
              <button
                key={p.id}
                onClick={() => setPersonality(p.id)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  personality === p.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div className="font-nunito font-black text-base text-gray-800">{p.label}</div>
                <div className="font-nunito text-sm text-gray-500 mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>

          {/* Final preview */}
          <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100 flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
            >
              {emoji}
            </div>
            <div>
              <div className="font-nunito font-black text-xl text-gray-800">{name}</div>
              <div className="font-nunito text-sm text-gray-500">
                {PERSONALITY_OPTIONS[personality].label}
              </div>
              <div className="flex gap-1 mt-1">
                {['😊', '💬', '🎮'].map(e => (
                  <span key={e} className="text-sm">{e}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={step === 1 ? onCancel : () => setStep(s => s - 1)}
          className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-nunito font-bold text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all"
        >
          {step === 1 ? 'Отмена' : '← Назад'}
        </button>
        <button
          onClick={handleNext}
          className="flex-[2] py-3 btn-candy text-base"
        >
          {step < 3 ? 'Далее →' : '🎉 Создать персонажа!'}
        </button>
      </div>
    </div>
  );
}
