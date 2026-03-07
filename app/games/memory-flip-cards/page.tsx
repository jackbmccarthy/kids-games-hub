'use client';

import { useState, useEffect, useCallback } from 'react';

type AnimalType = 'cat' | 'dog' | 'rabbit' | 'bear' | 'owl' | 'frog';

interface Card {
  id: number;
  animal: AnimalType;
  isFlipped: boolean;
  isMatched: boolean;
}

type GamePhase = 'menu' | 'playing' | 'won';

const ANIMALS: { id: AnimalType; emoji: string; sound: string }[] = [
  { id: 'cat', emoji: '🐱', sound: 'Meow' },
  { id: 'dog', emoji: '🐕', sound: 'Woof' },
  { id: 'rabbit', emoji: '🐰', sound: 'Hop' },
  { id: 'bear', emoji: '🐻', sound: 'Growl' },
  { id: 'owl', emoji: '🦉', sound: 'Hoot' },
  { id: 'frog', emoji: '🐸', sound: 'Ribbit' },
];

const GRID_SIZES = [
  { name: 'Easy', cols: 2, rows: 2, pairs: 2 },
  { name: 'Medium', cols: 3, rows: 4, pairs: 6 },
  { name: 'Hard', cols: 4, rows: 4, pairs: 8 },
];

export default function MemoryFlipCards() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gridSize, setGridSize] = useState(GRID_SIZES[1]);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Initialize game
  const initializeGame = useCallback(() => {
    const animalCount = gridSize.pairs;
    const selectedAnimals = ANIMALS.slice(0, animalCount);
    
    // Create pairs
    const cardPairs: Card[] = [];
    selectedAnimals.forEach((animal, index) => {
      cardPairs.push(
        { id: index * 2, animal: animal.id, isFlipped: false, isMatched: false },
        { id: index * 2 + 1, animal: animal.id, isFlipped: false, isMatched: false }
      );
    });
    
    // Shuffle
    const shuffled = cardPairs.sort(() => Math.random() - 0.5);
    
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGamePhase('playing');
  }, [gridSize]);
  
  // Play sound
  const playSound = useCallback((type: 'flip' | 'match' | 'win') => {
    if (!soundEnabled) return;
    
    try {
      const ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'flip') {
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.type = 'sine';
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
      } else if (type === 'match') {
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        oscillator.type = 'sine';
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
      } else if (type === 'win') {
        const notes = [523.25, 587.33, 659.25, 698.46, 783.99];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.connect(g);
          g.connect(ctx.destination);
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
          g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + i * 0.15 + 0.3);
        });
      }
    } catch {}
  }, [soundEnabled]);
  
  // Handle card flip
  const handleCardClick = useCallback((cardId: number) => {
    if (flippedCards.length >= 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;
    
    playSound('flip');
    
    // Flip card
    const newCards = cards.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);
    
    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);
    
    // Check for match
    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      
      const [first, second] = newFlipped;
      const firstCard = newCards.find(c => c.id === first);
      const secondCard = newCards.find(c => c.id === second);
      
      if (firstCard && secondCard && firstCard.animal === secondCard.animal) {
        // Match!
        setTimeout(() => {
          playSound('match');
          const matchedCards = newCards.map(c =>
            c.id === first || c.id === second ? { ...c, isMatched: true } : c
          );
          setCards(matchedCards);
          setMatches(prev => {
            const newMatches = prev + 1;
            if (newMatches === gridSize.pairs) {
              // Won!
              playSound('win');
              setBestScore(current => {
                if (current === null || moves + 1 < current) {
                  return moves + 1;
                }
                return current;
              });
              setTimeout(() => setGamePhase('won'), 500);
            }
            return newMatches;
          });
          setFlippedCards([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = newCards.map(c =>
            c.id === first || c.id === second ? { ...c, isFlipped: false } : c
          );
          setCards(resetCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [cards, flippedCards, gridSize.pairs, moves, playSound]);
  
  // Get animal emoji
  const getAnimalEmoji = (animalId: AnimalType) => {
    return ANIMALS.find(a => a.id === animalId)?.emoji || '❓';
  };
  
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-400 via-pink-400 to-red-400">
      {/* Sound toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 z-20 bg-white/80 hover:bg-white text-gray-700 p-3 rounded-full text-xl shadow-lg"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      
      {/* Menu */}
      {gamePhase === 'menu' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-8xl mb-4">🃏</div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Memory Cards
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Find all the matching pairs!
            </p>
            
            {/* Grid size selection */}
            <div className="space-y-3 mb-6">
              {GRID_SIZES.map(size => (
                <button
                  key={size.name}
                  onClick={() => setGridSize(size)}
                  className={`w-full py-3 px-6 rounded-xl font-bold text-lg transition-all ${
                    gridSize.name === size.name
                      ? 'bg-white text-purple-600 shadow-lg'
                      : 'bg-white/30 text-white hover:bg-white/40'
                  }`}
                >
                  {size.name} ({size.cols}x{size.rows})
                </button>
              ))}
            </div>
            
            {bestScore && (
              <p className="text-white/80 mb-4">Best: {bestScore} moves</p>
            )}
            
            <button
              onClick={initializeGame}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Game! 🎮
            </button>
          </div>
        </div>
      )}
      
      {/* Game */}
      {gamePhase === 'playing' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center p-4 pt-16">
          {/* HUD */}
          <div className="w-full max-w-md flex justify-between items-center mb-4">
            <div className="bg-white/80 rounded-xl px-4 py-2 shadow">
              <span className="text-lg font-bold text-gray-700">Moves: {moves}</span>
            </div>
            <div className="bg-white/80 rounded-xl px-4 py-2 shadow">
              <span className="text-lg font-bold text-purple-600">
                Matches: {matches}/{gridSize.pairs}
              </span>
            </div>
          </div>
          
          {/* Cards grid */}
          <div
            className="grid gap-3 w-full max-w-md"
            style={{
              gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
            }}
          >
            {cards.map(card => (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.isMatched}
                className={`aspect-square rounded-xl shadow-lg transform transition-all duration-300 ${
                  card.isMatched
                    ? 'bg-green-400 scale-95 opacity-50'
                    : card.isFlipped
                    ? 'bg-white scale-100'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:scale-105'
                }`}
                style={{
                  transform: card.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {card.isFlipped || card.isMatched ? (
                  <div className="text-5xl">{getAnimalEmoji(card.animal)}</div>
                ) : (
                  <div className="text-4xl text-white/80">?</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Win screen */}
      {gamePhase === 'won' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-5xl font-bold text-white mb-4">You Won!</h2>
            <p className="text-3xl text-yellow-400 mb-2">{moves} moves</p>
            {bestScore === moves && (
              <p className="text-xl text-green-300 mb-4">🏆 New Best Score!</p>
            )}
            <div className="space-y-3">
              <button
                onClick={initializeGame}
                className="block w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg"
              >
                Play Again
              </button>
              <button
                onClick={() => setGamePhase('menu')}
                className="block w-full bg-gray-500 hover:bg-gray-600 text-white text-xl font-bold py-3 px-8 rounded-full"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Back button */}
      {gamePhase !== 'menu' && (
        <button
          onClick={() => setGamePhase('menu')}
          className="absolute top-4 left-4 z-20 bg-white/80 hover:bg-white text-gray-700 p-3 rounded-full shadow-lg"
        >
          ←
        </button>
      )}
    </main>
  );
}
