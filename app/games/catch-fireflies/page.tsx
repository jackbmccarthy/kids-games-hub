'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Firefly {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  glowIntensity: number;
  opacity: number;
  size: number;
  caught: boolean;
  spawnTime: number;
}

interface CaughtFirefly {
  id: number;
  color: string;
  y: number;
}

const FIREFLY_COLORS = [
  { color: '#FFD700', glow: '#FFD700', name: 'gold' },
  { color: '#90EE90', glow: '#90EE90', name: 'green' },
  { color: '#87CEEB', glow: '#87CEEB', name: 'blue' },
  { color: '#FFB6C1', glow: '#FFB6C1', name: 'pink' },
  { color: '#DDA0DD', glow: '#DDA0DD', name: 'purple' },
  { color: '#FFA07A', glow: '#FFA07A', name: 'orange' },
];

export default function CatchFireflies() {
  const [fireflies, setFireflies] = useState<Firefly[]>([]);
  const [caughtFireflies, setCaughtFireflies] = useState<CaughtFirefly[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lastCatchTime, setLastCatchTime] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState<'free' | 'timer'>('free');
  const [timeLeft, setTimeLeft] = useState(60);
  const [jarGoal] = useState(20);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextFireflyId = useRef(0);
  const lastSpawnTime = useRef(0);
  const catchTimestamps = useRef<number[]>([]);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play gentle catch sound
  const playCatchSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (e) {
      // Audio not supported
    }
  }, [soundEnabled, initAudio]);

  // Play combo bonus sound
  const playComboSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      [600, 800, 1000].forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.15);
        
        oscillator.start(ctx.currentTime + i * 0.05);
        oscillator.stop(ctx.currentTime + i * 0.05 + 0.15);
      });
    } catch (e) {
      // Audio not supported
    }
  }, [soundEnabled, initAudio]);

  // Play background nature ambience
  const playAmbience = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      // Very subtle cricket-like sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = 'sine';
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(4000, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // Audio not supported
    }
  }, [soundEnabled, initAudio]);

  // Spawn a new firefly
  const spawnFirefly = useCallback(() => {
    const colorData = FIREFLY_COLORS[Math.floor(Math.random() * FIREFLY_COLORS.length)];
    const newFirefly: Firefly = {
      id: nextFireflyId.current++,
      x: Math.random() * 80 + 10, // 10-90% of screen
      y: Math.random() * 70 + 10,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      color: colorData.color,
      glowIntensity: 0.5 + Math.random() * 0.5,
      opacity: 1,
      size: 8 + Math.random() * 8,
      caught: false,
      spawnTime: Date.now(),
    };
    
    setFireflies(prev => [...prev, newFirefly]);
    
    // Occasionally play ambience
    if (Math.random() < 0.3) {
      playAmbience();
    }
  }, [playAmbience]);

  // Handle firefly click
  const catchFirefly = useCallback((firefly: Firefly) => {
    if (firefly.caught || !gameStarted) return;
    
    const now = Date.now();
    playCatchSound();
    
    // Update combo
    const recentCatches = catchTimestamps.current.filter(t => now - t < 1500);
    recentCatches.push(now);
    catchTimestamps.current = recentCatches;
    
    const newCombo = recentCatches.length >= 3 ? recentCatches.length : 0;
    setCombo(newCombo);
    
    // Calculate points
    let points = 10;
    if (newCombo >= 3) {
      points += newCombo * 5;
      if (newCombo >= 5) {
        playComboSound();
      }
    }
    
    setScore(prev => prev + points);
    setLastCatchTime(now);
    
    // Add to jar
    setCaughtFireflies(prev => [
      ...prev,
      {
        id: firefly.id,
        color: firefly.color,
        y: Math.max(0, 80 - (prev.length + 1) * 4),
      }
    ]);
    
    // Mark as caught
    setFireflies(prev => prev.map(f => 
      f.id === firefly.id ? { ...f, caught: true } : f
    ));
    
    // Remove after animation
    setTimeout(() => {
      setFireflies(prev => prev.filter(f => f.id !== firefly.id));
    }, 300);
  }, [gameStarted, playCatchSound, playComboSound]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const gameLoop = setInterval(() => {
      // Update firefly positions
      setFireflies(prev => prev.map(f => {
        if (f.caught) return f;
        
        let newX = f.x + f.vx * 0.5;
        let newY = f.y + f.vy * 0.5;
        let newVx = f.vx;
        let newVy = f.vy;
        
        // Bounce off edges
        if (newX < 5 || newX > 95) newVx *= -1;
        if (newY < 5 || newY > 85) newVy *= -1;
        
        // Random direction changes
        if (Math.random() < 0.02) {
          newVx += (Math.random() - 0.5) * 0.5;
          newVy += (Math.random() - 0.5) * 0.5;
        }
        
        // Clamp velocity
        newVx = Math.max(-1.5, Math.min(1.5, newVx));
        newVy = Math.max(-1.5, Math.min(1.5, newVy));
        
        // Fade over time (15 seconds lifespan)
        const age = (Date.now() - f.spawnTime) / 1000;
        const newOpacity = Math.max(0, 1 - age / 15);
        
        return {
          ...f,
          x: Math.max(5, Math.min(95, newX)),
          y: Math.max(5, Math.min(85, newY)),
          vx: newVx,
          vy: newVy,
          opacity: newOpacity,
          glowIntensity: 0.3 + Math.sin(Date.now() / 300 + f.id) * 0.4,
        };
      }).filter(f => f.opacity > 0 || f.caught));
      
      // Spawn new fireflies
      const now = Date.now();
      if (now - lastSpawnTime.current > 1500 && Math.random() < 0.3) {
        spawnFirefly();
        lastSpawnTime.current = now;
      }
    }, 50);
    
    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, spawnFirefly]);

  // Timer mode countdown
  useEffect(() => {
    if (!gameStarted || gameMode !== 'timer' || gameOver) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameStarted, gameMode, gameOver]);

  // Check for free play jar goal
  useEffect(() => {
    if (gameMode === 'free' && caughtFireflies.length >= jarGoal && !gameOver) {
      setGameOver(true);
    }
  }, [caughtFireflies.length, gameMode, jarGoal, gameOver]);

  // Update high score
  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  // Start game
  const startGame = (mode: 'free' | 'timer') => {
    setGameMode(mode);
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setCombo(0);
    setFireflies([]);
    setCaughtFireflies([]);
    setTimeLeft(60);
    catchTimestamps.current = [];
    lastSpawnTime.current = Date.now();
    
    // Initial spawn
    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => spawnFirefly(), i * 200);
      }
    }, 500);
  };

  // Reset game
  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setCombo(0);
    setFireflies([]);
    setCaughtFireflies([]);
    setTimeLeft(60);
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(to bottom, #0a1628 0%, #1a2744 50%, #0d1f2d 100%)',
    }}>
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
              opacity: Math.random() * 0.8 + 0.2,
              animation: `twinkle ${2 + Math.random() * 3}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Trees silhouette */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none">
        <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,100 L0,60 Q20,40 40,60 Q60,30 80,60 Q100,50 120,70 Q140,35 160,65 Q180,45 200,70 Q220,30 240,60 Q260,50 280,70 Q300,40 320,60 Q340,45 360,65 Q380,50 400,60 L400,100 Z"
            fill="#0a1628"
          />
        </svg>
      </div>

      {/* Main game area */}
      {!gameStarted ? (
        // Start screen
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-yellow-300 mb-4" style={{
              textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4)',
            }}>
              🌟 Catch Fireflies! 🌟
            </h1>
            <p className="text-xl text-green-200 opacity-80">
              Click the glowing fireflies to catch them in your jar!
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full max-w-md">
            <button
              onClick={() => startGame('free')}
              className="px-8 py-6 text-2xl font-bold rounded-2xl transition-all transform hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                color: '#052e16',
                boxShadow: '0 8px 30px rgba(34, 197, 94, 0.4)',
              }}
            >
              🏠 Free Play
              <div className="text-sm font-normal mt-1 opacity-80">Catch 20 fireflies!</div>
            </button>

            <button
              onClick={() => startGame('timer')}
              className="px-8 py-6 text-2xl font-bold rounded-2xl transition-all transform hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                color: '#1e3a5f',
                boxShadow: '0 8px 30px rgba(59, 130, 246, 0.4)',
              }}
            >
              ⏱️ Timer Mode
              <div className="text-sm font-normal mt-1 opacity-80">60 seconds - Catch as many as you can!</div>
            </button>
          </div>

          {highScore > 0 && (
            <div className="mt-8 text-yellow-300 text-xl">
              🏆 High Score: {highScore}
            </div>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="mt-8 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
          </button>
        </div>
      ) : gameOver ? (
        // Game over screen
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-yellow-300 mb-6" style={{
              textShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
            }}>
              {gameMode === 'free' ? '🎉 Jar Filled!' : '⏰ Time\'s Up!'}
            </h2>
            
            <div className="text-6xl font-bold text-white mb-4">{score}</div>
            <div className="text-xl text-green-200 mb-8">Points Earned!</div>
            
            {score === highScore && score > 0 && (
              <div className="text-2xl text-yellow-300 mb-6 animate-bounce">
                🏆 New High Score! 🏆
              </div>
            )}

            <div className="text-lg text-blue-200 mb-8">
              Fireflies Caught: {caughtFireflies.length}
            </div>

            <button
              onClick={resetGame}
              className="px-8 py-4 text-xl font-bold rounded-xl transition-all transform hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
                color: '#4a1942',
                boxShadow: '0 8px 30px rgba(236, 72, 153, 0.4)',
              }}
            >
              Play Again
            </button>
          </div>
        </div>
      ) : (
        // Active game
        <>
          {/* HUD */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
            <div className="flex flex-col gap-2">
              <div className="px-4 py-2 rounded-xl bg-black/30 backdrop-blur-sm">
                <div className="text-yellow-300 text-2xl font-bold">{score}</div>
                <div className="text-green-200 text-sm">Points</div>
              </div>
              
              {combo >= 3 && (
                <div className="px-3 py-1 rounded-lg bg-orange-500/50 animate-pulse">
                  <span className="text-white font-bold">🔥 x{combo} Combo!</span>
                </div>
              )}
            </div>

            {gameMode === 'timer' && (
              <div className="px-4 py-2 rounded-xl bg-black/30 backdrop-blur-sm">
                <div className="text-blue-300 text-2xl font-bold">{timeLeft}s</div>
                <div className="text-blue-200 text-sm">Time Left</div>
              </div>
            )}

            {gameMode === 'free' && (
              <div className="px-4 py-2 rounded-xl bg-black/30 backdrop-blur-sm">
                <div className="text-green-300 text-2xl font-bold">{caughtFireflies.length}/{jarGoal}</div>
                <div className="text-green-200 text-sm">Fireflies</div>
              </div>
            )}
          </div>

          {/* Fireflies */}
          {fireflies.map(firefly => (
            <button
              key={firefly.id}
              onClick={() => catchFirefly(firefly)}
              disabled={firefly.caught}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 cursor-pointer"
              style={{
                left: `${firefly.x}%`,
                top: `${firefly.y}%`,
                opacity: firefly.caught ? 0 : firefly.opacity,
                transform: `translate(-50%, -50%) scale(${firefly.caught ? 0 : 1})`,
              }}
            >
              <div
                className="rounded-full"
                style={{
                  width: firefly.size,
                  height: firefly.size,
                  background: `radial-gradient(circle, ${firefly.color} 0%, transparent 70%)`,
                  boxShadow: `0 0 ${firefly.size}px ${firefly.size * firefly.glowIntensity}px ${firefly.color}`,
                  animation: 'glow 1s ease-in-out infinite',
                }}
              />
            </button>
          ))}

          {/* Mason Jar */}
          <div className="absolute bottom-4 right-4 w-28">
            {/* Jar body */}
            <div className="relative" style={{
              background: 'linear-gradient(to right, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%)',
              borderRadius: '0 0 20px 20px',
              border: '3px solid rgba(255,255,255,0.3)',
              borderBottomWidth: '4px',
              height: '120px',
              overflow: 'hidden',
            }}>
              {/* Jar lid */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-20 h-6 rounded-t-lg"
                style={{
                  background: 'linear-gradient(to bottom, #6b7280 0%, #4b5563 100%)',
                  border: '2px solid #374151',
                }}
              />
              
              {/* Caught fireflies in jar */}
              {caughtFireflies.slice(-20).map((cf, i) => (
                <div
                  key={cf.id}
                  className="absolute rounded-full animate-pulse"
                  style={{
                    width: 6,
                    height: 6,
                    background: cf.color,
                    boxShadow: `0 0 8px 4px ${cf.color}`,
                    left: `${10 + (i % 5) * 18}%`,
                    bottom: `${5 + Math.floor(i / 5) * 15}%`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
      `}</style>
    </div>
  );
}
