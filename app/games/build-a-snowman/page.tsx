"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

type GamePhase = 'menu' | 'building' | 'complete';

interface SnowmanPart {
  id: string;
  x: number;
  y: number;
  type: 'ball' | 'hat' | 'scarf' | 'carrot' | 'buttons' | 'sticks';
  placed: boolean;
}

export default function BuildASnowman() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [snowmanComplete, setSnowmanComplete] = useState(false);
  
  const partsRef = useRef<SnowmanPart[]>([]);
  const draggingRef = useRef<SnowmanPart | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const snowmanRef = useRef({ x: 0, y: 0, balls: [] as number[] });
  
  // Initialize game
  const initializeGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    snowmanRef.current = {
      x: canvas.width / 2,
      y: canvas.height * 0.6,
      balls: []
    };
    
    partsRef.current = [
      { id: 'ball1', x: 100, y: canvas.height - 120, type: 'ball', placed: false },
      { id: 'ball2', x: 150, y: canvas.height - 120, type: 'ball', placed: false },
      { id: 'ball3', x: 200, y: canvas.height - 120, type: 'ball', placed: false },
      { id: 'hat', x: 280, y: canvas.height - 100, type: 'hat', placed: false },
      { id: 'scarf', x: 350, y: canvas.height - 100, type: 'scarf', placed: false },
      { id: 'carrot', x: 420, y: canvas.height - 100, type: 'carrot', placed: false },
      { id: 'buttons', x: 500, y: canvas.height - 100, type: 'buttons', placed: false },
      { id: 'sticks', x: 580, y: canvas.height - 100, type: 'sticks', placed: false },
    ];
    
    setSnowmanComplete(false);
    setGamePhase('building');
  }, []);
  
  // Canvas rendering
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
      // Sky gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#4A90E2');
      bgGradient.addColorStop(1, '#B8D4E8');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Snow ground
      ctx.fillStyle = 'white';
      ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
      
      // Snowflakes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (let i = 0; i < 50; i++) {
        const x = (i * 37 + Date.now() * 0.02) % canvas.width;
        const y = (i * 23 + Date.now() * 0.03) % canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw placed snowman balls
      const sm = snowmanRef.current;
      if (sm.balls.length >= 1) {
        // Bottom ball
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(sm.x, sm.y + 80, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#D3D3D3';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      if (sm.balls.length >= 2) {
        // Middle ball
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(sm.x, sm.y, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      
      if (sm.balls.length >= 3) {
        // Head
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(sm.x, sm.y - 70, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      
      // Draw parts
      partsRef.current.forEach(part => {
        if (part.placed) return;
        
        ctx.save();
        
        if (part.type === 'ball') {
          ctx.fillStyle = 'white';
          ctx.strokeStyle = '#D3D3D3';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(part.x, part.y, 40, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (part.type === 'hat') {
          // Top hat
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(part.x - 25, part.y - 30, 50, 30);
          ctx.fillRect(part.x - 35, part.y, 70, 8);
        } else if (part.type === 'scarf') {
          // Scarf
          ctx.fillStyle = '#FF6B6B';
          ctx.fillRect(part.x - 30, part.y, 60, 10);
          ctx.fillRect(part.x + 10, part.y, 15, 40);
        } else if (part.type === 'carrot') {
          // Carrot nose
          ctx.fillStyle = '#FF8C00';
          ctx.beginPath();
          ctx.moveTo(part.x, part.y);
          ctx.lineTo(part.x + 30, part.y + 8);
          ctx.lineTo(part.x, part.y + 16);
          ctx.closePath();
          ctx.fill();
        } else if (part.type === 'buttons') {
          // Buttons
          ctx.fillStyle = '#333';
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(part.x, part.y + i * 20, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (part.type === 'sticks') {
          // Arm sticks
          ctx.strokeStyle = '#8B4513';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(part.x, part.y);
          ctx.lineTo(part.x - 60, part.y - 30);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(part.x + 40, part.y);
          ctx.lineTo(part.x + 100, part.y - 30);
          ctx.stroke();
        }
        
        ctx.restore();
      });
      
      requestAnimationFrame(render);
    };
    
    render();
    
    return () => window.removeEventListener('resize', resize);
  }, []);
  
  // Handle interactions
  const handleStart = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || gamePhase !== 'building') return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    for (let i = partsRef.current.length - 1; i >= 0; i--) {
      const part = partsRef.current[i];
      if (part.placed) continue;
      
      const dx = x - part.x;
      const dy = y - part.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40) {
        draggingRef.current = part;
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
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const drag = draggingRef.current;
    if (drag) {
      drag.x = x - dragOffsetRef.current.x;
      drag.y = y - dragOffsetRef.current.y;
    }
  };
  
  const handleEnd = () => {
    const drag = draggingRef.current;
    if (!drag) return;
    
    const sm = snowmanRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if close to snowman
    const dx = drag.x - sm.x;
    const dy = drag.y - sm.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 150) {
      if (drag.type === 'ball' && sm.balls.length < 3) {
        sm.balls.push(sm.balls.length);
        drag.placed = true;
      } else if (drag.type !== 'ball' && sm.balls.length === 3) {
        drag.placed = true;
      }
      
      // Check if complete
      const allPlaced = partsRef.current.every(p => p.placed);
      if (allPlaced) {
        setSnowmanComplete(true);
        setGamePhase('complete');
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
      
      {/* Menu */}
      {gamePhase === 'menu' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="text-center max-w-md mx-4">
            <div className="text-8xl mb-4 animate-bounce">⛄</div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Build a Snowman
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Drag parts to build your snowman!
            </p>
            
            <button
              onClick={initializeGame}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Building! ☃️
            </button>
          </div>
        </div>
      )}
      
      {/* Complete overlay */}
      {gamePhase === 'complete' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-5xl font-bold text-white mb-4">Perfect!</h2>
            <p className="text-2xl text-white/90 mb-6">
              You built a beautiful snowman!
            </p>
            <button
              onClick={initializeGame}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg"
            >
              Build Another
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
