"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type GamePhase = "menu" | "playing" | "result";

interface SoundItem {
  id: string;
  name: string;
  emoji: string;
  category: "animal" | "vehicle" | "instrument" | "nature";
  frequency: number;
  pattern: "steady" | "burst" | "wave" | "pulse";
}

const SOUNDS: SoundItem[] = [
  // Animals
  { id: "dog", name: "Dog", emoji: "🐕", category: "animal", frequency: 400, pattern: "burst" },
  { id: "cat", name: "Cat", emoji: "🐱", category: "animal", frequency: 600, pattern: "wave" },
  { id: "cow", name: "Cow", emoji: "🐄", category: "animal", frequency: 150, pattern: "steady" },
  { id: "pig", name: "Pig", emoji: "🐷", category: "animal", frequency: 300, pattern: "burst" },
  { id: "chicken", name: "Chicken", emoji: "🐔", category: "animal", frequency: 800, pattern: "burst" },
  { id: "duck", name: "Duck", emoji: "🦆", category: "animal", frequency: 500, pattern: "wave" },
  { id: "sheep", name: "Sheep", emoji: "🐑", category: "animal", frequency: 350, pattern: "steady" },
  { id: "horse", name: "Horse", emoji: "🐴", category: "animal", frequency: 200, pattern: "pulse" },
  { id: "frog", name: "Frog", emoji: "🐸", category: "animal", frequency: 250, pattern: "burst" },
  { id: "bird", name: "Bird", emoji: "🐦", category: "animal", frequency: 1200, pattern: "wave" },
  { id: "elephant", name: "Elephant", emoji: "🐘", category: "animal", frequency: 100, pattern: "pulse" },
  { id: "lion", name: "Lion", emoji: "🦁", category: "animal", frequency: 180, pattern: "burst" },
  
  // Vehicles
  { id: "car", name: "Car", emoji: "🚗", category: "vehicle", frequency: 200, pattern: "steady" },
  { id: "train", name: "Train", emoji: "🚂", category: "vehicle", frequency: 150, pattern: "pulse" },
  { id: "airplane", name: "Airplane", emoji: "✈️", category: "vehicle", frequency: 100, pattern: "steady" },
  { id: "boat", name: "Boat", emoji: "⛵", category: "vehicle", frequency: 80, pattern: "wave" },
  { id: "bus", name: "Bus", emoji: "🚌", category: "vehicle", frequency: 180, pattern: "steady" },
  { id: "motorcycle", name: "Motorcycle", emoji: "🏍️", category: "vehicle", frequency: 300, pattern: "burst" },
  { id: "helicopter", name: "Helicopter", emoji: "🚁", category: "vehicle", frequency: 120, pattern: "pulse" },
  { id: "firetruck", name: "Fire Truck", emoji: "🚒", category: "vehicle", frequency: 700, pattern: "wave" },
  
  // Instruments
  { id: "piano", name: "Piano", emoji: "🎹", category: "instrument", frequency: 440, pattern: "burst" },
  { id: "guitar", name: "Guitar", emoji: "🎸", category: "instrument", frequency: 330, pattern: "steady" },
  { id: "drums", name: "Drums", emoji: "🥁", category: "instrument", frequency: 100, pattern: "pulse" },
  { id: "trumpet", name: "Trumpet", emoji: "🎺", category: "instrument", frequency: 523, pattern: "burst" },
  { id: "violin", name: "Violin", emoji: "🎻", category: "instrument", frequency: 660, pattern: "wave" },
  { id: "flute", name: "Flute", emoji: "🪈", category: "instrument", frequency: 880, pattern: "wave" },
  { id: "bell", name: "Bell", emoji: "🔔", category: "instrument", frequency: 1000, pattern: "burst" },
  
  // Nature
  { id: "rain", name: "Rain", emoji: "🌧️", category: "nature", frequency: 200, pattern: "steady" },
  { id: "thunder", name: "Thunder", emoji: "⛈️", category: "nature", frequency: 50, pattern: "pulse" },
  { id: "wind", name: "Wind", emoji: "💨", category: "nature", frequency: 150, pattern: "wave" },
  { id: "ocean", name: "Ocean", emoji: "🌊", category: "nature", frequency: 100, pattern: "wave" },
  { id: "fire", name: "Fire", emoji: "🔥", category: "nature", frequency: 300, pattern: "burst" },
  { id: "stream", name: "Stream", emoji: "🏞️", category: "nature", frequency: 400, pattern: "steady" },
];

const CATEGORY_COLORS = {
  animal: { bg: "bg-green-100", border: "border-green-400", text: "text-green-700" },
  vehicle: { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-700" },
  instrument: { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-700" },
  nature: { bg: "bg-yellow-100", border: "border-yellow-400", text: "text-yellow-700" },
};

export default function SoundMatchPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [currentSound, setCurrentSound] = useState<SoundItem | null>(null);
  const [options, setOptions] = useState<SoundItem[]>([]);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [streak, setStreak] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Get audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Stop any playing sound
  const stopSound = useCallback(() => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch {
        // Already stopped
      }
      oscillatorRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Play synthesized sound based on sound item
  const playSound = useCallback((sound: SoundItem) => {
    stopSound();
    
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillatorRef.current = oscillator;
    gainNodeRef.current = gainNode;

    // Set filter based on category
    filter.type = sound.category === "animal" ? "bandpass" : 
                  sound.category === "vehicle" ? "lowpass" :
                  sound.category === "instrument" ? "highpass" : "lowpass";
    filter.frequency.value = sound.frequency * 2;

    // Set oscillator type based on category
    oscillator.type = sound.category === "animal" ? "sawtooth" :
                      sound.category === "vehicle" ? "triangle" :
                      sound.category === "instrument" ? "sine" : "triangle";

    const now = ctx.currentTime;
    const duration = 1.5;
    const vol = volume;

    // Apply pattern
    switch (sound.pattern) {
      case "steady":
        oscillator.frequency.setValueAtTime(sound.frequency, now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(vol * 0.3, now + 0.1);
        gainNode.gain.setValueAtTime(vol * 0.3, now + duration - 0.1);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);
        break;
      
      case "burst":
        oscillator.frequency.setValueAtTime(sound.frequency, now);
        for (let i = 0; i < 3; i++) {
          const t = now + i * 0.4;
          gainNode.gain.setValueAtTime(0, t);
          gainNode.gain.linearRampToValueAtTime(vol * 0.4, t + 0.05);
          gainNode.gain.linearRampToValueAtTime(0, t + 0.2);
        }
        break;
      
      case "wave":
        oscillator.frequency.setValueAtTime(sound.frequency * 0.8, now);
        oscillator.frequency.linearRampToValueAtTime(sound.frequency * 1.2, now + 0.5);
        oscillator.frequency.linearRampToValueAtTime(sound.frequency * 0.8, now + 1);
        oscillator.frequency.linearRampToValueAtTime(sound.frequency * 1.2, now + 1.5);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(vol * 0.25, now + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);
        break;
      
      case "pulse":
        oscillator.frequency.setValueAtTime(sound.frequency, now);
        for (let i = 0; i < 6; i++) {
          const t = now + i * 0.25;
          gainNode.gain.setValueAtTime(0, t);
          gainNode.gain.linearRampToValueAtTime(vol * 0.35, t + 0.05);
          gainNode.gain.linearRampToValueAtTime(0, t + 0.15);
        }
        break;
    }

    // Add vibrato for animals
    if (sound.category === "animal") {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);
      lfo.frequency.value = 5;
      lfoGain.gain.value = sound.frequency * 0.1;
      lfo.start(now);
      lfo.stop(now + duration);
    }

    oscillator.start(now);
    oscillator.stop(now + duration);
    
    setIsPlaying(true);
    oscillator.onended = () => setIsPlaying(false);
  }, [volume, stopSound, getAudioContext]);

  // Shuffle array helper
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Start new round
  const startRound = useCallback(() => {
    const availableSounds = shuffleArray(SOUNDS);
    const correctSound = availableSounds[0];
    
    // Get 3 wrong options from different items
    const wrongOptions = availableSounds
      .filter(s => s.id !== correctSound.id)
      .slice(0, 3);
    
    const allOptions = shuffleArray([correctSound, ...wrongOptions]);
    
    setCurrentSound(correctSound);
    setOptions(allOptions);
    setResult(null);
    setPhase("playing");
    
    // Play the sound after a short delay
    setTimeout(() => playSound(correctSound), 500);
  }, [playSound]);

  // Start game
  const startGame = useCallback(() => {
    setScore(0);
    setRound(1);
    setStreak(0);
    startRound();
  }, [startRound]);

  // Handle answer
  const handleAnswer = useCallback((selected: SoundItem) => {
    if (!currentSound || result) return;

    if (selected.id === currentSound.id) {
      // Correct!
      const points = 10 + streak * 5;
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      setResult("correct");
      setPhase("result");
      
      // Auto advance after delay
      setTimeout(() => {
        setRound(prev => prev + 1);
        startRound();
      }, 1500);
    } else {
      // Wrong
      setStreak(0);
      setResult("wrong");
      
      // Allow retry after delay
      setTimeout(() => {
        setResult(null);
        playSound(currentSound);
      }, 1000);
    }
  }, [currentSound, result, streak, startRound, playSound]);

  // Play again button
  const handlePlayAgain = useCallback(() => {
    playSound(currentSound!);
  }, [currentSound, playSound]);

  // Update volume in real-time
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume * 0.4;
    }
  }, [volume]);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("sound-match-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("sound-match-high-score", String(score));
    }
  }, [score, highScore]);

  // Cleanup
  useEffect(() => {
    return () => stopSound();
  }, [stopSound]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#E8F5E9] to-[#E3F2FD] p-4">
      {/* Header */}
      <header className="max-w-2xl mx-auto text-center mb-4">
        <h1 className="text-3xl md:text-4xl font-black text-[#2C3E50] mb-2">
          🔊 Sound Match 🔊
        </h1>
        {phase === "playing" && (
          <div className="flex justify-center gap-6 text-lg font-bold">
            <span className="text-[#4CAF50]">Score: {score}</span>
            <span className="text-[#2196F3]">Round: {round}</span>
            {streak > 1 && (
              <span className="text-[#FF9800]">🔥 Streak: {streak}</span>
            )}
          </div>
        )}
      </header>

      {/* Volume Control - Always visible */}
      <div className="max-w-2xl mx-auto mb-4">
        <div className="flex items-center justify-center gap-3 bg-white/80 rounded-xl p-3">
          <span className="text-2xl">🔈</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-40 h-3 rounded-lg appearance-none cursor-pointer accent-[#4CAF50]"
          />
          <span className="text-2xl">🔊</span>
          <span className="text-sm font-bold text-gray-600 ml-2">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Menu */}
      {phase === "menu" && (
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-xl text-center">
          <p className="text-gray-600 mb-4">Listen to the sound and tap the matching picture!</p>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-green-100 rounded-xl p-3">
              <span className="text-3xl">🐕</span>
              <p className="text-sm font-bold text-green-700">Animals</p>
            </div>
            <div className="bg-blue-100 rounded-xl p-3">
              <span className="text-3xl">🚗</span>
              <p className="text-sm font-bold text-blue-700">Vehicles</p>
            </div>
            <div className="bg-purple-100 rounded-xl p-3">
              <span className="text-3xl">🎹</span>
              <p className="text-sm font-bold text-purple-700">Instruments</p>
            </div>
            <div className="bg-yellow-100 rounded-xl p-3">
              <span className="text-3xl">🌧️</span>
              <p className="text-sm font-bold text-yellow-700">Nature</p>
            </div>
          </div>

          {highScore > 0 && (
            <p className="text-xl font-bold text-[#FFD700] mb-4">
              🏆 High Score: {highScore}
            </p>
          )}

          <button
            onClick={startGame}
            className="w-full px-6 py-4 bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold rounded-xl text-2xl transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            ▶️ Play!
          </button>
        </div>
      )}

      {/* Playing Phase */}
      {phase === "playing" && currentSound && (
        <div className="max-w-2xl mx-auto">
          {/* Sound Button */}
          <div className="text-center mb-6">
            <button
              onClick={handlePlayAgain}
              disabled={isPlaying}
              className={`w-32 h-32 rounded-full text-6xl shadow-xl transition-all ${
                isPlaying 
                  ? "bg-[#4CAF50] animate-pulse" 
                  : "bg-white hover:bg-gray-50 hover:scale-105 active:scale-95"
              }`}
            >
              {isPlaying ? "🔊" : "👂"}
            </button>
            <p className="mt-3 text-lg font-bold text-gray-600">
              {isPlaying ? "Listening..." : "Tap to hear the sound!"}
            </p>
          </div>

          {/* Result Overlay */}
          {result && (
            <div className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none ${
              result === "correct" ? "bg-green-500/20" : "bg-red-500/20"
            }`}>
              <div className={`text-9xl animate-bounce ${
                result === "correct" ? "text-green-500" : "text-red-500"
              }`}>
                {result === "correct" ? "✅" : "❌"}
              </div>
            </div>
          )}

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-4">
            {options.map((option) => {
              const colors = CATEGORY_COLORS[option.category];
              const isCorrect = result === "correct" && option.id === currentSound.id;
              const isWrong = result === "wrong" && option.id !== currentSound.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(option)}
                  disabled={result === "correct"}
                  className={`${colors.bg} ${colors.border} border-4 rounded-3xl p-6 transition-all shadow-lg ${
                    result === "correct" 
                      ? "opacity-50 cursor-not-allowed" 
                      : "hover:scale-105 active:scale-95 cursor-pointer"
                  } ${isCorrect ? "ring-4 ring-green-500 scale-110" : ""}`}
                >
                  <span className="text-6xl block mb-2">{option.emoji}</span>
                  <span className={`text-xl font-bold ${colors.text}`}>
                    {option.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Wrong answer hint */}
          {result === "wrong" && (
            <div className="text-center mt-4">
              <p className="text-red-500 font-bold text-lg">
                ❌ Try again! Listen carefully 👂
              </p>
            </div>
          )}
        </div>
      )}

      {/* Result Phase (shown briefly between rounds) */}
      {phase === "result" && (
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="text-8xl mb-4 animate-bounce">✅</div>
            <h2 className="text-3xl font-black text-green-500 mb-2">Correct!</h2>
            <p className="text-xl text-gray-600">
              {streak > 1 ? `🔥 ${streak} in a row! +${10 + (streak - 1) * 5} points!` : "+10 points!"}
            </p>
          </div>
        </div>
      )}

      {/* Back to Menu Button */}
      {phase !== "menu" && (
        <div className="max-w-2xl mx-auto mt-6 text-center">
          <button
            onClick={() => {
              stopSound();
              setPhase("menu");
            }}
            className="px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl transition-all"
          >
            🏠 Menu
          </button>
        </div>
      )}

      {/* Game Over (when reaching a certain score milestone) */}
      {phase === "playing" && round > 10 && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-3xl font-black text-[#4CAF50] mb-2">🎉 Great Job!</h2>
            <p className="text-2xl font-bold text-gray-700 my-4">
              Final Score: {score}
            </p>
            {score >= highScore && score > 0 && (
              <p className="text-xl font-bold text-[#FFD700] mb-4">
                🏆 New High Score!
              </p>
            )}
            <div className="space-y-3">
              <button
                onClick={startGame}
                className="w-full px-6 py-3 bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold rounded-xl transition-all"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => {
                  stopSound();
                  setPhase("menu");
                }}
                className="w-full px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl transition-all"
              >
                🏠 Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
