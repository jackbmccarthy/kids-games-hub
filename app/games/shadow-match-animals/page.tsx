'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface Animal {
  id: string;
  emoji: string;
  name: string;
  shadow: boolean;
  x: number;
  y: number;
  matched: boolean;
}

type GamePhase = 'menu' | 'matching' | 'complete';

const ANIMALS_DATA = [
  { id: 'elephant', emoji: '🐘', name: 'Elephant' },
  { id: 'giraffe', emoji: '🦒', name: 'Giraffe' },
  { id: 'lion', emoji: '🦁', name: 'Lion' },
  { id: 'zebra', emoji: '🦓', name: 'Zebra' },
];

export default function ShadowMatchAnimals() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [matchedCount, setMatchedCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [score, setScore] = useState(0);
  
  const shadowsRef = useRef<Animal[]>([]);
  const animalsRef = useRef<Animal[]>([]);
  const draggingRef = useRef<Animal | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  
  const playMatchSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, [soundEnabled]);
  
  const initializeGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const shuffled = [...ANIMALS_DATA].sort(() => Math.random() - 0.5);
    
    shadowsRef.current = shuffled.map((animal, i) => ({
      ...animal,
      shadow: true,
      x: canvas.width / 4,
      y: 150 + i * 120,
      matched: false,
    }));
    
    animalsRef.current = shuffled.sort(() => Math.random() - 0.5).map((animal, i) => ({
      ...animal,
      shadow: false,
      x: (canvas.width * 3) / 4,
      y: 150 + i * 120,
      matched: false,
    }));
    
    setMatchedCount(0);
    setScore(0);
    setGamePhase('matching');
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
      // Background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#FFE4C4');
      bgGradient.addColorStop(1, '#F5DEB3');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Dividing line
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 100);
      ctx.lineTo(canvas.width / 2, canvas.height - 100);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Labels
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#8B4513';
      ctx.textAlign = 'center';
      ctx.fillText('Shadows', canvas.width / 4, 60);
      ctx.fillText('Animals', (canvas.width * 3) / 4, 60);
      
      // Draw shadows
      shadowsRef.current.forEach(shadow => {
        ctx.save();
        ctx.translate(shadow.x, shadow.y);
        
        if (shadow.matched) {
          ctx.globalAlpha = 0.3;
        }
        
        // Shadow outline
        ctx.font = '70px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = shadow.matched ? '#90EE90' : '#333';
        ctx.fillText(shadow.emoji, 0, 0);
        
        if (!shadow.matched) {
          // Add shadow effect
          ctx.filter = 'blur(2px)';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillText(shadow.emoji, 3, 3);
          ctx.filter = 'none';
        }
        
        ctx.restore();
      });
      
      // Draw animals
      animalsRef.current.forEach(animal => {
        if (animal.matched) return;
        
        ctx.font = '70px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(animal.emoji, animal.x, animal.y);
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
    
    for (const animal of animalsRef.current) {
      if (animal.matched) continue;
      
      const dx = x - animal.x;
      const dy = y - animal.y;
      if (Math.sqrt(dx * dx + dy * dy) < 40) {
        draggingRef.current = animal;
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
    const drag = draggingRef.current;
    if (!drag) return;
    
    for (const shadow of shadowsRef.current) {
      if (shadow.matched) continue;
      if (shadow.id !== drag.id) continue;
      
      const dx = drag.x - shadow.x;
      const dy = drag.y - shadow.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 60) {
        shadow.matched = true;
        drag.matched = true;
        playMatchSound();
        setScore(prev => prev + 25);
        setMatchedCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 4) {
            setTimeout(() => setGamePhase('complete'), 500);
          }
          return newCount;
        });
        break;
      }
    }
    
    draggingRef.current = null;
  };
  
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
            <div className="text-8xl mb-4 animate-bounce">🐘🦒🦁🦓</div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Shadow Match
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Match animals to their shadows!
            </p>
            
            <button
              onClick={initializeGame}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Matching! 🎭
            </button>
          </div>
        </div>
      )}
      
      {gamePhase === 'matching' && (
        <>
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/90 rounded-2xl px-6 py-3 shadow-xl">
            <span className="text-2xl font-bold text-amber-600">
              Matched: {matchedCount}/4 | ⭐ {score}
            </span>
          </div>
        </>
      )}
      
      {gamePhase === 'complete' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-5xl font-bold text-white mb-4">Perfect!</h2>
            <p className="text-3xl text-yellow-400 mb-6">Score: {score}</p>
            <button
              onClick={initializeGame}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg"
            >
              Match Again
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
