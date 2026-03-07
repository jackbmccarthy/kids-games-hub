'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Mole {
  id: number;
  holeIndex: number;
  visible: boolean;
  showTime: number;
}

type GamePhase = 'menu' | 'playing' | 'paused' | 'gameOver';

export default function WhackAMoleCute() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const molesRef = useRef<Mole[]>([]);
  const lastSpawnRef = useRef(0);
  const moleIdRef = useRef(0);
  
  // Audio
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playBonkSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }, [soundEnabled, initAudio]);

  // Spawn mole
  const spawnMole = useCallback(() => {
    const holeIndex = Math.floor(Math.random() * 6);
    
    // Don't spawn if hole already has a mole
    if (molesRef.current.some(m => m.holeIndex === holeIndex && m.visible)) {
      return;
    }
    
    const mole: Mole = {
      id: moleIdRef.current++,
      holeIndex,
      visible: true,
      showTime: Date.now(),
    };
    
    molesRef.current = [...molesRef.current, mole];
    
    // Auto-hide after 1.5 seconds
    setTimeout(() => {
      molesRef.current = molesRef.current.filter(m => m.id !== mole.id);
    }, 1500);
  }, []);

  // Whack mole
  const whackMole = useCallback((holeIndex: number) => {
    const mole = molesRef.current.find(m => m.holeIndex === holeIndex && m.visible);
    if (!mole) return;
    
    playBonkSound();
    mole.visible = false;
    setScore(prev => prev + 1);
    
    // Remove after animation
    setTimeout(() => {
      molesRef.current = molesRef.current.filter(m => m.id !== mole.id);
    }, 200);
  }, [playBonkSound]);

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
      // Garden background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(0.6, '#90EE90');
      gradient.addColorStop(1, '#228B22');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw fence in background
      ctx.fillStyle = '#8B4513';
      const fenceY = canvas.height * 0.3;
      for (let i = 0; i < 8; i++) {
        const x = i * (canvas.width / 7);
        ctx.fillRect(x, fenceY, 15, 80);
      }
      
      // Draw grass
      ctx.fillStyle = '#32CD32';
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = canvas.height * 0.5 + Math.random() * canvas.height * 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 3, y - 15);
        ctx.lineTo(x + 3, y - 15);
        ctx.closePath();
        ctx.fill();
      }
      
      // Draw holes (2 rows, 3 columns)
      const holeWidth = 100;
      const holeHeight = 50;
      const startX = canvas.width / 2 - (holeWidth * 1.5 + 30);
      const startY = canvas.height * 0.55;
      
      const holePositions: { x: number; y: number }[] = [];
      
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          const x = startX + col * (holeWidth + 30);
          const y = startY + row * (holeHeight + 80);
          holePositions.push({ x, y });
          
          // Hole shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.beginPath();
          ctx.ellipse(x + holeWidth / 2, y + holeHeight / 2, holeWidth / 2, holeHeight / 3, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Hole
          ctx.fillStyle = '#3d2914';
          ctx.beginPath();
          ctx.ellipse(x + holeWidth / 2, y + holeHeight / 2, holeWidth / 2 - 5, holeHeight / 3 - 5, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw mole if visible
          const mole = molesRef.current.find(m => m.holeIndex === row * 3 + col && m.visible);
          if (mole) {
            const moleX = x + holeWidth / 2;
            const moleY = y - 20;
            
            // Body
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.ellipse(moleX, moleY + 30, 35, 40, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Head
            ctx.fillStyle = '#A0522D';
            ctx.beginPath();
            ctx.arc(moleX, moleY, 30, 0, Math.PI * 2);
            ctx.fill();
            
            // Ears
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(moleX - 25, moleY - 20, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(moleX + 25, moleY - 20, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner ears
            ctx.fillStyle = '#DEB887';
            ctx.beginPath();
            ctx.arc(moleX - 25, moleY - 20, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(moleX + 25, moleY - 20, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(moleX - 10, moleY - 5, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(moleX + 10, moleY - 5, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupils
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(moleX - 10, moleY - 5, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(moleX + 10, moleY - 5, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Eye shine
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(moleX - 12, moleY - 7, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(moleX + 8, moleY - 7, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Nose
            ctx.fillStyle = '#FF69B4';
            ctx.beginPath();
            ctx.ellipse(moleX, moleY + 8, 8, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Nose shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.ellipse(moleX - 2, moleY + 6, 3, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Smile
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(moleX, moleY + 12, 12, 0.2, Math.PI - 0.2);
            ctx.stroke();
            
            // Whiskers
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(moleX - 30, moleY + 5);
            ctx.lineTo(moleX - 45, moleY + 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(moleX - 30, moleY + 10);
            ctx.lineTo(moleX - 45, moleY + 12);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(moleX + 30, moleY + 5);
            ctx.lineTo(moleX + 45, moleY + 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(moleX + 30, moleY + 10);
            ctx.lineTo(moleX + 45, moleY + 12);
            ctx.stroke();
          }
        }
      }
      
      // Spawn moles during gameplay
      if (gamePhase === 'playing') {
        if (timestamp - lastSpawnRef.current > 800 + Math.random() * 700) {
          spawnMole();
          lastSpawnRef.current = timestamp;
        }
      }
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    animationRef.current = requestAnimationFrame(render);
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [gamePhase, spawnMole]);

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

  // Handle click
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gamePhase !== 'playing') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check holes
    const holeWidth = 100;
    const holeHeight = 50;
    const startX = canvas.width / 2 - (holeWidth * 1.5 + 30);
    const startY = canvas.height * 0.55;
    
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const holeX = startX + col * (holeWidth + 30);
        const holeY = startY + row * (holeHeight + 80) - 60;
        
        if (x > holeX && x < holeX + holeWidth && y > holeY && y < holeY + 100) {
          whackMole(row * 3 + col);
          return;
        }
      }
    }
  };

  // Start game
  const startGame = useCallback(() => {
    setGamePhase('playing');
    setScore(0);
    setTimeLeft(30);
    molesRef.current = [];
    lastSpawnRef.current = 0;
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
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
            <div className="text-8xl mb-4 animate-bounce">🐹</div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Whack-a-Mole!
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Tap the moles before they hide!
            </p>
            
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Game! 🔨
            </button>
          </div>
        </div>
      )}
      
      {/* Game HUD */}
      {gamePhase === 'playing' && (
        <>
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-4">
            <div className="bg-white/90 rounded-2xl px-6 py-3 shadow-xl">
              <span className="text-2xl font-bold text-green-600">⏱️ {timeLeft}s</span>
            </div>
            <div className="bg-white/90 rounded-2xl px-6 py-3 shadow-xl">
              <span className="text-2xl font-bold text-purple-600">⭐ {score}</span>
            </div>
          </div>
        </>
      )}
      
      {/* Game over */}
      {gamePhase === 'gameOver' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4">🏆</div>
            <h2 className="text-5xl font-bold text-white mb-4">Time&apos;s Up!</h2>
            <p className="text-3xl text-yellow-400 mb-6">
              You caught {score} moles!
            </p>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg"
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
