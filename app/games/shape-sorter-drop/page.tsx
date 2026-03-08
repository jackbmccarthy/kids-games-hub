'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Types
interface Shape {
  id: number;
  type: 'circle' | 'square' | 'triangle' | 'star' | 'heart';
  x: number;
  y: number;
  rotation: number;
  targetHole: number;
  isDragging: boolean;
  isPlaced: boolean;
}

interface Hole {
  type: 'circle' | 'square' | 'triangle' | 'star' | 'heart';
  x: number;
  y: number;
  filled: boolean;
}

type GamePhase = 'menu' | 'playing' | 'levelComplete' | 'paused';

const SHAPE_TYPES: Array<'circle' | 'square' | 'triangle' | 'star' | 'heart'> = 
  ['circle', 'square', 'triangle', 'star', 'heart'];

const SHAPE_COLORS: Record<string, string> = {
  circle: '#FF6B6B',
  square: '#4ECDC4',
  triangle: '#FFE66D',
  star: '#F38181',
  heart: '#AA96DA',
};

export default function ShapeSorterDrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Game state
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [shapesSorted, setShapesSorted] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Animation refs
  const shapesRef = useRef<Shape[]>([]);
  const holesRef = useRef<Hole[]>([]);
  const draggingRef = useRef<Shape | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  
  // Audio
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playChime = useCallback((type: string) => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const frequencies: Record<string, number> = {
        circle: 523.25,
        square: 587.33,
        triangle: 659.25,
        star: 698.46,
        heart: 783.99,
      };
      
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(frequencies[type] || 523.25, ctx.currentTime);
      oscillator.type = 'sine';
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch {}
  }, [soundEnabled, initAudio]);

  const playErrorSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.type = 'sawtooth';
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch {}
  }, [soundEnabled, initAudio]);

  const playSuccessSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const notes = [523.25, 659.25, 783.99];
      
      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);
        
        oscillator.start(ctx.currentTime + i * 0.1);
        oscillator.stop(ctx.currentTime + i * 0.1 + 0.3);
      });
    } catch {}
  }, [soundEnabled, initAudio]);

  // Initialize holes
  const initializeHoles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const holes: Hole[] = [];
    const spacing = canvas.width / (SHAPE_TYPES.length + 1);
    
    SHAPE_TYPES.forEach((type, i) => {
      holes.push({
        type,
        x: spacing * (i + 1),
        y: canvas.height - 100,
        filled: false,
      });
    });
    
    holesRef.current = holes;
  }, []);

  // Spawn shape
  const spawnShape = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const typeIndex = Math.floor(Math.random() * SHAPE_TYPES.length);
    const type = SHAPE_TYPES[typeIndex];
    
    const shape: Shape = {
      id: Date.now(),
      type,
      x: 100 + Math.random() * (canvas.width - 200),
      y: -50,
      rotation: 0,
      targetHole: typeIndex,
      isDragging: false,
      isPlaced: false,
    };
    
    shapesRef.current = [...shapesRef.current, shape];
  }, []);

  // Draw shape
  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape, size: number = 60) => {
    ctx.save();
    ctx.translate(shape.x, shape.y);
    ctx.rotate(shape.rotation);
    ctx.fillStyle = SHAPE_COLORS[shape.type];
    
    ctx.beginPath();
    
    switch (shape.type) {
      case 'circle':
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        break;
        
      case 'square':
        ctx.rect(-size / 2, -size / 2, size, size);
        break;
        
      case 'triangle':
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(size / 2, size / 2);
        ctx.lineTo(-size / 2, size / 2);
        ctx.closePath();
        break;
        
      case 'star':
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const x = Math.cos(angle) * (size / 2);
          const y = Math.sin(angle) * (size / 2);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
        
      case 'heart':
        ctx.moveTo(0, -size / 4);
        ctx.bezierCurveTo(size / 2, -size / 2, size / 2, size / 4, 0, size / 2);
        ctx.bezierCurveTo(-size / 2, size / 4, -size / 2, -size / 2, 0, -size / 4);
        break;
    }
    
    ctx.fill();
    ctx.restore();
  };

  // Draw hole
  const drawHole = (ctx: CanvasRenderingContext2D, hole: Hole, isGlowing: boolean = false) => {
    ctx.save();
    ctx.translate(hole.x, hole.y);
    
    // Glow effect
    if (isGlowing) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20;
    }
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 10, 35, 0, Math.PI * 2);
    ctx.fill();
    
    // Outline
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(139, 69, 19, 0.2)';
    
    ctx.beginPath();
    switch (hole.type) {
      case 'circle':
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        break;
      case 'square':
        ctx.rect(-30, -30, 60, 60);
        break;
      case 'triangle':
        ctx.moveTo(0, -30);
        ctx.lineTo(30, 30);
        ctx.lineTo(-30, 30);
        ctx.closePath();
        break;
      case 'star':
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const x = Math.cos(angle) * 30;
          const y = Math.sin(angle) * 30;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        break;
      case 'heart':
        ctx.moveTo(0, -15);
        ctx.bezierCurveTo(30, -30, 30, 15, 0, 30);
        ctx.bezierCurveTo(-30, 15, -30, -30, 0, -15);
        break;
    }
    
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeHoles();
    };
    resize();
    window.addEventListener('resize', resize);
    
    let lastSpawn = 0;
    const spawnInterval = 2000 - (level * 100);
    
    const render = (timestamp: number) => {
      // Background - wooden texture
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#DEB887');
      bgGradient.addColorStop(0.5, '#D2B48C');
      bgGradient.addColorStop(1, '#BC8F8F');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Wood grain texture
      ctx.strokeStyle = 'rgba(139, 69, 19, 0.1)';
      ctx.lineWidth = 2;
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i + Math.sin(i * 0.05) * 5);
        ctx.lineTo(canvas.width, i + Math.sin(i * 0.05 + 1) * 5);
        ctx.stroke();
      }
      
      // Draw holes
      holesRef.current.forEach(hole => {
        const isGlowing = !!(draggingRef.current && draggingRef.current.type === hole.type);
        drawHole(ctx, hole, isGlowing);
      });
      
      // Spawn shapes during gameplay
      if (gamePhase === 'playing') {
        if (timestamp - lastSpawn > spawnInterval && shapesRef.current.filter(s => !s.isPlaced).length < 5) {
          spawnShape();
          lastSpawn = timestamp;
        }
      }
      
      // Update and draw shapes
      shapesRef.current = shapesRef.current.filter(shape => {
        if (shape.isPlaced) return false;
        
        if (!shape.isDragging) {
          shape.y += 1 + level * 0.2;
          shape.rotation += 0.02;
        }
        
        if (shape.y > canvas.height + 100) {
          return false;
        }
        
        drawShape(ctx, shape);
        return true;
      });
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    animationRef.current = requestAnimationFrame(render);
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [gamePhase, level, initializeHoles, spawnShape]);

  // Handle mouse/touch
  const handleStart = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Find shape under cursor (reverse order for top-most)
    for (let i = shapesRef.current.length - 1; i >= 0; i--) {
      const shape = shapesRef.current[i];
      const dx = x - shape.x;
      const dy = y - shape.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 40 && !shape.isPlaced) {
        shape.isDragging = true;
        draggingRef.current = shape;
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
    
    draggingRef.current.x = x - dragOffsetRef.current.x;
    draggingRef.current.y = y - dragOffsetRef.current.y;
  };

  const handleEnd = () => {
    if (!draggingRef.current) return;
    
    const shape = draggingRef.current;
    shape.isDragging = false;
    
    // Check if dropped on correct hole
    const hole = holesRef.current.find(h => h.type === shape.type);
    if (hole) {
      const dx = shape.x - hole.x;
      const dy = shape.y - hole.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 50) {
        // Correct placement
        playChime(shape.type);
        setScore(prev => prev + 10);
        setShapesSorted(prev => {
          const newCount = prev + 1;
          if (newCount >= 10) {
            playSuccessSound();
            setGamePhase('levelComplete');
          }
          return newCount;
        });
        shape.isPlaced = true;
        shapesRef.current = shapesRef.current.filter(s => s.id !== shape.id);
      } else {
        // Wrong placement - check if dropped on any hole
        const anyHole = holesRef.current.find(h => {
          const dx = shape.x - h.x;
          const dy = shape.y - h.y;
          return Math.sqrt(dx * dx + dy * dy) < 50;
        });
        
        if (anyHole && anyHole.type !== shape.type) {
          playErrorSound();
        }
      }
    }
    
    draggingRef.current = null;
  };

  // Start game
  const startGame = useCallback(() => {
    setGamePhase('playing');
    setShapesSorted(0);
    shapesRef.current = [];
    initializeHoles();
  }, [initializeHoles]);

  // Next level
  const nextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    startGame();
  }, [startGame]);

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
          const touch = e.touches[0];
          handleStart(touch.clientX, touch.clientY);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleMove(touch.clientX, touch.clientY);
        }}
        onTouchEnd={handleEnd}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      />
      
      {/* Sound toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full text-xl backdrop-blur-sm"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      
      {/* Menu overlay */}
      {gamePhase === 'menu' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="text-center max-w-md mx-4">
            <div className="text-8xl mb-4">🔷</div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Shape Sorter Drop
            </h1>
            <p className="text-xl text-amber-100 mb-8">
              Drag shapes to their matching holes!
            </p>
            
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Playing! 🔷
            </button>
          </div>
        </div>
      )}
      
      {/* Game HUD */}
      {gamePhase === 'playing' && (
        <>
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-4">
            <div className="bg-white/20 rounded-2xl px-6 py-3 backdrop-blur-sm">
              <span className="text-2xl font-bold text-white">Level {level}</span>
            </div>
            <div className="bg-white/20 rounded-2xl px-6 py-3 backdrop-blur-sm">
              <span className="text-2xl font-bold text-white">⭐ {score}</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-white/20 rounded-full h-4 w-64 backdrop-blur-sm overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all duration-300"
                style={{ width: `${(shapesSorted / 10) * 100}%` }}
              />
            </div>
            <p className="text-center text-white mt-2">{shapesSorted}/10 shapes</p>
          </div>
        </>
      )}
      
      {/* Level complete overlay */}
      {gamePhase === 'levelComplete' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-5xl font-bold text-white mb-4">
              Level {level} Complete!
            </h2>
            <p className="text-3xl text-yellow-400 mb-6">Score: {score}</p>
            <button
              onClick={nextLevel}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg"
            >
              Next Level →
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
