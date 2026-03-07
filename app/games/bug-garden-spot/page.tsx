'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface Bug {
  id: number;
  type: string;
  emoji: string;
  x: number;
  y: number;
  found: boolean;
}

type GamePhase = 'menu' | 'searching' | 'complete';

const BUG_TYPES = [
  { type: 'butterfly', emoji: '🦋' },
  { type: 'ladybug', emoji: '🐞' },
  { type: 'bee', emoji: '🐝' },
  { type: 'caterpillar', emoji: '🐛' },
  { type: 'snail', emoji: '🐌' },
  { type: 'dragonfly', emoji: '🪰' },
  { type: 'ant', emoji: '🐜' },
  { type: 'spider', emoji: '🕷️' },
];

export default function BugGardenSpot() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [foundCount, setFoundCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const bugsRef = useRef<Bug[]>([]);
  const timeRef = useRef(0);
  
  const playFoundSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
  }, [soundEnabled]);
  
  const initializeGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    bugsRef.current = BUG_TYPES.map((bug, i) => ({
      id: i,
      ...bug,
      x: 80 + Math.random() * (canvas.width - 160),
      y: 120 + Math.random() * (canvas.height - 240),
      found: false,
    }));
    
    setFoundCount(0);
    setGamePhase('searching');
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
    
    let animFrame: number;
    
    const render = () => {
      timeRef.current += 0.016;
      
      // Garden background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#87CEEB');
      bgGradient.addColorStop(0.4, '#90EE90');
      bgGradient.addColorStop(1, '#228B22');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Flowers
      const flowers = ['🌸', '🌼', '🌺', '🌻', '🌷', '💐'];
      ctx.font = '40px Arial';
      for (let i = 0; i < 20; i++) {
        const x = (i * 73 + 50) % canvas.width;
        const y = canvas.height * 0.5 + Math.sin(i * 1.5) * 100;
        ctx.fillText(flowers[i % flowers.length], x, y);
      }
      
      // Draw bugs
      bugsRef.current.forEach(bug => {
        if (bug.found) return;
        
        // Shimmer effect
        const shimmer = Math.sin(timeRef.current * 2 + bug.id) > 0.7;
        ctx.globalAlpha = shimmer ? 1 : 0.3;
        
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bug.emoji, bug.x, bug.y);
        
        ctx.globalAlpha = 1;
      });
      
      animFrame = requestAnimationFrame(render);
    };
    
    animFrame = requestAnimationFrame(render);
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrame);
    };
  }, []);
  
  const handleTap = (clientX: number, clientY: number) => {
    if (gamePhase !== 'searching') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    for (const bug of bugsRef.current) {
      if (bug.found) continue;
      
      const dx = x - bug.x;
      const dy = y - bug.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 30) {
        bug.found = true;
        playFoundSound();
        setFoundCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 8) {
            setTimeout(() => setGamePhase('complete'), 500);
          }
          return newCount;
        });
        break;
      }
    }
  };
  
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        onClick={(e) => handleTap(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          e.preventDefault();
          handleTap(e.touches[0].clientX, e.touches[0].clientY);
        }}
        className="absolute inset-0 cursor-pointer"
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
            <div className="text-8xl mb-4 animate-bounce">🦋🐞🐝</div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Bug Garden Spot
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Find all the hidden bugs in the garden!
            </p>
            
            <button
              onClick={initializeGame}
              className="bg-gradient-to-r from-green-500 to-lime-600 hover:from-green-600 hover:to-lime-700 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Searching! 🌿
            </button>
          </div>
        </div>
      )}
      
      {gamePhase === 'searching' && (
        <>
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/90 rounded-2xl px-6 py-3 shadow-xl">
            <span className="text-2xl font-bold text-green-600">
              Found: {foundCount}/8 🐛
            </span>
          </div>
          
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex gap-3 flex-wrap justify-center max-w-md">
            {bugsRef.current.filter(b => b.found).map(bug => (
              <div key={bug.id} className="text-4xl animate-bounce">
                {bug.emoji}
              </div>
            ))}
          </div>
        </>
      )}
      
      {gamePhase === 'complete' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-5xl font-bold text-white mb-4">All Found!</h2>
            <div className="text-6xl mb-6">
              {bugsRef.current.map(b => b.emoji).join(' ')}
            </div>
            <button
              onClick={initializeGame}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg"
            >
              Search Again
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
