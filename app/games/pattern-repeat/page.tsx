"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type GamePhase = "menu" | "showing" | "input" | "gameOver";
type Difficulty = "easy" | "normal" | "hard";

interface ButtonState {
  color: string;
  tone: number;
  isLit: boolean;
}

const BUTTONS: ButtonState[] = [
  { color: "#FF6B6B", tone: 261.63, isLit: false }, // C - Red
  { color: "#4ECDC4", tone: 329.63, isLit: false }, // E - Cyan
  { color: "#FFE66D", tone: 392.00, isLit: false }, // G - Yellow
  { color: "#957DAD", tone: 523.25, isLit: false }, // C5 - Purple
];

const DIFFICULTY_CONFIG = {
  easy: { showDuration: 600, betweenDelay: 400, speedIncrease: 0 },
  normal: { showDuration: 400, betweenDelay: 300, speedIncrease: 5 },
  hard: { showDuration: 250, betweenDelay: 200, speedIncrease: 10 },
};

export default function PatternRepeatPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [pattern, setPattern] = useState<number[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [buttons, setButtons] = useState<ButtonState[]>(BUTTONS.map(b => ({ ...b })));
  const [showingIndex, setShowingIndex] = useState(-1);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const patternRef = useRef<number[]>([]);

  // Get audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play tone
  const playTone = useCallback((frequency: number, duration: number = 300) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);
    } catch {
      // Audio not available
    }
  }, [getAudioContext]);

  // Light up button
  const lightButton = useCallback((index: number, duration: number) => {
    return new Promise<void>((resolve) => {
      setButtons(prev => prev.map((b, i) => ({
        ...b,
        isLit: i === index,
      })));
      playTone(BUTTONS[index].tone, duration);
      
      setTimeout(() => {
        setButtons(prev => prev.map(b => ({ ...b, isLit: false })));
        setTimeout(resolve, 100);
      }, duration);
    });
  }, [playTone]);

  // Show pattern
  const showPattern = useCallback(async () => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const currentPattern = patternRef.current;
    
    setPhase("showing");
    
    // Brief pause before showing
    await new Promise(r => setTimeout(r, 500));
    
    for (let i = 0; i < currentPattern.length; i++) {
      const speedMultiplier = 1 - (Math.floor(i / 5) * config.speedIncrease) / 100;
      const duration = config.showDuration * Math.max(0.5, speedMultiplier);
      
      await lightButton(currentPattern[i], duration);
      await new Promise(r => setTimeout(r, config.betweenDelay));
    }
    
    setPhase("input");
    setPlayerIndex(0);
  }, [difficulty, lightButton]);

  // Start new round
  const startRound = useCallback(() => {
    const newButton = Math.floor(Math.random() * 4);
    const newPattern = [...patternRef.current, newButton];
    patternRef.current = newPattern;
    setPattern(newPattern);
    setRound(prev => prev + 1);
    showPattern();
  }, [showPattern]);

  // Start game
  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setPattern([]);
    patternRef.current = [];
    setRound(0);
    setScore(0);
    setPlayerIndex(0);
    
    // Add first button after brief delay
    setTimeout(() => {
      const firstButton = Math.floor(Math.random() * 4);
      patternRef.current = [firstButton];
      setPattern([firstButton]);
      setRound(1);
      showPattern();
    }, 500);
  }, [showPattern]);

  // Handle button press
  const handleButtonPress = useCallback((index: number) => {
    if (phase !== "input") return;

    const currentPattern = patternRef.current;
    
    // Light up button
    lightButton(index, 200);

    if (currentPattern[playerIndex] === index) {
      // Correct!
      const newIndex = playerIndex + 1;
      setPlayerIndex(newIndex);
      
      if (newIndex === currentPattern.length) {
        // Completed pattern!
        const roundScore = currentPattern.length * 10;
        setScore(prev => prev + roundScore);
        
        // Start next round after delay
        setTimeout(() => {
          startRound();
        }, 1000);
      }
    } else {
      // Wrong!
      setPhase("gameOver");
      
      // Play error sound
      playTone(150, 500);
      
      // Update high score
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("pattern-repeat-high-score", String(score));
      }
    }
  }, [phase, playerIndex, score, highScore, lightButton, playTone, startRound]);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("pattern-repeat-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== "input") return;
      
      const keyMap: { [key: string]: number } = {
        "1": 0, "2": 1, "3": 2, "4": 3,
        "q": 0, "w": 1, "e": 2, "r": 3,
      };
      
      const index = keyMap[e.key.toLowerCase()];
      if (index !== undefined) {
        handleButtonPress(index);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, handleButtonPress]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-4 flex flex-col items-center justify-center">
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">🎵 Pattern Repeat 🎵</h1>
        {phase !== "menu" && (
          <div className="flex justify-center gap-6 text-lg">
            <span className="text-[#4ECDC4]">Round: {round}</span>
            <span className="text-[#FFE66D]">Score: {score}</span>
          </div>
        )}
      </header>

      {/* Game Button Grid */}
      {phase !== "menu" && phase !== "gameOver" && (
        <div className="relative">
          {/* Status indicator */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-white font-bold text-xl">
            {phase === "showing" && "👀 Watch..."}
            {phase === "input" && "👆 Your turn!"}
          </div>

          {/* 2x2 Button Grid */}
          <div className="grid grid-cols-2 gap-4">
            {buttons.map((button, index) => (
              <button
                key={index}
                onClick={() => handleButtonPress(index)}
                disabled={phase !== "input"}
                className={`
                  w-28 h-28 md:w-36 md:h-36 rounded-2xl
                  transition-all duration-150
                  ${button.isLit 
                    ? "brightness-150 scale-105 shadow-lg" 
                    : "brightness-75 hover:brightness-100"
                  }
                  ${phase === "input" ? "cursor-pointer active:scale-95" : "cursor-not-allowed"}
                `}
                style={{ 
                  backgroundColor: button.color,
                  boxShadow: button.isLit ? `0 0 30px ${button.color}` : "none",
                }}
              >
                <span className="text-white/30 font-bold text-2xl">{index + 1}</span>
              </button>
            ))}
          </div>

          {/* Progress indicator */}
          {phase === "input" && (
            <div className="mt-6 flex justify-center gap-2">
              {pattern.map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i < playerIndex ? "bg-[#4ECDC4]" : 
                    i === playerIndex ? "bg-white animate-pulse" : 
                    "bg-gray-600"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Menu */}
      {phase === "menu" && (
        <div className="bg-[#16213e] rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
          <p className="text-gray-300 mb-6">Watch the pattern, then repeat it!</p>

          {highScore > 0 && (
            <p className="text-[#FFE66D] font-bold mb-4">🏆 High Score: {highScore}</p>
          )}

          <div className="space-y-3 mb-6">
            <p className="font-bold text-white">Select Difficulty:</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => startGame("easy")}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all"
              >
                Easy 🌱
              </button>
              <button
                onClick={() => startGame("normal")}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition-all"
              >
                Normal ⭐
              </button>
              <button
                onClick={() => startGame("hard")}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all"
              >
                Hard 🔥
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            <p className="font-bold mb-2">Controls:</p>
            <p>Keyboard: 1-2-3-4 or Q-W-E-R</p>
            <p>Mobile: Tap the buttons!</p>
          </div>
        </div>
      )}

      {/* Game Over */}
      {phase === "gameOver" && (
        <div className="bg-[#16213e] rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
          <h2 className="text-3xl font-black text-[#FF6B6B] mb-4">💔 Game Over!</h2>
          
          <div className="my-6 space-y-2 text-white">
            <p className="text-2xl">Score: {score}</p>
            <p className="text-lg">Rounds Completed: {round - 1}</p>
            <p className="text-lg">Pattern Length: {pattern.length}</p>
            {score >= highScore && score > 0 && (
              <p className="text-[#FFE66D] font-bold text-xl">🏆 New High Score!</p>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => startGame(difficulty)}
              className="w-full px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
            >
              🔄 Play Again
            </button>
            <button
              onClick={() => setPhase("menu")}
              className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition-all"
            >
              🏠 Menu
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
