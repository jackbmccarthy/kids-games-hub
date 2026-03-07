'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Splat {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  droplets: { x: number; y: number; size: number }[];
}

interface Drip {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  opacity: number;
}

type GamePhase = 'menu' | 'painting' | 'clearing';

const RAINBOW_COLORS = [
  '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF', '#FF1493', '#00FFFF'
];

export default function RainbowPaintTap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [colorIndex, setColorIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [clearConfirm, setClearConfirm] = useState(false);
  
  const splatsRef = useRef<Splat[]>([]);
  const dripsRef = useRef<Drip[]>([]);
  const splatIdRef = useRef(0);
  const dripIdRef = useRef(0);
  
  // Audio
  const playSplatSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(200 + Math.random() * 100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }, [soundEnabled]);
  
  // Canvas setup and render
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
      // Canvas background with slight texture
      ctx.fillStyle = '#FEFEFE';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Subtle texture
      ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
      for (let i = 0; i < 100; i++) {
        ctx.fillRect(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          1,
          1
        );
      }
      
      // Draw all splats
      splatsRef.current.forEach(splat => {
        // Main splat
        const gradient = ctx.createRadialGradient(
          splat.x, splat.y, 0,
          splat.x, splat.y, splat.size
        );
        gradient.addColorStop(0, splat.color);
        gradient.addColorStop(0.7, splat.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(splat.x, splat.y, splat.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Droplets
        splat.droplets.forEach(drop => {
          ctx.fillStyle = splat.color;
          ctx.beginPath();
          ctx.arc(drop.x, drop.y, drop.size, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      
      // Draw and update drips
      dripsRef.current = dripsRef.current.filter(drip => {
        drip.y += 0.5;
        drip.opacity -= 0.002;
        
        if (drip.opacity <= 0) return false;
        
        ctx.fillStyle = drip.color;
        ctx.globalAlpha = drip.opacity;
        ctx.beginPath();
        ctx.ellipse(drip.x, drip.y, drip.size / 3, drip.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        return drip.y < canvas.height + 50;
      });
      
      animFrame = requestAnimationFrame(render);
    };
    
    animFrame = requestAnimationFrame(render);
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrame);
    };
  }, []);
  
  // Handle tap/click
  const handleCanvasInteraction = (clientX: number, clientY: number) => {
    if (gamePhase !== 'painting') return;
    
    playSplatSound();
    
    const color = RAINBOW_COLORS[colorIndex];
    const size = 30 + Math.random() * 40;
    
    // Create droplets
    const dropletCount = 5 + Math.floor(Math.random() * 6);
    const droplets = Array.from({ length: dropletCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = size * 0.5 + Math.random() * size * 0.8;
      return {
        x: clientX + Math.cos(angle) * distance,
        y: clientY + Math.sin(angle) * distance,
        size: 3 + Math.random() * 8,
      };
    });
    
    // Add splat
    splatsRef.current.push({
      id: splatIdRef.current++,
      x: clientX,
      y: clientY,
      color,
      size,
      droplets,
    });
    
    // Add drips
    for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
      dripsRef.current.push({
        id: dripIdRef.current++,
        x: clientX + (Math.random() - 0.5) * size,
        y: clientY + size,
        color,
        size: 2 + Math.random() * 4,
        opacity: 0.8,
      });
    }
    
    // Cycle through rainbow colors
    setColorIndex(prev => (prev + 1) % RAINBOW_COLORS.length);
  };
  
  // Clear canvas
  const clearCanvas = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 2000);
      return;
    }
    
    splatsRef.current = [];
    dripsRef.current = [];
    setClearConfirm(false);
  };
  
  // Start painting
  const startPainting = () => {
    setGamePhase('painting');
    splatsRef.current = [];
    dripsRef.current = [];
    setColorIndex(0);
  };
  
  // Save canvas
  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `rainbow-painting-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-gray-100">
      <canvas
        ref={canvasRef}
        onClick={(e) => handleCanvasInteraction(e.clientX, e.clientY)}
        onMouseMove={(e) => {
          if (e.buttons === 1) {
            handleCanvasInteraction(e.clientX, e.clientY);
          }
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleCanvasInteraction(touch.clientX, touch.clientY);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleCanvasInteraction(touch.clientX, touch.clientY);
        }}
        className="absolute inset-0 cursor-crosshair"
      />
      
      {/* Sound toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 z-20 bg-white/80 hover:bg-white text-gray-700 p-3 rounded-full text-xl shadow-lg"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      
      {/* Menu */}
      {gamePhase === 'menu' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400">
          <div className="text-center max-w-md mx-4 bg-white/90 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
            <div className="text-8xl mb-4 animate-bounce">🎨</div>
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Rainbow Paint Tap
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Tap or drag to splatter colorful paint!
            </p>
            
            <button
              onClick={startPainting}
              className="bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Painting! 🎨
            </button>
          </div>
        </div>
      )}
      
      {/* Controls */}
      {gamePhase === 'painting' && (
        <>
          {/* Current color indicator */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-3 bg-white/90 rounded-full px-6 py-3 shadow-lg">
            <div
              className="w-8 h-8 rounded-full border-4 border-white shadow-md"
              style={{ backgroundColor: RAINBOW_COLORS[colorIndex] }}
            />
            <span className="text-lg font-semibold text-gray-700">Tap to paint!</span>
          </div>
          
          {/* Action buttons */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex gap-4">
            <button
              onClick={clearCanvas}
              className={`px-6 py-3 rounded-full font-bold text-lg shadow-lg transition-all ${
                clearConfirm
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-white/80 hover:bg-white text-gray-700'
              }`}
            >
              {clearConfirm ? 'Tap Again to Clear!' : '🗑️ Clear'}
            </button>
            
            <button
              onClick={saveCanvas}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg transition-all"
            >
              💾 Save
            </button>
          </div>
          
          {/* Back button */}
          <button
            onClick={() => setGamePhase('menu')}
            className="absolute top-4 left-4 z-20 bg-white/80 hover:bg-white text-gray-700 p-3 rounded-full shadow-lg"
          >
            ←
          </button>
        </>
      )}
    </main>
  );
}
