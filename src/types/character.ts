export type AnimationState = 
  | 'idle' 
  | 'walk' 
  | 'run' 
  | 'jump'
  | 'grab'
  | 'fall' 
  | 'fly'
  | 'climb'
  | 'sit' 
  | 'sleep' 
  | 'wave' 
  | 'dance'
  | 'hit'
  | 'kiss'
  | 'pet'
  | 'happy'
  | 'sad';

export interface SpriteSet {
  [key in AnimationState]?: string; // base64 or URL
}

export interface CharacterPersonality {
  name: string;
  traits: string[];
  greetings: string[];
  missedMessages: string[];
  reactions: {
    hit: string[];
    kiss: string[];
    pet: string[];
  };
}

export interface Character {
  id: string;
  name: string;
  description: string;
  color: string;
  emoji: string;
  sprites: SpriteSet;
  personality: CharacterPersonality;
  level: number;
  happiness: number;
  lastSeen: number;
  createdAt: number;
  chatHistory: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'character';
  text: string;
  timestamp: number;
  emotion?: string;
}