"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type GamePhase = "menu" | "playing" | "correct" | "wrong" | "gameOver";
type Difficulty = "easy" | "medium" | "hard";

interface TargetTime {
  hour: number;
  minute: number;
  displayHour: number; // For 12-hour display
  period: "AM" | "PM";
}

interface GameState {
  targetTime: TargetTime;
  userHour: number;
  userMinute: number;
}

const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string;
  description: string;
  minuteOptions: number[];
  emoji: string;
}> = {
  easy: {
    label: "Easy",
    description: "Hours only (3:00, 6:00, 9:00...)",
    minuteOptions: [0],
    emoji: "🌟",
  },
  medium: {
    label: "Medium",
    description: "Quarter hours (3:15, 6:30...)",
    minuteOptions: [0, 15, 30, 45],
    emoji: "⭐",
  },
  hard: {
    label: "Hard",
    description: "Any 5 minutes (3:05, 6:25...)",
    minuteOptions: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
    emoji: "💫",
  },
};

const CLOCK_SIZE = 280;
const CLOCK_CENTER = CLOCK_SIZE / 2;
const HOUR_HAND_LENGTH = 70;
const MINUTE_HAND_LENGTH = 100;

export default function ClockLearnPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScores, setHighScores] = useState<Record<Difficulty, number>>({
    easy: 0,
    medium: 0,
    hard: 0,
  });
  const [dragging, setDragging] = useState<"hour" | "minute" | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const clockRef = useRef<SVGSVGElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Generate a random target time based on difficulty
  const generateTargetTime = useCallback((diff: Difficulty): TargetTime => {
    const config = DIFFICULTY_CONFIG[diff];
    const hour = Math.floor(Math.random() * 12) + 1; // 1-12
    const minute = config.minuteOptions[Math.floor(Math.random() * config.minuteOptions.length)];
    
    return {
      hour,
      minute,
      displayHour: hour,
      period: Math.random() > 0.5 ? "AM" : "PM",
    };
  }, []);

  // Start a new round
  const startRound = useCallback(() => {
    const targetTime = generateTargetTime(difficulty);
    setGameState({
      targetTime,
      userHour: 12, // Start at 12 o'clock
      userMinute: 0,
    });
    setPhase("playing");
  }, [difficulty, generateTargetTime]);

  // Start the game
  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setScore(0);
    setStreak(0);
    setLevel(1);
    startRound();
  }, [startRound]);

  // Calculate hand angle from mouse position
  const getAngleFromMouse = useCallback((clientX: number, clientY: number, isHour: boolean): number => {
    if (!clockRef.current) return 0;
    
    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const angle = Math.atan2(clientY - centerY, clientX - centerX);
    let degrees = (angle * 180 / Math.PI) + 90; // Convert to degrees, offset by 90
    
    if (degrees < 0) degrees += 360;
    
    return degrees;
  }, []);

  // Convert angle to hour/minute value
  const angleToValue = useCallback((angle: number, isHour: boolean): number => {
    if (isHour) {
      // Hour: 360 degrees = 12 hours
      let hour = Math.round(angle / 30);
      if (hour === 0) hour = 12;
      if (hour > 12) hour = hour % 12;
      return hour;
    } else {
      // Minute: 360 degrees = 60 minutes
      // Snap to nearest 5 or 15 depending on difficulty
      const config = DIFFICULTY_CONFIG[difficulty];
      const minuteStep = difficulty === "easy" ? 60 : (difficulty === "medium" ? 15 : 5);
      
      let minute = Math.round(angle / 6);
      if (minute === 60) minute = 0;
      
      // Snap to valid minute options
      const validMinutes = config.minuteOptions;
      let closest = validMinutes[0];
      let minDiff = Math.abs(minute - closest);
      
      for (const m of validMinutes) {
        const diff = Math.min(Math.abs(minute - m), 60 - Math.abs(minute - m));
        if (diff < minDiff) {
          minDiff = diff;
          closest = m;
        }
      }
      
      return closest;
    }
  }, [difficulty]);

  // Handle mouse/touch events for dragging
  const handlePointerDown = useCallback((hand: "hour" | "minute") => (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(hand);
    
    // Initialize audio context on first interaction
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || !gameState) return;
    
    const angle = getAngleFromMouse(e.clientX, e.clientY, dragging === "hour");
    const value = angleToValue(angle, dragging === "hour");
    
    if (dragging === "hour") {
      setGameState(prev => prev ? { ...prev, userHour: value } : null);
    } else {
      setGameState(prev => prev ? { ...prev, userMinute: value } : null);
    }
  }, [dragging, gameState, getAngleFromMouse, angleToValue]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  // Play sound effect
  const playSound = useCallback((type: "correct" | "wrong" | "tick") => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    if (type === "correct") {
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } else if (type === "wrong") {
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } else {
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    }
  }, []);

  // Check answer
  const checkAnswer = useCallback(() => {
    if (!gameState) return;
    
    const { targetTime, userHour, userMinute } = gameState;
    
    // For time matching, we need to handle the hour correctly
    // Hour hand moves slightly based on minutes (e.g., at 6:30, hour hand is halfway between 6 and 7)
    // But for simplicity in this game, we'll match exact hours and minutes
    
    const isCorrect = userHour === targetTime.hour && userMinute === targetTime.minute;
    
    if (isCorrect) {
      playSound("correct");
      const points = 10 * level + (difficulty === "hard" ? 10 : difficulty === "medium" ? 5 : 0);
      setScore(s => s + points);
      setStreak(s => {
        const newStreak = s + 1;
        if (newStreak > bestStreak) setBestStreak(newStreak);
        return newStreak;
      });
      setShowCelebration(true);
      setPhase("correct");
      
      setTimeout(() => {
        setShowCelebration(false);
        setLevel(l => l + 1);
        startRound();
      }, 1500);
    } else {
      playSound("wrong");
      setStreak(0);
      setPhase("wrong");
      
      setTimeout(() => {
        if (score === 0) {
          startRound();
        } else {
          setPhase("gameOver");
          if (score > highScores[difficulty]) {
            setHighScores(prev => ({ ...prev, [difficulty]: score }));
            localStorage.setItem("clock-learn-high-scores", JSON.stringify({
              ...highScores,
              [difficulty]: score,
            }));
          }
        }
      }, 2000);
    }
  }, [gameState, difficulty, level, score, bestStreak, highScores, playSound, startRound]);

  // Load high scores
  useEffect(() => {
    const saved = localStorage.getItem("clock-learn-high-scores");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHighScores(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Add global pointer event listeners
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!dragging || !gameState) return;
      
      const angle = getAngleFromMouse(e.clientX, e.clientY, dragging === "hour");
      const value = angleToValue(angle, dragging === "hour");
      
      if (dragging === "hour") {
        setGameState(prev => prev ? { ...prev, userHour: value } : null);
      } else {
        setGameState(prev => prev ? { ...prev, userMinute: value } : null);
      }
    };
    
    const handleGlobalPointerUp = () => {
      setDragging(null);
    };
    
    if (dragging) {
      window.addEventListener("pointermove", handleGlobalPointerMove);
      window.addEventListener("pointerup", handleGlobalPointerUp);
    }
    
    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, [dragging, gameState, getAngleFromMouse, angleToValue]);

  // Format time for display
  const formatTime = (hour: number, minute: number): string => {
    const h = hour === 0 ? 12 : hour;
    const m = minute.toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  // Calculate hand rotation
  const getHourRotation = (hour: number, minute: number): number => {
    // Hour hand moves 30 degrees per hour plus slight adjustment for minutes
    return (hour % 12) * 30 + minute * 0.5;
  };

  const getMinuteRotation = (minute: number): number => {
    return minute * 6;
  };

  // Render clock face
  const renderClock = (isInteractive: boolean = false) => {
    if (!gameState && !isInteractive) return null;
    
    const hour = gameState?.userHour ?? 12;
    const minute = gameState?.userMinute ?? 0;
    
    return (
      <svg
        ref={clockRef}
        width={CLOCK_SIZE}
        height={CLOCK_SIZE}
        className={`drop-shadow-xl ${isInteractive ? "cursor-pointer" : ""}`}
        onPointerMove={dragging ? handlePointerMove : undefined}
        onPointerUp={handlePointerUp}
      >
        {/* Clock face background */}
        <circle
          cx={CLOCK_CENTER}
          cy={CLOCK_CENTER}
          r={CLOCK_CENTER - 10}
          fill="white"
          stroke="#334155"
          strokeWidth="6"
        />
        
        {/* Hour numbers */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
          const angle = ((num - 3) * 30) * (Math.PI / 180);
          const x = CLOCK_CENTER + Math.cos(angle) * (CLOCK_CENTER - 35);
          const y = CLOCK_CENTER + Math.sin(angle) * (CLOCK_CENTER - 35);
          const isHighlight = gameState && num === gameState.targetTime.hour;
          
          return (
            <text
              key={num}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className={`font-bold text-xl select-none ${isHighlight && isInteractive ? "fill-blue-500" : "fill-slate-700"}`}
              style={{ fontSize: "20px" }}
            >
              {num}
            </text>
          );
        })}
        
        {/* Minute ticks */}
        {Array.from({ length: 60 }, (_, i) => i).map((tick) => {
          if (tick % 5 === 0) return null; // Skip hour positions
          const angle = ((tick - 15) * 6) * (Math.PI / 180);
          const x1 = CLOCK_CENTER + Math.cos(angle) * (CLOCK_CENTER - 18);
          const y1 = CLOCK_CENTER + Math.sin(angle) * (CLOCK_CENTER - 18);
          const x2 = CLOCK_CENTER + Math.cos(angle) * (CLOCK_CENTER - 25);
          const y2 = CLOCK_CENTER + Math.sin(angle) * (CLOCK_CENTER - 25);
          
          return (
            <line
              key={tick}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#CBD5E1"
              strokeWidth="2"
            />
          );
        })}
        
        {/* Hour hand (blue) */}
        <g
          onPointerDown={isInteractive ? handlePointerDown("hour") : undefined}
          className={isInteractive ? "cursor-grab active:cursor-grabbing" : ""}
        >
          <line
            x1={CLOCK_CENTER}
            y1={CLOCK_CENTER}
            x2={CLOCK_CENTER}
            y2={CLOCK_CENTER - HOUR_HAND_LENGTH}
            stroke="#3B82F6"
            strokeWidth="8"
            strokeLinecap="round"
            transform={`rotate(${getHourRotation(hour, minute)}, ${CLOCK_CENTER}, ${CLOCK_CENTER})`}
            className={isInteractive && dragging === "hour" ? "drop-shadow-lg" : ""}
          />
          {/* Drag indicator for hour hand */}
          {isInteractive && (
            <circle
              cx={CLOCK_CENTER}
              cy={CLOCK_CENTER - HOUR_HAND_LENGTH + 10}
              r="12"
              fill="#3B82F6"
              stroke="white"
              strokeWidth="3"
              transform={`rotate(${getHourRotation(hour, minute)}, ${CLOCK_CENTER}, ${CLOCK_CENTER})`}
              className={dragging === "hour" ? "animate-pulse" : ""}
            />
          )}
        </g>
        
        {/* Minute hand (red) */}
        <g
          onPointerDown={isInteractive ? handlePointerDown("minute") : undefined}
          className={isInteractive ? "cursor-grab active:cursor-grabbing" : ""}
        >
          <line
            x1={CLOCK_CENTER}
            y1={CLOCK_CENTER}
            x2={CLOCK_CENTER}
            y2={CLOCK_CENTER - MINUTE_HAND_LENGTH}
            stroke="#EF4444"
            strokeWidth="6"
            strokeLinecap="round"
            transform={`rotate(${getMinuteRotation(minute)}, ${CLOCK_CENTER}, ${CLOCK_CENTER})`}
            className={isInteractive && dragging === "minute" ? "drop-shadow-lg" : ""}
          />
          {/* Drag indicator for minute hand */}
          {isInteractive && (
            <circle
              cx={CLOCK_CENTER}
              cy={CLOCK_CENTER - MINUTE_HAND_LENGTH + 15}
              r="10"
              fill="#EF4444"
              stroke="white"
              strokeWidth="3"
              transform={`rotate(${getMinuteRotation(minute)}, ${CLOCK_CENTER}, ${CLOCK_CENTER})`}
              className={dragging === "minute" ? "animate-pulse" : ""}
            />
          )}
        </g>
        
        {/* Center dot */}
        <circle
          cx={CLOCK_CENTER}
          cy={CLOCK_CENTER}
          r="10"
          fill="#334155"
          stroke="white"
          strokeWidth="3"
        />
      </svg>
    );
  };

  // Celebration particles
  const CelebrationParticles = () => (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          className="absolute animate-ping"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${0.5 + Math.random() * 0.5}s`,
          }}
        >
          <span className="text-3xl">
            {["⭐", "✨", "🎉", "🌟", "💫"][Math.floor(Math.random() * 5)]}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-lg text-center mb-4">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-1">
          🕐 Clock Learn 🕐
        </h1>
        {phase !== "menu" && (
          <div className="flex justify-center gap-4 text-sm md:text-base">
            <span className="bg-blue-500/30 px-3 py-1 rounded-full text-blue-200">
              Level: {level}
            </span>
            <span className="bg-yellow-500/30 px-3 py-1 rounded-full text-yellow-200">
              Score: {score}
            </span>
            <span className="bg-orange-500/30 px-3 py-1 rounded-full text-orange-200">
              Streak: {streak}🔥
            </span>
          </div>
        )}
      </header>

      {/* Celebration overlay */}
      {showCelebration && <CelebrationParticles />}

      {/* Menu */}
      {phase === "menu" && (
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center">
            <div className="text-6xl mb-4">🕐</div>
            <p className="text-white/80 mb-6 text-lg">
              Learn to tell time! Move the clock hands to match the time shown.
            </p>

            <div className="space-y-3 mb-6">
              {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => startGame(diff)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-bold rounded-xl text-lg transition-all shadow-lg hover:scale-105 active:scale-95"
                >
                  <div className="flex items-center justify-between">
                    <span>
                      {DIFFICULTY_CONFIG[diff].emoji} {DIFFICULTY_CONFIG[diff].label}
                    </span>
                    {highScores[diff] > 0 && (
                      <span className="text-yellow-300 text-sm">🏆 {highScores[diff]}</span>
                    )}
                  </div>
                  <p className="text-white/70 text-sm mt-1">
                    {DIFFICULTY_CONFIG[diff].description}
                  </p>
                </button>
              ))}
            </div>

            <div className="bg-white/10 rounded-xl p-4 text-sm text-white/70">
              <p className="font-bold text-white mb-2">How to Play:</p>
              <p>🕐 Drag the blue hand for hours</p>
              <p>🕑 Drag the red hand for minutes</p>
              <p>🕒 Match the time shown below!</p>
            </div>
          </div>
        </div>
      )}

      {/* Game Area */}
      {(phase === "playing" || phase === "correct" || phase === "wrong") && gameState && (
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          {/* Target Time Display */}
          <div className="bg-white/20 backdrop-blur rounded-2xl px-8 py-4 mb-6 text-center">
            <p className="text-white/70 text-sm mb-1">Set the clock to:</p>
            <p className="text-4xl md:text-5xl font-black text-white">
              {formatTime(gameState.targetTime.hour, gameState.targetTime.minute)}
            </p>
            <p className="text-xl text-white/60 mt-1">
              {gameState.targetTime.period}
            </p>
          </div>

          {/* Interactive Clock */}
          <div className="relative mb-6">
            {renderClock(true)}
            
            {/* Current setting display */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-800 rounded-full px-4 py-1 text-white font-bold">
              {formatTime(gameState.userHour, gameState.userMinute)}
            </div>
          </div>

          {/* Instructions */}
          <p className="text-white/60 text-center mb-4 text-sm">
            Drag the hands to set the time!
            <br />
            <span className="text-blue-400">● Blue = Hour</span>
            <span className="mx-2">|</span>
            <span className="text-red-400">● Red = Minute</span>
          </p>

          {/* Check Button */}
          {phase === "playing" && (
            <button
              onClick={checkAnswer}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-xl text-xl transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              ✅ Check Time
            </button>
          )}

          {/* Correct Feedback */}
          {phase === "correct" && (
            <div className="text-center animate-bounce">
              <span className="text-6xl">🎉</span>
              <p className="text-green-400 font-bold text-2xl mt-2">Perfect!</p>
              {streak > 1 && (
                <p className="text-yellow-400 font-bold text-lg">{streak}x Streak! 🔥</p>
              )}
            </div>
          )}

          {/* Wrong Feedback */}
          {phase === "wrong" && (
            <div className="text-center bg-white/10 rounded-2xl p-6 max-w-sm">
              <span className="text-5xl">😊</span>
              <p className="text-white font-bold text-xl mt-2">Almost!</p>
              <p className="text-white/70 mt-2">
                The time was {formatTime(gameState.targetTime.hour, gameState.targetTime.minute)} {gameState.targetTime.period}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Game Over */}
      {phase === "gameOver" && (
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="text-6xl mb-4">🌟</div>
            <h2 className="text-3xl font-black text-white mb-2">Great Job!</h2>
            
            <div className="my-6 space-y-2">
              <p className="text-4xl font-bold text-yellow-400">{score} points</p>
              <p className="text-lg text-white/60">Level {level}</p>
              <p className="text-lg text-orange-400">Best Streak: {bestStreak}🔥</p>
              {score >= highScores[difficulty] && score > 0 && (
                <p className="text-green-400 font-bold text-xl mt-2">🏆 New High Score!</p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => startGame(difficulty)}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-xl transition-all"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition-all"
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
