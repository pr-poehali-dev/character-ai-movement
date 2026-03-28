import { useState, useCallback } from 'react';
import { Character, ChatMessage, SpriteSet, AnimationState } from '@/types/character';

const STORAGE_KEY = 'spritepet_characters';

const DEFAULT_PERSONALITIES = [
  {
    name: 'Весёлый',
    traits: ['энергичный', 'оптимистичный', 'игривый'],
    greetings: ['Привет! Я так рад тебя видеть! 🎉', 'О, ты вернулся! Ура! ✨', 'Привееет! Скучал по тебе!'],
    missedMessages: [
      'Эй, где ты? Я соскучился 🥺',
      'Ты давно не заходил... Всё хорошо? 💙',
      'Привет! Думал о тебе весь день ✨',
    ],
    reactions: {
      hit: ['Ай! Это же больно! 😢', 'За что?! 😠', 'Ну зачем так... 🥺'],
      kiss: ['Ой, я покраснел! 😊💕', 'Спасибо, ты лучший! 💋', 'Мур-мур~ 💗'],
      pet: ['Мммм... ещё! 😌', 'Так приятно~ 🥰', 'Ты самый лучший хозяин!'],
    }
  },
  {
    name: 'Загадочный',
    traits: ['вдумчивый', 'мудрый', 'спокойный'],
    greetings: ['Ты пришёл... я ждал. 🌙', 'Снова встречаемся. ✨', 'Хороший момент, чтобы поговорить.'],
    missedMessages: [
      'Долго тебя не было. Я думал... 🌙',
      'Время идёт медленно без тебя...',
      'Звёзды напоминают мне о тебе 🌟',
    ],
    reactions: {
      hit: ['Интересно. Зачем? 🤔', 'Ощущение... необычное.', 'Хм. Больно.'],
      kiss: ['Нечасто такое бывает... 🌸', 'Неожиданно. Приятно.', '...спасибо.'],
      pet: ['Хорошо. Продолжай. 😌', 'Это... приятно.', 'Мммм.'],
    }
  }
];

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function loadCharacters(): Character[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCharacters(chars: Character[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chars));
}

export function createDefaultCharacter(name: string, emoji: string, color: string, personalityIndex = 0): Character {
  const personality = DEFAULT_PERSONALITIES[personalityIndex % DEFAULT_PERSONALITIES.length];
  return {
    id: generateId(),
    name,
    description: `Весёлый персонаж по имени ${name}`,
    color,
    emoji,
    sprites: {},
    personality: {
      name: personality.name,
      traits: personality.traits,
      greetings: personality.greetings,
      missedMessages: personality.missedMessages,
      reactions: personality.reactions,
    },
    level: 1,
    happiness: 80,
    lastSeen: Date.now(),
    createdAt: Date.now(),
    chatHistory: [],
  };
}

export function useCharacterStore() {
  const [characters, setCharacters] = useState<Character[]>(loadCharacters);
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(
    () => {
      const stored = localStorage.getItem('spritepet_active');
      return stored || null;
    }
  );

  const activeCharacter = characters.find(c => c.id === activeCharacterId) || null;

  const addCharacter = useCallback((char: Character) => {
    setCharacters(prev => {
      const updated = [...prev, char];
      saveCharacters(updated);
      return updated;
    });
  }, []);

  const updateCharacter = useCallback((id: string, updates: Partial<Character>) => {
    setCharacters(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      saveCharacters(updated);
      return updated;
    });
  }, []);

  const deleteCharacter = useCallback((id: string) => {
    setCharacters(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveCharacters(updated);
      return updated;
    });
    if (activeCharacterId === id) {
      setActiveCharacterId(null);
      localStorage.removeItem('spritepet_active');
    }
  }, [activeCharacterId]);

  const selectCharacter = useCallback((id: string) => {
    setActiveCharacterId(id);
    localStorage.setItem('spritepet_active', id);
    updateCharacter(id, { lastSeen: Date.now() });
  }, [updateCharacter]);

  const updateSprite = useCallback((charId: string, state: AnimationState, dataUrl: string) => {
    setCharacters(prev => {
      const updated = prev.map(c => {
        if (c.id !== charId) return c;
        return { ...c, sprites: { ...c.sprites, [state]: dataUrl } };
      });
      saveCharacters(updated);
      return updated;
    });
  }, []);

  const addMessage = useCallback((charId: string, message: ChatMessage) => {
    setCharacters(prev => {
      const updated = prev.map(c => {
        if (c.id !== charId) return c;
        const history = [...(c.chatHistory || []), message].slice(-100);
        return { ...c, chatHistory: history };
      });
      saveCharacters(updated);
      return updated;
    });
  }, []);

  const updateHappiness = useCallback((charId: string, delta: number) => {
    setCharacters(prev => {
      const updated = prev.map(c => {
        if (c.id !== charId) return c;
        const happiness = Math.max(0, Math.min(100, c.happiness + delta));
        return { ...c, happiness };
      });
      saveCharacters(updated);
      return updated;
    });
  }, []);

  return {
    characters,
    activeCharacter,
    activeCharacterId,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    selectCharacter,
    updateSprite,
    addMessage,
    updateHappiness,
  };
}
