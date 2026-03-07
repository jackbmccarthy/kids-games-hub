'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Fruit {
  id: number;
  type: 'watermelon' | 'orange' | 'apple' | 'banana';
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  sliced: boolean;
}

interface SliceLine {
  id: number;
  points: { x: number; y: number }[];
  opacity: number;
}

type GamePhase = 'menu' | 'playing' | 'paused' | 'gameOver';

const FRUIT_EMOJIS = {
  watermelon: '🍉',
  orange: '🍊',
  apple: '🍎',
  banana: '🍌',
};

export default function FruitSliceFun() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const fruitsRef = useRef<Fruit[]>([]);
  const sliceLinesRef = useRef<SliceLine[]>([]);
  const fruitIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const isSlicingRef = useRef(false);
  const slicePointsRef = useRef<{ x: number; y: number }[]>([]);
  const lastSliceTimeRef = useRef(0);
  
  // Audio
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSliceSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
      osc.type = 'sawtooth';
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }, [soundEnabled, initAudio]);

  // Spawn fruit
  const spawnFruit = useCallback((canvasWidth: number, canvasHeight: number) => {
    const types: Array<'watermelon' | 'orange' | 'apple' | 'banana'> = ['watermelon', 'orange', 'apple', 'banana'];
    const fruit: Fruit = {
      id: fruitIdRef.current++,
      type: types[Math.floor(Math.random() * types.length)],
      x: 50 + Math.random() * (canvasWidth - 100),
      y: canvasHeight + 50,
      vx: (Math.random() - 0.5) * 4,
      vy: -12 - Math.random() * 6,
      rotation: Math.random() * Math.PI * 2,
      sliced: false,
    };
    
    fruitsRef.current = [...fruitsRef.current, fruit];
  }, []);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    const render = (timestamp: number) => {
      // Kitchen background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#FFE4B5');
      bgGradient.addColorStop(1, '#DEB887');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Counter
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
      
      // Counter texture
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 2;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, canvas.height - 80);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      
      // Spawn fruits during gameplay
      if (gamePhase === 'playing') {
        if (timestamp - lastSpawnRef.current > 1200 + Math.random() * 800) {
          spawnFruit(canvas.width, canvas.height);
          lastSpawnRef.current = timestamp;
        }
      }
      
      // Update and draw fruits
      const gravity = 0.3;
      fruitsRef.current = fruitsRef.current.filter(fruit => {
        if (fruit.sliced) return false;
        
        // Physics
        fruit.vy += gravity;
        fruit.x += fruit.vx;
        fruit.y += fruit.vy;
        fruit.rotation += 0.05;
        
        if (fruit.y > canvas.height + 100) return false;
        
        // Draw fruit
        ctx.save();
        ctx.translate(fruit.x, fruit.y);
        ctx.rotate(fruit.rotation);
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(FRUIT_EMOJIS[fruit.type], 0, 0);
        ctx.restore();
        
        return true;
      });
      
      // Draw slice lines
      sliceLinesRef.current = sliceLinesRef.current.filter(line => {
        line.opacity -= 0.05;
        if (line.opacity <= 0) return false;
        
        if (line.points.length > 1) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${line.opacity})`;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(line.points[0].x, line.points[0].y);
          line.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
          ctx.stroke();
        }
        
        return true;
      });
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    animationRef.current = requestAnimationFrame(render);
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [gamePhase, spawnFruit]);

  // Check slice collision
  const checkSlice = useCallback((points: { x: number; y: number }[]) => {
    if (points.length < 2) return;
    
    const lastTwo = points.slice(-2);
    const p1 = lastTwo[0];
    const p2 = lastTwo[1];
    
    let slicedThisFrame = 0;
    
    fruitsRef.current.forEach(fruit => {
      if (fruit.sliced) return;
      
      // Check if line intersects fruit circle
      const dx = fruit.x - p1.x;
      const dy = fruit.y - p1.y;
      const dx2 = fruit.x - p2.x;
      const dy2 = fruit.y - p2.y;
      
      const dist1 = Math.sqrt(dx * dx + dy * dy);
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      
      if (dist1 < 40 || dist2 < 40) {
        fruit.sliced = true;
        playSliceSound();
        slicedThisFrame++;
        
        const now = Date.now();
        if (now - lastSliceTimeRef.current < 500) {
          setCombo(prev => prev + 1);
        } else {
          setCombo(1);
        }
        lastSliceTimeRef.current = now;
        
        setScore(prev => prev + (combo >= 2 ? 2 : 1));
      }
    });
  }, [combo, playSliceSound]);

  // Handle mouse/touch events
  const handleStart = (clientX: number, clientY: number) => {
    if (gamePhase !== 'playing') return;
    isSlicingRef.current = true;
    slicePointsRef.current = [{ x: clientX, y: clientY }];
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isSlicingRef.current || gamePhase !== 'playing') return;
    
    slicePointsRef.current.push({ x: clientX, y: clientY });
    checkSlice(slicePointsRef.current);
    
    // Update slice line
    if (slicePointsRef.current.length > 10) {
      slicePointsRef.current = slicePointsRef.current.slice(-10);
    }
  };

  const handleEnd = () => {
    if (isSlicingRef.current && slicePointsRef.current.length > 1) {
      sliceLinesRef.current.push({
        id: Date.now(),
        points: [...slicePointsRef.current],
        opacity: 1,
      });
    }
    isSlicingRef.current = false;
    slicePointsRef.current = [];
  };

  // Timer
  useEffect(() => {
    if (gamePhase === 'playing') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGamePhase('gameOver');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [gamePhase]);

  // Start game
  const startGame = useCallback(() => {
    setGamePhase('playing');
    setScore(0);
    setCombo(0);
    setTimeLeft(60);
    fruitsRef.current = [];
    sliceLinesRef.current = [];
    lastSpawnRef.current = 0;
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onTouchStart={(e) => {
          e.preventDefault();
          handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={handleEnd}
        className="absolute inset-0 cursor-crosshair"
      />
      
      {/* Sound toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      
      {/* Menu */}
      {gamePhase === 'menu' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="text-center max-w-md mx-4">
            <div className="text-8xl mb-4 animate-bounce">🍉🍊🍎🍌</div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Fruit Slice Fun
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Swipe to slice the fruits!
            </p>
            
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Slicing! 🔪
            </button>
          </div>
        </div>
      )}
      
      {/* Game HUD */}
      {gamePhase === 'playing' && (
        <>
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-4">
            <div className="bg-white/90 rounded-2xl px-6 py-3 shadow-xl">
              <span className="text-2xl font-bold text-orange-600">⏱️ {timeLeft}s</span>
            </div>
            <div className="bg-white/90 rounded-2xl px-6 py-3 shadow-xl">
              <span className="text-2xl font-bold text-red-600">⭐ {score}</span>
            </div>
          </div>
          
          {combo >= 2 && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-orange-500 rounded-xl px-4 py-2 shadow-lg animate-bounce">
                <span className="text-xl font-bold text-white">🔥 Combo x{combo}!</span>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Game over */}
      {gamePhase === 'gameOver' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4">🏆</div>
            <h2 className="text-5xl font-bold text-white mb-4">Time&apos;s Up!</h2>
            <p className="text-3xl text-yellow-400 mb-6">
              You scored {score} points!
            </p>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg"
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
          className="absolute top-4 left-4 z-20 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm"
        >
          ←
        </button>
      )}
    </main>
  );
}
