'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type AnimalType = 'cow' | 'pig' | 'chicken' | 'duck' | 'dog' | 'cat' | 'sheep' | 'horse';

interface Animal {
  id: AnimalType;
  name: string;
  sound: string;
  emoji: string;
  soundFile?: string;
}

type GamePhase = 'menu' | 'playing' | 'correct' | 'wrong' | 'levelComplete';

const ANIMALS: Animal[] = [
  { id: 'cow', name: 'Cow', sound: 'Moo', emoji: '🐄' },
  { id: 'pig', name: 'Pig', sound: 'Oink', emoji: '🐷' },
  { id: 'chicken', name: 'Chicken', sound: 'Cluck', emoji: '🐔' },
  { id: 'duck', name: 'Duck', sound: 'Quack', emoji: '🦆' },
  { id: 'dog', name: 'Dog', sound: 'Woof', emoji: '🐕' },
  { id: 'cat', name: 'Cat', sound: 'Meow', emoji: '🐱' },
  { id: 'sheep', name: 'Sheep', sound: 'Baa', emoji: '🐑' },
  { id: 'horse', name: 'Horse', sound: 'Neigh', emoji: '🐴' },
];

const ANIMAL_SETS = {
  farm: ['cow', 'pig', 'chicken', 'duck', 'sheep', 'horse', 'dog', 'cat'],
  pets: ['dog', 'cat'],
};

export default function AnimalSoundMatch() {
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [currentAnimal, setCurrentAnimal] = useState<Animal | null>(null);
  const [choices, setChoices] = useState<Animal[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalType | null>(null);
  
  // Audio synthesis for animal sounds
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playAnimalSound = useCallback((animal: Animal) => {
    if (!soundEnabled) return;
    
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      // Different sound patterns for each animal
      const patterns: Record<AnimalType, { freq: number; duration: number; type: OscillatorType }> = {
        cow: { freq: 150, duration: 0.8, type: 'sawtooth' },
        pig: { freq: 300, duration: 0.3, type: 'square' },
        chicken: { freq: 600, duration: 0.15, type: 'square' },
        duck: { freq: 400, duration: 0.25, type: 'triangle' },
        dog: { freq: 200, duration: 0.2, type: 'sawtooth' },
        cat: { freq: 500, duration: 0.5, type: 'sine' },
        sheep: { freq: 350, duration: 0.4, type: 'triangle' },
        horse: { freq: 180, duration: 0.6, type: 'sawtooth' },
      };
      
      const pattern = patterns[animal.id];
      
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(pattern.freq, ctx.currentTime);
      oscillator.type = pattern.type;
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + pattern.duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + pattern.duration);
    } catch {}
  }, [soundEnabled, initAudio]);

  const playSuccessSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.2);
      });
    } catch {}
  }, [soundEnabled, initAudio]);

  const playWrongSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, [soundEnabled, initAudio]);

  // Start new round
  const startRound = useCallback(() => {
    const availableAnimals = ANIMALS.slice(0, 4); // Use first 4 animals for simplicity
    const correctAnimal = availableAnimals[Math.floor(Math.random() * availableAnimals.length)];
    
    // Get 3 random wrong animals
    const wrongAnimals = availableAnimals
      .filter(a => a.id !== correctAnimal.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    // Shuffle all choices
    const allChoices = [correctAnimal, ...wrongAnimals].sort(() => Math.random() - 0.5);
    
    setCurrentAnimal(correctAnimal);
    setChoices(allChoices);
    setSelectedAnimal(null);
    setGamePhase('playing');
    
    // Play sound after a brief delay
    setTimeout(() => playAnimalSound(correctAnimal), 500);
  }, [playAnimalSound]);

  // Handle animal selection
  const handleSelect = useCallback((animal: Animal) => {
    if (!currentAnimal) return;
    
    setSelectedAnimal(animal.id);
    
    if (animal.id === currentAnimal.id) {
      setScore(prev => prev + 10 + streak * 2);
      setStreak(prev => prev + 1);
      setCorrectAnswers(prev => prev + 1);
      playSuccessSound();
      setGamePhase('correct');
      
      setTimeout(() => {
        if (round >= 9) {
          setGamePhase('levelComplete');
        } else {
          setRound(prev => prev + 1);
          startRound();
        }
      }, 1500);
    } else {
      setStreak(0);
      playWrongSound();
      setGamePhase('wrong');
      
      setTimeout(() => {
        setRound(prev => prev + 1);
        startRound();
      }, 2000);
    }
  }, [currentAnimal, streak, round, playSuccessSound, playWrongSound, startRound]);

  // Start game
  const startGame = useCallback(() => {
    setScore(0);
    setStreak(0);
    setRound(1);
    setCorrectAnswers(0);
    startRound();
  }, [startRound]);

  // Replay sound
  const replaySound = useCallback(() => {
    if (currentAnimal) {
      playAnimalSound(currentAnimal);
    }
  }, [currentAnimal, playAnimalSound]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-green-200 via-green-300 to-green-400">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-6xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          >
            🌿
          </div>
        ))}
      </div>
      
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
            <div className="text-8xl mb-4 animate-bounce">🐄🐷🐔</div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Animal Sound Match
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Listen to the animal sound and tap the right animal!
            </p>
            
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Game! 🎵
            </button>
          </div>
        </div>
      )}
      
      {/* Game */}
      {gamePhase === 'playing' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center p-4">
          {/* HUD */}
          <div className="w-full max-w-md flex justify-between items-center mb-8 mt-4">
            <div className="bg-white/80 rounded-xl px-4 py-2 shadow">
              <span className="text-lg font-bold text-gray-700">Round {round}/10</span>
            </div>
            <div className="bg-white/80 rounded-xl px-4 py-2 shadow">
              <span className="text-lg font-bold text-yellow-600">⭐ {score}</span>
            </div>
            {streak >= 3 && (
              <div className="bg-orange-500 rounded-xl px-4 py-2 shadow">
                <span className="text-lg font-bold text-white">🔥 {streak}</span>
              </div>
            )}
          </div>
          
          {/* Sound button */}
          <div className="mb-8">
            <button
              onClick={replaySound}
              className="bg-white/90 hover:bg-white text-gray-700 p-6 rounded-full shadow-xl text-4xl animate-pulse"
            >
              🔊
            </button>
            <p className="text-center text-white font-semibold mt-2 text-lg drop-shadow">
              Tap to hear the sound again!
            </p>
          </div>
          
          {/* Animal choices */}
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {choices.map(animal => (
              <button
                key={animal.id}
                onClick={() => handleSelect(animal)}
                className={`bg-white/90 hover:bg-white p-6 rounded-2xl shadow-xl transform hover:scale-105 transition-all ${
                  selectedAnimal === animal.id ? 'ring-4 ring-yellow-400' : ''
                }`}
              >
                <div className="text-6xl mb-2">{animal.emoji}</div>
                <div className="text-lg font-bold text-gray-700">{animal.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Correct overlay */}
      {gamePhase === 'correct' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-4xl font-bold text-white mb-2">Correct!</h2>
            <p className="text-2xl text-white/90">
              {currentAnimal?.emoji} {currentAnimal?.name} says &quot;{currentAnimal?.sound}&quot;!
            </p>
          </div>
        </div>
      )}
      
      {/* Wrong overlay */}
      {gamePhase === 'wrong' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4">🤔</div>
            <h2 className="text-3xl font-bold text-white mb-2">Try Again!</h2>
            <p className="text-xl text-white/90">
              That was {currentAnimal?.emoji} {currentAnimal?.name}!
            </p>
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
              {correctAnswers}/10 correct
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
