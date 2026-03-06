"use client";

import { useState, useEffect, useCallback } from "react";

type GamePhase = "menu" | "playing" | "complete";

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJI_SETS = {
  faces: ["😀", "😂", "🥰", "😎", "🤩", "😇", "🥳", "😴"],
  animals: ["🐶", "🐱", "🐼", "🦊", "🐰", "🐸", "🦁", "🐻"],
  food: ["🍕", "🍔", "🌮", "🍩", "🍦", "🍪", "🎂", "🍿"],
};

export default function EmojiMatchPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [category, setCategory] = useState<keyof typeof EMOJI_SETS>("faces");
  const [gridSize, setGridSize] = useState(4);

  const initializeGame = useCallback(() => {
    const emojis = EMOJI_SETS[category];
    const pairsNeeded = (gridSize * gridSize) / 2;
    const selectedEmojis = emojis.slice(0, pairsNeeded);
    const cardEmojis = [...selectedEmojis, ...selectedEmojis];
    
    // Shuffle
    for (let i = cardEmojis.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardEmojis[i], cardEmojis[j]] = [cardEmojis[j], cardEmojis[i]];
    }

    setCards(cardEmojis.map((emoji, i) => ({
      id: i,
      emoji,
      isFlipped: false,
      isMatched: false,
    })));
    setFlippedCards([]);
    setMoves(0);
  }, [category, gridSize]);

  const handleCardClick = useCallback((cardId: number) => {
    if (flippedCards.length >= 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newCards = cards.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      
      const [first, second] = newFlipped;
      const firstCard = newCards.find(c => c.id === first);
      const secondCard = newCards.find(c => c.id === second);

      if (firstCard?.emoji === secondCard?.emoji) {
        // Match!
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === first || c.id === second 
              ? { ...c, isMatched: true, isFlipped: false }
              : c
          ));
          setFlippedCards([]);
          
          // Check win
          if (newCards.every(c => c.isMatched || c.id === first || c.id === second)) {
            setTimeout(() => setPhase("complete"), 500);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === first || c.id === second 
              ? { ...c, isFlipped: false }
              : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [cards, flippedCards]);

  useEffect(() => {
    if (phase === "playing") {
      initializeGame();
    }
  }, [phase, initializeGame]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-400 flex flex-col items-center justify-center p-4">
      {phase === "playing" && (
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-white drop-shadow-lg">Emoji Match</h2>
          <p className="text-white/80">Moves: {moves}</p>
        </div>
      )}

      {phase === "playing" && (
        <div 
          className="grid gap-2 bg-white/20 p-4 rounded-2xl backdrop-blur-sm"
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          }}
        >
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isFlipped || card.isMatched}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl text-3xl sm:text-4xl transition-all duration-300 transform ${
                card.isMatched 
                  ? "bg-green-400 scale-95 opacity-50" 
                  : card.isFlipped 
                    ? "bg-white scale-105" 
                    : "bg-gradient-to-br from-purple-500 to-pink-500 hover:scale-105"
              }`}
            >
              {card.isFlipped || card.isMatched ? card.emoji : "❓"}
            </button>
          ))}
        </div>
      )}

      {phase === "menu" && (
        <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md w-full">
          <h1 className="text-4xl font-black text-purple-600 mb-2">🎴 Emoji Match</h1>
          <p className="text-gray-600 mb-6">Find all the matching pairs!</p>
          
          <div className="space-y-4 mb-6">
            <div>
              <p className="font-bold text-gray-700 mb-2">Category:</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {Object.keys(EMOJI_SETS).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat as keyof typeof EMOJI_SETS)}
                    className={`px-4 py-2 rounded-lg font-bold capitalize ${
                      category === cat ? "bg-purple-500 text-white" : "bg-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <p className="font-bold text-gray-700 mb-2">Grid Size:</p>
              <div className="flex gap-2 justify-center">
                {[4, 6].map(size => (
                  <button
                    key={size}
                    onClick={() => setGridSize(size)}
                    className={`px-4 py-2 rounded-lg font-bold ${
                      gridSize === size ? "bg-purple-500 text-white" : "bg-gray-200"
                    }`}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setPhase("playing")}
            className="w-full px-6 py-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl text-xl"
          >
            ▶️ Play
          </button>
        </div>
      )}

      {phase === "complete" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center">
            <h2 className="text-3xl font-black text-green-500 mb-2">🎉 You Win!</h2>
            <p className="text-xl text-gray-700 mb-4">Completed in {moves} moves!</p>
            <div className="space-y-2">
              <button
                onClick={() => setPhase("playing")}
                className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-xl"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-400 text-white font-bold rounded-xl"
              >
                🏠 Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
