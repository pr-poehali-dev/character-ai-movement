import { useState } from 'react';
import { useCharacterStore, createDefaultCharacter } from '@/store/characterStore';
import { Character, ChatMessage, AnimationState } from '@/types/character';
import CharacterCard from '@/components/CharacterCard';
import CharacterCreator from '@/components/CharacterCreator';
import ChatPanel from '@/components/ChatPanel';
import SpriteLibrary from '@/components/SpriteLibrary';
import OverlayCharacter from '@/components/OverlayCharacter';
import Icon from '@/components/ui/icon';

type Tab = 'home' | 'create' | 'chat' | 'sprites' | 'settings';

const DEMO_CHARACTERS = [
  { name: 'Котик', emoji: '🐱', color: '#A855F7', personality: 0 },
  { name: 'Дракоша', emoji: '🐲', color: '#10B981', personality: 1 },
];

export default function Index() {
  const store = useCharacterStore();
  const [tab, setTab] = useState<Tab>('home');
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreated = (char: Character) => {
    store.addCharacter(char);
    store.selectCharacter(char.id);
    setTab('sprites');
  };

  const handleDelete = (id: string) => {
    store.deleteCharacter(id);
    setDeleteConfirm(null);
    if (store.activeCharacterId === id) setOverlayVisible(false);
  };

  const handleOverlayAction = (action: 'hit' | 'kiss' | 'pet') => {
    const char = store.activeCharacter;
    if (!char) return;
    const delta = action === 'hit' ? -10 : action === 'pet' ? 5 : 8;
    store.updateHappiness(char.id, delta);
  };

  const handleAddDemo = () => {
    DEMO_CHARACTERS.forEach((d, i) => {
      const char = createDefaultCharacter(d.name, d.emoji, d.color, d.personality);
      store.addCharacter(char);
      if (i === 0) store.selectCharacter(char.id);
    });
  };

  const navItems: { key: Tab; icon: string; label: string }[] = [
    { key: 'home', icon: 'Home', label: 'Главная' },
    { key: 'create', icon: 'Plus', label: 'Создать' },
    { key: 'chat', icon: 'MessageCircle', label: 'Чат' },
    { key: 'sprites', icon: 'Image', label: 'Спрайты' },
    { key: 'settings', icon: 'Settings', label: 'Настройки' },
  ];

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-purple-100/60">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)' }}>
              🐾
            </div>
            <div>
              <div className="font-caveat font-bold text-2xl text-purple-700 leading-tight">СпрайтПет</div>
              <div className="text-xs font-nunito font-semibold text-gray-400 -mt-0.5">Живые персонажи</div>
            </div>
          </div>

          {store.activeCharacter && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full">
                <span className="text-lg">{store.activeCharacter.emoji}</span>
                <span className="font-nunito font-bold text-sm text-purple-700">{store.activeCharacter.name}</span>
              </div>
              <button
                onClick={() => setOverlayVisible(v => !v)}
                className={`px-4 py-2 rounded-full font-nunito font-bold text-sm transition-all flex items-center gap-2 ${
                  overlayVisible
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                <Icon name={overlayVisible ? 'EyeOff' : 'Eye'} size={15} />
                <span className="hidden sm:block">{overlayVisible ? 'Скрыть' : 'На экран'}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-28">

        {/* HOME TAB */}
        {tab === 'home' && (
          <div className="space-y-8 animate-slide-up">
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-nunito font-bold mb-4">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Живые персонажи на экране
              </div>
              <h1 className="font-nunito font-black text-4xl sm:text-5xl text-gray-800 leading-tight">
                Твои<br />
                <span
                  className="font-caveat"
                  style={{ background: 'linear-gradient(135deg, #A855F7, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  виртуальные друзья
                </span>
              </h1>
              <p className="text-gray-500 font-nunito font-semibold mt-3 text-lg max-w-md mx-auto leading-relaxed">
                Создавай персонажей, загружай спрайты и общайся с ними через AI-чат
              </p>
            </div>

            {store.characters.length === 0 ? (
              <div className="text-center py-12 space-y-6">
                <div className="text-7xl animate-float">🐾</div>
                <div>
                  <h2 className="font-nunito font-black text-2xl text-gray-700">Пока пусто</h2>
                  <p className="text-gray-400 font-nunito mt-1">Создай первого персонажа или добавь демо</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={() => setTab('create')} className="btn-candy px-8 py-3 text-base">
                    ✨ Создать персонажа
                  </button>
                  <button
                    onClick={handleAddDemo}
                    className="px-8 py-3 rounded-full border-2 border-purple-200 font-nunito font-bold text-purple-600 hover:bg-purple-50 transition-all"
                  >
                    🎁 Добавить демо
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-nunito font-black text-xl text-gray-800">
                    Мои персонажи <span className="text-purple-400">({store.characters.length})</span>
                  </h2>
                  <button onClick={() => setTab('create')} className="btn-candy px-4 py-2 text-sm flex items-center gap-2">
                    <Icon name="Plus" size={15} />
                    Создать
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {store.characters.map((char, i) => (
                    <div key={char.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                      {deleteConfirm === char.id ? (
                        <div className="candy-card p-5 text-center space-y-3">
                          <div className="text-3xl">🗑️</div>
                          <p className="font-nunito font-bold text-gray-700">Удалить <strong>{char.name}</strong>?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="flex-1 py-2 rounded-xl border-2 border-gray-200 font-nunito font-bold text-sm text-gray-500"
                            >Отмена</button>
                            <button
                              onClick={() => handleDelete(char.id)}
                              className="flex-1 py-2 rounded-xl bg-red-500 text-white font-nunito font-bold text-sm"
                            >Удалить</button>
                          </div>
                        </div>
                      ) : (
                        <CharacterCard
                          character={char}
                          isActive={store.activeCharacterId === char.id}
                          onSelect={() => store.selectCharacter(char.id)}
                          onDelete={() => setDeleteConfirm(char.id)}
                          onEdit={() => { store.selectCharacter(char.id); setTab('sprites'); }}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {store.activeCharacter && (
                  <div className="candy-card p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                        style={{ background: `${store.activeCharacter.color}22` }}
                      >
                        {store.activeCharacter.emoji}
                      </div>
                      <div>
                        <div className="font-nunito font-black text-lg text-gray-800">{store.activeCharacter.name}</div>
                        <div className="font-nunito text-sm text-gray-400">Активный персонаж</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: 'Поцеловать 💋', action: () => { store.updateHappiness(store.activeCharacter!.id, 8); setOverlayVisible(true); } },
                        { label: 'Погладить 🤚', action: () => { store.updateHappiness(store.activeCharacter!.id, 5); setOverlayVisible(true); } },
                        { label: 'Поговорить 💬', action: () => setTab('chat') },
                        { label: 'На экран 👁️', action: () => setOverlayVisible(v => !v) },
                      ].map(btn => (
                        <button
                          key={btn.label}
                          onClick={btn.action}
                          className="py-2.5 px-2 rounded-2xl bg-purple-50 hover:bg-purple-100 font-nunito font-bold text-sm text-purple-700 transition-all hover:scale-105 text-center"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* CREATE TAB */}
        {tab === 'create' && (
          <div className="animate-slide-up">
            <div className="mb-6 flex items-center gap-3">
              <button onClick={() => setTab('home')} className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-purple-50 transition-all">
                <Icon name="ArrowLeft" size={18} className="text-gray-500" />
              </button>
              <h1 className="font-nunito font-black text-2xl text-gray-800">Новый персонаж</h1>
            </div>
            <div className="candy-card p-6 sm:p-8">
              <CharacterCreator onCreated={handleCreated} onCancel={() => setTab('home')} />
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {tab === 'chat' && (
          <div className="animate-slide-up">
            <div className="mb-6 flex items-center gap-3">
              <button onClick={() => setTab('home')} className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-purple-50 transition-all">
                <Icon name="ArrowLeft" size={18} className="text-gray-500" />
              </button>
              <h1 className="font-nunito font-black text-2xl text-gray-800">Чат</h1>
            </div>

            {!store.activeCharacter ? (
              <div className="text-center py-16 candy-card">
                <div className="text-5xl mb-4">💬</div>
                <p className="font-nunito font-bold text-gray-500">Выбери персонажа для чата</p>
                <button onClick={() => setTab('home')} className="mt-4 btn-candy px-6 py-2.5 text-sm">
                  Выбрать персонажа
                </button>
              </div>
            ) : (
              <div className="candy-card overflow-hidden" style={{ height: 580 }}>
                <ChatPanel
                  character={store.activeCharacter}
                  onSendMessage={store.addMessage}
                  embedded
                />
              </div>
            )}
          </div>
        )}

        {/* SPRITES TAB */}
        {tab === 'sprites' && (
          <div className="animate-slide-up">
            <div className="mb-6 flex items-center gap-3">
              <button onClick={() => setTab('home')} className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-purple-50 transition-all">
                <Icon name="ArrowLeft" size={18} className="text-gray-500" />
              </button>
              <h1 className="font-nunito font-black text-2xl text-gray-800">Библиотека спрайтов</h1>
            </div>

            {!store.activeCharacter ? (
              <div className="text-center py-16 candy-card">
                <div className="text-5xl mb-4">🎨</div>
                <p className="font-nunito font-bold text-gray-500">Выбери персонажа для загрузки спрайтов</p>
                <button onClick={() => setTab('home')} className="mt-4 btn-candy px-6 py-2.5 text-sm">
                  Выбрать персонажа
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {store.characters.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {store.characters.map(c => (
                      <button
                        key={c.id}
                        onClick={() => store.selectCharacter(c.id)}
                        className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full font-nunito font-bold text-sm transition-all ${
                          store.activeCharacterId === c.id ? 'text-white shadow-md' : 'bg-white text-gray-500 hover:bg-purple-50'
                        }`}
                        style={store.activeCharacterId === c.id ? { background: c.color } : {}}
                      >
                        <span>{c.emoji}</span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="candy-card p-5">
                  <SpriteLibrary character={store.activeCharacter} onUpload={store.updateSprite} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <div className="animate-slide-up space-y-5">
            <h1 className="font-nunito font-black text-2xl text-gray-800">Настройки</h1>

            {store.activeCharacter && (
              <div className="candy-card p-5 space-y-4">
                <h2 className="font-nunito font-black text-lg text-gray-700 flex items-center gap-2">
                  <span>{store.activeCharacter.emoji}</span>
                  {store.activeCharacter.name}
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                    <div>
                      <div className="font-nunito font-bold text-sm text-gray-700">Показывать поверх всего</div>
                      <div className="font-nunito text-xs text-gray-400">Персонаж всегда виден на экране</div>
                    </div>
                    <button
                      onClick={() => setOverlayVisible(v => !v)}
                      className={`w-12 h-6 rounded-full transition-all relative ${overlayVisible ? 'bg-purple-500' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${overlayVisible ? 'left-6' : 'left-0.5'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                    <div>
                      <div className="font-nunito font-bold text-sm text-gray-700">Настроение</div>
                      <div className="font-nunito text-xs text-gray-400">Уровень счастья персонажа</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => store.updateHappiness(store.activeCharacter!.id, -10)}
                        className="w-7 h-7 rounded-lg bg-white shadow-sm hover:bg-red-50 font-bold text-gray-500 transition-all"
                      >−</button>
                      <span className="font-nunito font-black text-purple-700 w-10 text-center">
                        {store.activeCharacter.happiness}%
                      </span>
                      <button
                        onClick={() => store.updateHappiness(store.activeCharacter!.id, 10)}
                        className="w-7 h-7 rounded-lg bg-white shadow-sm hover:bg-green-50 font-bold text-gray-500 transition-all"
                      >+</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="candy-card p-5 space-y-3">
              <h2 className="font-nunito font-black text-lg text-gray-700">О приложении</h2>
              <div className="space-y-2 text-sm font-nunito text-gray-500">
                <div className="flex justify-between p-2.5 bg-gray-50 rounded-xl">
                  <span className="font-semibold">Версия</span><span>1.0.0</span>
                </div>
                <div className="flex justify-between p-2.5 bg-gray-50 rounded-xl">
                  <span className="font-semibold">Персонажей</span><span>{store.characters.length}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-gray-50 rounded-xl">
                  <span className="font-semibold">Поддержка спрайтов</span><span>PNG, GIF, JPEG, WebP</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
              <div className="flex gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <div className="font-nunito font-black text-amber-800 text-sm">Разрешение «Поверх других окон»</div>
                  <div className="font-nunito text-xs text-amber-700 mt-1 leading-relaxed">
                    В браузерной версии персонаж работает поверх только этого сайта.
                    Для размещения поверх любых приложений потребуется нативная версия с разрешением overlay.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <div className="nav-pill flex items-center justify-around px-2 py-2">
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all font-nunito font-bold text-xs ${
                  tab === item.key ? 'text-white' : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50'
                }`}
                style={tab === item.key ? { background: 'linear-gradient(135deg, #A855F7, #EC4899)' } : {}}
              >
                <Icon name={item.icon} size={20} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Overlay character */}
      {overlayVisible && store.activeCharacter && (
        <OverlayCharacter
          character={store.activeCharacter}
          onChat={() => setTab('chat')}
          onAction={handleOverlayAction}
          onClose={() => setOverlayVisible(false)}
        />
      )}
    </div>
  );
}
