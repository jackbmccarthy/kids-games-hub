'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface Animal {
  id: string;
  emoji: string;
  food: string;
  x: number;
  y: number;
  fed: boolean;
}

interface Food {
  id: string;
  emoji: string;
  x: number;
  y: number;
  dragging: boolean;
}

type GamePhase = 'menu' | 'feeding' | 'complete';

const ANIMALS_DATA = [
  { id: 'cow', emoji: '🐄', food: 'grass' },
  { id: 'rabbit', emoji: '🐰', food: 'carrot' },
  { id: 'monkey', emoji: '🐵', food: 'banana' },
  { id: 'bird', emoji: '🐦', food: 'seeds' },
];

const FOODS_DATA: Record<string, string> = {
  grass: '🌿',
  carrot: '🥕',
  banana: '🍌',
  seeds: '🌾',
};

export default function FeedTheAnimals() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [fedCount, setFedCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const animalsRef = useRef<Animal[]>([]);
  const foodsRef = useRef<Food[]>([]);
  const draggingRef = useRef<Food | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  
  const playChompSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.type = 'square';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }, [soundEnabled]);
  
  const initializeGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const spacing = canvas.width / 5;
    animalsRef.current = ANIMALS_DATA.map((data, i) => ({
      ...data,
      x: spacing * (i + 1),
      y: canvas.height * 0.4,
      fed: false,
    }));
    
    const foodSpacing = canvas.width / 5;
    foodsRef.current = ANIMALS_DATA.map((data, i) => ({
      id: data.food,
      emoji: FOODS_DATA[data.food],
      x: foodSpacing * (i + 1),
      y: canvas.height - 80,
      dragging: false,
    }));
    
    setFedCount(0);
    setGamePhase('feeding');
  }, []);
  
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
    
    const render = () => {
      // Farm background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#87CEEB');
      bgGradient.addColorStop(0.6, '#90EE90');
      bgGradient.addColorStop(1, '#228B22');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw animals
      animalsRef.current.forEach(animal => {
        ctx.font = '80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(animal.emoji, animal.x, animal.y);
        
        if (animal.fed) {
          ctx.font = '30px Arial';
          ctx.fillText('✓', animal.x + 40, animal.y - 40);
        }
      });
      
      // Draw foods
      foodsRef.current.forEach(food => {
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(food.emoji, food.x, food.y);
      });
      
      requestAnimationFrame(render);
    };
    
    render();
    
    return () => window.removeEventListener('resize', resize);
  }, []);
  
  const handleStart = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    for (const food of foodsRef.current) {
      const dx = x - food.x;
      const dy = y - food.y;
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        draggingRef.current = food;
        dragOffsetRef.current = { x: dx, y: dy };
        break;
      }
    }
  };
  
  const handleMove = (clientX: number, clientY: number) => {
    if (!draggingRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    draggingRef.current.x = clientX - rect.left - dragOffsetRef.current.x;
    draggingRef.current.y = clientY - rect.top - dragOffsetRef.current.y;
  };
  
  const handleEnd = () => {
    if (!draggingRef.current) return;
    
    const food = draggingRef.current;
    
    for (const animal of animalsRef.current) {
      const dx = food.x - animal.x;
      const dy = food.y - animal.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 60 && food.id === animal.food && !animal.fed) {
        animal.fed = true;
        playChompSound();
        setFedCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 4) {
            setTimeout(() => setGamePhase('complete'), 500);
          }
          return newCount;
        });
        // Reset food position
        const canvas = canvasRef.current;
        if (canvas) {
          const index = foodsRef.current.findIndex(f => f.id === food.id);
          if (index >= 0) {
            foodsRef.current[index].x = (canvas.width / 5) * (index + 1);
            foodsRef.current[index].y = canvas.height - 80;
          }
        }
        break;
      }
    }
    
    draggingRef.current = null;
  };
  
  return (
    <main className="fixed inset-0 overflow-hidden overscroll-none">
      {/* Prevent body scroll on mobile */}
      <style jsx global>{`
        body { overflow: hidden; overscroll-behavior: none; }
      `}</style>
      
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
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />
      
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      
      {gamePhase === 'menu' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="text-center max-w-md mx-4">
            <div className="text-8xl mb-4 animate-bounce">🐄🐰🐵🐦</div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Feed the Animals
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Drag food to the hungry animals!
            </p>
            
            <button
              onClick={initializeGame}
              className="bg-gradient-to-r from-green-500 to-lime-600 hover:from-green-600 hover:to-lime-700 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Feeding! 🌿
            </button>
          </div>
        </div>
      )}
      
      {gamePhase === 'feeding' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/90 rounded-2xl px-6 py-3 shadow-xl">
          <span className="text-2xl font-bold text-green-600">
            Fed: {fedCount}/4 🍽️
          </span>
        </div>
      )}
      
      {gamePhase === 'complete' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-5xl font-bold text-white mb-4">All Fed!</h2>
            <p className="text-2xl text-white/90 mb-6">
              Great job taking care of the animals!
            </p>
            <button
              onClick={initializeGame}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg"
            >
              Feed Again
            </button>
          </div>
        </div>
      )}
      
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
