'use client';

import { useState, useCallback, useEffect } from 'react';

type PatternItem = string;

type GamePhase = 'menu' | 'playing' | 'correct' | 'wrong' | 'levelComplete';

const PATTERN_TYPES = {
  AB: { length: 4, name: 'AB' },
  AAB: { length: 5, name: 'AAB' },
  ABC: { length: 6, name: 'ABC' },
  AABB: { length: 6, name: 'AABB' },
};

const ITEM_SETS = {
  fruits: ['🍎', '🍌', '🍊', '🍇', '🍓', '🥝'],
  shapes: ['⭐', '❤️', '🔵', '🟢', '🟡', '🟣'],
  animals: ['🐱', '🐶', '🐰', '🐻', '🦊', '🐸'],
  colors: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣'],
};

interface PatternRound {
  pattern: PatternItem[];
  missingIndex: number;
  correctAnswer: PatternItem;
  choices: PatternItem[];
}

export default function PatternComplete() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [currentRound, setCurrentRound] = useState<PatternRound | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<PatternItem | null>(null);
  const [category, setCategory] = useState<keyof typeof ITEM_SETS>('fruits');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Audio
  const playSound = useCallback((type: 'correct' | 'wrong' | 'win') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'correct') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'wrong') {
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'win') {
        const notes = [523.25, 587.33, 659.25, 698.46, 783.99];
        notes.forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
          g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.2);
          o.start(ctx.currentTime + i * 0.12);
          o.stop(ctx.currentTime + i * 0.12 + 0.2);
        });
      }
    } catch {}
  }, [soundEnabled]);
  
  // Generate pattern
  const generatePattern = useCallback(() => {
    const items = ITEM_SETS[category];
    const patternTypes = Object.keys(PATTERN_TYPES) as Array<keyof typeof PATTERN_TYPES>;
    const patternType = patternTypes[Math.floor(Math.random() * patternTypes.length)];
    
    // Select items for pattern
    const selectedItems = items.slice(0, 2 + Math.floor(Math.random() * 2));
    
    // Build pattern based on type
    let pattern: PatternItem[] = [];
    switch (patternType) {
      case 'AB':
        pattern = [selectedItems[0], selectedItems[1], selectedItems[0], selectedItems[1]];
        break;
      case 'AAB':
        pattern = [selectedItems[0], selectedItems[0], selectedItems[1], selectedItems[0], selectedItems[0]];
        break;
      case 'ABC':
        pattern = [selectedItems[0], selectedItems[1], selectedItems[2], selectedItems[0], selectedItems[1], selectedItems[2]];
        break;
      case 'AABB':
        pattern = [selectedItems[0], selectedItems[0], selectedItems[1], selectedItems[1], selectedItems[0], selectedItems[0]];
        break;
    }
    
    // Remove one item
    const missingIndex = Math.floor(Math.random() * pattern.length);
    const correctAnswer = pattern[missingIndex];
    pattern[missingIndex] = '?';
    
    // Generate choices
    const choices = [correctAnswer];
    while (choices.length < 3) {
      const choice = items[Math.floor(Math.random() * items.length)];
      if (!choices.includes(choice)) {
        choices.push(choice);
      }
    }
    
    // Shuffle choices
    choices.sort(() => Math.random() - 0.5);
    
    setCurrentRound({ pattern, missingIndex, correctAnswer, choices });
    setSelectedChoice(null);
  }, [category]);
  
  // Handle choice
  const handleChoice = useCallback((choice: PatternItem) => {
    if (!currentRound) return;
    
    setSelectedChoice(choice);
    
    if (choice === currentRound.correctAnswer) {
      playSound('correct');
      setScore(prev => prev + 10);
      setCorrectCount(prev => prev + 1);
      setGamePhase('correct');
      
      setTimeout(() => {
        if (round >= 10) {
          playSound('win');
          setGamePhase('levelComplete');
        } else {
          setRound(prev => prev + 1);
          generatePattern();
          setGamePhase('playing');
        }
      }, 1200);
    } else {
      playSound('wrong');
      setGamePhase('wrong');
      
      setTimeout(() => {
        setRound(prev => prev + 1);
        generatePattern();
        setGamePhase('playing');
      }, 1500);
    }
  }, [currentRound, round, playSound, generatePattern]);
  
  // Start game
  const startGame = useCallback(() => {
    setRound(1);
    setScore(0);
    setCorrectCount(0);
    generatePattern();
    setGamePhase('playing');
  }, [generatePattern]);
  
  // Generate pattern on category change
  useEffect(() => {
    if (gamePhase === 'playing') {
      generatePattern();
    }
  }, [category]);
  
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400">
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
            <div className="text-8xl mb-4 animate-bounce">🧩</div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Complete the Pattern
            </h1>
            <p className="text-xl text-white/90 mb-6">
              Find what comes next in the pattern!
            </p>
            
            {/* Category selection */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {Object.keys(ITEM_SETS).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat as keyof typeof ITEM_SETS)}
                  className={`py-2 px-4 rounded-lg font-bold capitalize transition-all ${
                    category === cat
                      ? 'bg-white text-purple-600 shadow-lg'
                      : 'bg-white/30 text-white hover:bg-white/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Game! 🎯
            </button>
          </div>
        </div>
      )}
      
      {/* Game */}
      {gamePhase === 'playing' && currentRound && (
        <div className="absolute inset-0 z-10 flex flex-col items-center p-4 pt-20">
          {/* HUD */}
          <div className="w-full max-w-md flex justify-between items-center mb-8">
            <div className="bg-white/80 rounded-xl px-4 py-2 shadow">
              <span className="text-lg font-bold text-gray-700">Round {round}/10</span>
            </div>
            <div className="bg-white/80 rounded-xl px-4 py-2 shadow">
              <span className="text-lg font-bold text-purple-600">⭐ {score}</span>
            </div>
          </div>
          
          {/* Pattern display */}
          <div className="bg-white/90 rounded-3xl p-8 shadow-xl mb-8">
            <div className="flex gap-3 flex-wrap justify-center">
              {currentRound.pattern.map((item, index) => (
                <div
                  key={index}
                  className={`w-16 h-16 rounded-xl flex items-center justify-center text-4xl ${
                    item === '?'
                      ? 'bg-purple-200 border-4 border-purple-400 border-dashed animate-pulse'
                      : 'bg-white shadow-md'
                  }`}
                >
                  {item === '?' ? '?' : item}
                </div>
              ))}
            </div>
          </div>
          
          {/* Choices */}
          <div className="mb-4">
            <p className="text-white text-center font-semibold mb-3">What&apos;s missing?</p>
            <div className="flex gap-4">
              {currentRound.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleChoice(choice)}
                  disabled={selectedChoice !== null}
                  className={`w-20 h-20 rounded-xl bg-white shadow-lg text-4xl flex items-center justify-center transform hover:scale-110 transition-all ${
                    selectedChoice === choice
                      ? 'ring-4 ring-purple-400'
                      : ''
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Correct overlay */}
      {gamePhase === 'correct' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">✨</div>
            <h2 className="text-4xl font-bold text-white">Correct!</h2>
          </div>
        </div>
      )}
      
      {/* Wrong overlay */}
      {gamePhase === 'wrong' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4">🤔</div>
            <h2 className="text-3xl font-bold text-white">Try Again!</h2>
          </div>
        </div>
      )}
      
      {/* Level complete */}
      {gamePhase === 'levelComplete' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">🏆</div>
            <h2 className="text-5xl font-bold text-white mb-4">Great Job!</h2>
            <p className="text-3xl text-yellow-400 mb-2">Score: {score}</p>
            <p className="text-xl text-white/80 mb-6">
              {correctCount}/10 correct
            </p>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg"
            >
              Play Again
            </button>
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
