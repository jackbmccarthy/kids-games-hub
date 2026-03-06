"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type GamePhase = "menu" | "spinning" | "stopped" | "gameOver";

interface Wheel {
  id: number;
  symbols: string[];
  currentIndex: number;
  isSpinning: boolean;
  speed: number;
  stopped: boolean;
  finalSymbol: string | null;
}

// Fun symbols for kids - mix of fruits, shapes, and emojis
const SYMBOL_SETS = {
  fruits: ["🍎", "🍊", "🍋", "🍇", "🍓", "🍑", "🍒", "🥝"],
  shapes: ["⭐", "❤️", "💎", "🔵", "🟢", "🌙", "☀️", "⚡"],
  fun: ["🎉", "🎈", "🎁", "🏆", "👑", "🦋", "🌈", "🐞"],
};

const SPIN_COST = 10;
const JACKPOT_PRIZE = 100;
const PAIR_PRIZE = 20;

export default function SpinAndMatchPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [credits, setCredits] = useState(100);
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [lastWin, setLastWin] = useState(0);
  const [showJackpot, setShowJackpot] = useState(false);
  const [theme, setTheme] = useState<keyof typeof SYMBOL_SETS>("fruits");
  const [highScore, setHighScore] = useState(0);
  
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const particlesRef = useRef<{x: number, y: number, vx: number, vy: number, color: string, life: number}[]>([]);

  // Initialize wheels
  const initializeWheels = useCallback(() => {
    const symbols = SYMBOL_SETS[theme];
    const newWheels: Wheel[] = [];
    
    for (let i = 0; i < 3; i++) {
      // Shuffle symbols for each wheel
      const shuffled = [...symbols].sort(() => Math.random() - 0.5);
      newWheels.push({
        id: i,
        symbols: shuffled,
        currentIndex: Math.floor(Math.random() * shuffled.length),
        isSpinning: false,
        speed: 50 + Math.random() * 50, // Different speeds for each wheel
        stopped: false,
        finalSymbol: null,
      });
    }
    
    setWheels(newWheels);
  }, [theme]);

  // Start spinning all wheels
  const startSpin = useCallback(() => {
    if (credits < SPIN_COST) {
      setPhase("gameOver");
      return;
    }

    setCredits(c => c - SPIN_COST);
    setLastWin(0);
    setShowJackpot(false);
    
    // Reset wheels
    const newWheels = wheels.map(wheel => ({
      ...wheel,
      isSpinning: true,
      stopped: false,
      finalSymbol: null,
      speed: 50 + Math.random() * 100, // Random speed each spin
    }));
    
    setWheels(newWheels);
    setPhase("spinning");
  }, [credits, wheels]);

  // Stop a specific wheel
  const stopWheel = useCallback((wheelId: number) => {
    setWheels(prev => {
      const newWheels = prev.map(wheel => {
        if (wheel.id === wheelId && !wheel.stopped) {
          return {
            ...wheel,
            stopped: true,
            finalSymbol: wheel.symbols[wheel.currentIndex],
          };
        }
        return wheel;
      });
      
      // Check if all wheels are stopped
      if (newWheels.every(w => w.stopped)) {
        setTimeout(() => calculateWin(newWheels), 300);
      }
      
      return newWheels;
    });
  }, []);

  // Calculate win based on matches
  const calculateWin = useCallback((stoppedWheels: Wheel[]) => {
    const symbols = stoppedWheels.map(w => w.finalSymbol);
    
    // Check for matches
    const [s1, s2, s3] = symbols;
    let winAmount = 0;
    let isJackpot = false;
    
    if (s1 === s2 && s2 === s3) {
      // Jackpot! All three match
      winAmount = JACKPOT_PRIZE;
      isJackpot = true;
      setShowJackpot(true);
      createParticles();
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      // Two match
      winAmount = PAIR_PRIZE;
    }
    
    if (winAmount > 0) {
      setCredits(c => {
        const newTotal = c + winAmount;
        if (newTotal > highScore) {
          setHighScore(newTotal);
          localStorage.setItem("spinmatch-high-score", String(newTotal));
        }
        return newTotal;
      });
      setLastWin(winAmount);
    }
    
    setPhase("stopped");
    
    // Check for game over
    if (credits - SPIN_COST + winAmount < SPIN_COST && winAmount === 0) {
      setTimeout(() => setPhase("gameOver"), 2000);
    }
  }, [credits, highScore]);

  // Create celebration particles
  const createParticles = useCallback(() => {
    particlesRef.current = [];
    for (let i = 0; i < 50; i++) {
      particlesRef.current.push({
        x: typeof window !== 'undefined' ? window.innerWidth / 2 : 400,
        y: typeof window !== 'undefined' ? window.innerHeight / 2 : 400,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6'][Math.floor(Math.random() * 5)],
        life: 100,
      });
    }
  }, []);

  // Animation loop for spinning wheels
  useEffect(() => {
    if (phase === "spinning") {
      spinIntervalRef.current = setInterval(() => {
        setWheels(prev => prev.map(wheel => {
          if (!wheel.stopped) {
            let newIndex = wheel.currentIndex + 1;
            if (newIndex >= wheel.symbols.length) newIndex = 0;
            
            // Gradually slow down
            const newSpeed = wheel.speed * 0.995;
            
            return {
              ...wheel,
              currentIndex: newIndex,
              speed: newSpeed,
            };
          }
          return wheel;
        }));
      }, 50);
      
      return () => {
        if (spinIntervalRef.current) {
          clearInterval(spinIntervalRef.current);
        }
      };
    }
  }, [phase]);

  // Initialize on mount
  useEffect(() => {
    initializeWheels();
    const saved = localStorage.getItem("spinmatch-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, [initializeWheels]);

  // Reset game
  const resetGame = useCallback(() => {
    setCredits(100);
    setLastWin(0);
    setShowJackpot(false);
    initializeWheels();
    setPhase("menu");
  }, [initializeWheels]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex flex-col items-center justify-center p-4 overflow-hidden">
      
      {/* Header with credits */}
      {phase !== "menu" && (
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <div className="bg-white/90 rounded-xl px-4 py-2 shadow-lg">
            <p className="text-lg font-bold text-purple-600">💰 {credits} Credits</p>
          </div>
          {lastWin > 0 && (
            <div className="bg-green-400 rounded-xl px-4 py-2 shadow-lg animate-bounce">
              <p className="text-lg font-bold text-white">+{lastWin} 🎉</p>
            </div>
          )}
          {highScore > 100 && (
            <div className="bg-yellow-400 rounded-xl px-4 py-2 shadow-lg">
              <p className="text-lg font-bold text-white">🏆 {highScore}</p>
            </div>
          )}
        </div>
      )}

      {/* Slot Machine */}
      <div className="relative">
        {/* Machine frame */}
        <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-3xl p-6 shadow-2xl border-8 border-yellow-300">
          {/* Title */}
          <div className="text-center mb-4">
            <h1 className="text-3xl font-black text-white drop-shadow-lg">🎰 Spin & Match</h1>
          </div>
          
          {/* Wheels container */}
          <div className="flex gap-3 bg-gradient-to-b from-gray-800 to-gray-900 p-4 rounded-2xl shadow-inner">
            {wheels.map((wheel) => (
              <button
                key={wheel.id}
                onClick={() => stopWheel(wheel.id)}
                disabled={wheel.stopped || phase !== "spinning"}
                className={`
                  relative w-24 h-28 sm:w-32 sm:h-36 rounded-xl overflow-hidden
                  transition-all duration-300 transform
                  ${wheel.stopped 
                    ? "bg-gradient-to-b from-white to-gray-100 scale-100" 
                    : "bg-gradient-to-b from-white to-gray-100 animate-pulse scale-105 cursor-pointer"
                  }
                  ${!wheel.stopped && phase === "spinning" ? "hover:scale-110" : ""}
                  shadow-lg border-4 ${wheel.stopped ? "border-green-400" : "border-yellow-400"}
                `}
              >
                {/* Decorative lights on top */}
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 flex gap-2">
                  <div className={`w-2 h-2 rounded-full ${wheel.stopped ? "bg-green-400" : "bg-red-400 animate-pulse"}`} />
                  <div className={`w-2 h-2 rounded-full ${wheel.stopped ? "bg-green-400" : "bg-yellow-400 animate-pulse"}`} />
                  <div className={`w-2 h-2 rounded-full ${wheel.stopped ? "bg-green-400" : "bg-blue-400 animate-pulse"}`} />
                </div>
                
                {/* Symbol display */}
                <div className="flex items-center justify-center h-full text-5xl sm:text-6xl">
                  {wheel.symbols[wheel.currentIndex]}
                </div>
                
                {/* Tap indicator */}
                {!wheel.stopped && phase === "spinning" && (
                  <div className="absolute bottom-2 left-0 right-0 text-center">
                    <span className="text-xs font-bold text-purple-600 bg-white/80 rounded px-2 py-1">
                      TAP!
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {/* Instruction text */}
          <div className="text-center mt-3">
            {phase === "spinning" && !wheels.every(w => w.stopped) && (
              <p className="text-white font-bold animate-pulse">Tap each wheel to stop it!</p>
            )}
            {phase === "stopped" && lastWin === 0 && (
              <p className="text-white font-bold">No match - Try again!</p>
            )}
            {phase === "stopped" && lastWin === PAIR_PRIZE && (
              <p className="text-green-200 font-bold text-xl">🎉 Two match! +{PAIR_PRIZE} credits!</p>
            )}
          </div>
          
          {/* Spin button */}
          <button
            onClick={startSpin}
            disabled={phase === "spinning" || credits < SPIN_COST}
            className={`
              w-full mt-4 py-4 rounded-xl font-black text-xl
              transition-all duration-200 transform
              ${phase === "spinning" || credits < SPIN_COST
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:scale-105 hover:from-red-600 hover:to-pink-600 active:scale-95 shadow-lg"
              }
            `}
          >
            {phase === "spinning" ? "🎰 Spinning..." : `🎰 SPIN (${SPIN_COST} credits)`}
          </button>
        </div>
        
        {/* Jackpot celebration overlay */}
        {showJackpot && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center animate-bounce">
              <p className="text-6xl font-black text-yellow-300 drop-shadow-lg animate-pulse">
                🎉 JACKPOT! 🎉
              </p>
              <p className="text-3xl font-bold text-white mt-2">
                +{JACKPOT_PRIZE} Credits!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Menu Screen */}
      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md w-full mx-4">
            <h1 className="text-5xl font-black text-purple-600 mb-2">🎰 Spin & Match</h1>
            <p className="text-gray-600 mb-4">Tap to stop the wheels and match symbols!</p>
            
            {/* How to play */}
            <div className="bg-purple-50 rounded-xl p-4 mb-6 text-left">
              <p className="font-bold text-purple-600 mb-2">How to Play:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>🎰 Press SPIN to start (costs 10 credits)</li>
                <li>👆 Tap each wheel to stop it</li>
                <li>🌟 Match 3 = {JACKPOT_PRIZE} credits (Jackpot!)</li>
                <li>✨ Match 2 = {PAIR_PRIZE} credits</li>
              </ul>
            </div>
            
            {/* Theme selector */}
            <div className="mb-6">
              <p className="font-bold text-gray-700 mb-2">Choose Theme:</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {Object.keys(SYMBOL_SETS).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t as keyof typeof SYMBOL_SETS)}
                    className={`px-4 py-2 rounded-lg font-bold capitalize transition-all ${
                      theme === t 
                        ? "bg-purple-500 text-white scale-105" 
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {t === "fruits" && "🍎 "}
                    {t === "shapes" && "⭐ "}
                    {t === "fun" && "🎉 "}
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            {highScore > 100 && (
              <p className="text-lg font-bold text-yellow-500 mb-4">🏆 Best: {highScore} credits</p>
            )}
            
            <button
              onClick={() => {
                initializeWheels();
                setPhase("stopped");
              }}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl text-xl transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              ▶️ Play
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md w-full mx-4">
            <h2 className="text-4xl font-black text-red-500 mb-2">😢 Out of Credits!</h2>
            <p className="text-gray-600 mb-4">Better luck next time!</p>
            
            {highScore > 100 && (
              <p className="text-xl font-bold text-yellow-500 mb-4">🏆 Best: {highScore} credits</p>
            )}
            
            <div className="space-y-2">
              <button
                onClick={resetGame}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:scale-105 transition-transform"
              >
                🔄 Play Again (100 credits)
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-400 text-white font-bold rounded-xl hover:bg-gray-500 transition-colors"
              >
                🏠 Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confetti particles for jackpot */}
      {showJackpot && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            >
              <span className="text-4xl">
                {["🎉", "⭐", "✨", "🌟", "💫"][Math.floor(Math.random() * 5)]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Back to menu button during play */}
      {phase !== "menu" && phase !== "gameOver" && (
        <button
          onClick={() => setPhase("menu")}
          className="absolute top-4 right-4 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
        >
          <span className="text-2xl">🏠</span>
        </button>
      )}
    </main>
  );
}
