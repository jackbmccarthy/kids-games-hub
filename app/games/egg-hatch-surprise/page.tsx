'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface Egg {
  id: number;
  x: number;
  y: number;
  taps: number;
  maxTaps: number;
  pattern: string;
  cracked: boolean;
  hatched: boolean;
  animal: string;
}

type GamePhase = 'menu' | 'hatching' | 'complete';

const ANIMALS = ['🐣', '🐥', '🐶', '🐱', '🐰'];
const PATTERNS = ['🔵🔵🔵', '🔴🔴🔴', '🟡🟡🟡', '🟢🟢🟢', '🟣🟣🟣'];

export default function EggHatchSurprise() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [hatchedCount, setHatchedCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const eggsRef = useRef<Egg[]>([]);
  const animFrameRef = useRef<number>(0);
  
  // Audio
  const playCrackSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }, [soundEnabled]);
  
  const playHatchSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.2);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.2);
      });
    } catch {}
  }, [soundEnabled]);
  
  // Initialize game
  const initializeGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const spacing = canvas.width / 6;
    eggsRef.current = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: spacing * (i + 1),
      y: canvas.height / 2,
      taps: 0,
      maxTaps: 3 + Math.floor(Math.random() * 3),
      pattern: PATTERNS[i % PATTERNS.length],
      cracked: false,
      hatched: false,
      animal: ANIMALS[i % ANIMALS.length],
    }));
    
    setHatchedCount(0);
    setGamePhase('hatching');
  }, []);
  
  // Canvas render
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
      // Nest background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#8B4513');
      bgGradient.addColorStop(1, '#D2691E');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Straw texture
      ctx.strokeStyle = 'rgba(255, 220, 150, 0.3)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 100; i++) {
        const x = (i * 37) % canvas.width;
        const y = (i * 23) % canvas.height;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 20, y + 5);
        ctx.stroke();
      }
      
      // Draw eggs
      eggsRef.current.forEach(egg => {
        ctx.save();
        ctx.translate(egg.x, egg.y);
        
        if (!egg.hatched) {
          // Egg shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.beginPath();
          ctx.ellipse(0, 50, 35, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Egg body
          const eggGradient = ctx.createRadialGradient(-15, -20, 0, 0, 0, 50);
          eggGradient.addColorStop(0, '#FFFEF0');
          eggGradient.addColorStop(1, '#F5E6D3');
          ctx.fillStyle = eggGradient;
          ctx.beginPath();
          ctx.ellipse(0, 0, 35, 45, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Cracks
          if (egg.cracked) {
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            const cracks = egg.taps;
            for (let i = 0; i < cracks; i++) {
              const angle = (i / cracks) * Math.PI * 2;
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(Math.cos(angle) * 30, Math.sin(angle) * 30);
              ctx.stroke();
            }
          }
          
          // Pattern dots
          ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(-10 + i * 5, -20, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Hatched animal
          ctx.font = '60px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(egg.animal, 0, 0);
        }
        
        ctx.restore();
      });
      
      animFrameRef.current = requestAnimationFrame(render);
    };
    
    animFrameRef.current = requestAnimationFrame(render);
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);
  
  // Handle tap
  const handleTap = (clientX: number, clientY: number) => {
    if (gamePhase !== 'hatching') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    eggsRef.current.forEach(egg => {
      if (egg.hatched) return;
      
      const dx = x - egg.x;
      const dy = y - egg.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 45) {
        egg.taps++;
        egg.cracked = true;
        playCrackSound();
        
        if (egg.taps >= egg.maxTaps) {
          egg.hatched = true;
          playHatchSound();
          setHatchedCount(prev => {
            const newCount = prev + 1;
            if (newCount >= 5) {
              setTimeout(() => setGamePhase('complete'), 1000);
            }
            return newCount;
          });
        }
      }
    });
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
            <div className="text-8xl mb-4 animate-bounce">🥚</div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Egg Hatch Surprise
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Tap eggs to hatch cute baby animals!
            </p>
            
            <button
              onClick={initializeGame}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Hatching! 🐣
            </button>
          </div>
        </div>
      )}
      
      {/* HUD */}
      {gamePhase === 'hatching' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/90 rounded-2xl px-6 py-3 shadow-xl">
          <span className="text-2xl font-bold text-orange-600">
            Hatched: {hatchedCount}/5 🐣
          </span>
        </div>
      )}
      
      {/* Complete */}
      {gamePhase === 'complete' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-5xl font-bold text-white mb-4">All Hatched!</h2>
            <div className="text-6xl mb-6">
              {eggsRef.current.map(e => e.animal).join(' ')}
            </div>
            <button
              onClick={initializeGame}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg"
            >
              Hatch Again
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
