'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Balloon {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  popped: boolean;
}

type GamePhase = 'menu' | 'playing' | 'correct' | 'wrong' | 'levelComplete';

const BALLOON_COLORS = [
  '#FF6B6B', '#4ECDC4', '#95E1D3', '#FFE66D', '#F38181', '#AA96DA',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3',
];

export default function BalloonCountPop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [targetNumber, setTargetNumber] = useState(3);
  const [poppedCount, setPoppedCount] = useState(0);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const balloonsRef = useRef<Balloon[]>([]);
  const balloonIdRef = useRef(0);
  
  // Audio
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playPopSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }, [soundEnabled, initAudio]);

  const playSuccessSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const notes = [523.25, 659.25, 783.99, 1046.50];
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
  }, [soundEnabled, initAudio]);

  // Initialize balloons for round
  const initializeRound = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Calculate target number based on level
    let newTarget = 3;
    if (level >= 3) newTarget = 5;
    if (level >= 5) newTarget = 7;
    if (level >= 7) newTarget = 10;
    
    setTargetNumber(newTarget);
    setPoppedCount(0);
    
    // Create balloons (more than target to make it interesting)
    const balloonCount = newTarget + 5 + Math.floor(Math.random() * 5);
    const balloons: Balloon[] = [];
    
    for (let i = 0; i < balloonCount; i++) {
      const size = 40 + Math.random() * 30;
      balloons.push({
        id: balloonIdRef.current++,
        x: 50 + Math.random() * (canvas.width - 100),
        y: canvas.height + Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.5 - Math.random() * 1,
        color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
        size,
        popped: false,
      });
    }
    
    balloonsRef.current = balloons;
    setGamePhase('playing');
  }, [level]);

  // Pop balloon
  const popBalloon = useCallback((id: number) => {
    const balloon = balloonsRef.current.find(b => b.id === id);
    if (!balloon || balloon.popped) return;
    
    balloon.popped = true;
    playPopSound();
    
    setPoppedCount(prev => {
      const newCount = prev + 1;
      
      // Check if reached target
      if (newCount === targetNumber) {
        setTimeout(() => {
          playSuccessSound();
          setScore(s => s + level * 10);
          setGamePhase('correct');
        }, 300);
      } else if (newCount > targetNumber) {
        setGamePhase('wrong');
      }
      
      return newCount;
    });
  }, [targetNumber, level, playPopSound, playSuccessSound]);

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
    
    const render = () => {
      // Party background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Streamers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(i * canvas.width / 4, 0);
        ctx.lineTo(i * canvas.width / 4 + 100, canvas.height);
        ctx.stroke();
      }
      
      // Update and draw balloons
      if (gamePhase === 'playing') {
        balloonsRef.current.forEach(balloon => {
          if (balloon.popped) return;
          
          // Update position
          balloon.x += balloon.vx;
          balloon.y += balloon.vy;
          
          // Bounce off edges
          if (balloon.x < balloon.size || balloon.x > canvas.width - balloon.size) {
            balloon.vx *= -1;
          }
          
          // Draw balloon
          ctx.save();
          
          // String
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(balloon.x, balloon.y + balloon.size);
          ctx.lineTo(balloon.x + 5, balloon.y + balloon.size + 30);
          ctx.stroke();
          
          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.beginPath();
          ctx.ellipse(balloon.x, balloon.y + balloon.size * 0.8, balloon.size * 0.7, balloon.size * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Balloon body
          const balloonGradient = ctx.createRadialGradient(
            balloon.x - balloon.size * 0.3,
            balloon.y - balloon.size * 0.3,
            0,
            balloon.x,
            balloon.y,
            balloon.size
          );
          balloonGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
          balloonGradient.addColorStop(0.3, balloon.color);
          balloonGradient.addColorStop(1, balloon.color);
          
          ctx.fillStyle = balloonGradient;
          ctx.beginPath();
          ctx.ellipse(balloon.x, balloon.y, balloon.size * 0.8, balloon.size, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Knot
          ctx.fillStyle = balloon.color;
          ctx.beginPath();
          ctx.moveTo(balloon.x - 5, balloon.y + balloon.size);
          ctx.lineTo(balloon.x + 5, balloon.y + balloon.size);
          ctx.lineTo(balloon.x, balloon.y + balloon.size + 8);
          ctx.closePath();
          ctx.fill();
          
          // Highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.beginPath();
          ctx.ellipse(
            balloon.x - balloon.size * 0.3,
            balloon.y - balloon.size * 0.3,
            balloon.size * 0.2,
            balloon.size * 0.15,
            -0.5,
            0,
            Math.PI * 2
          );
          ctx.fill();
          
          ctx.restore();
        });
      }
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    animationRef.current = requestAnimationFrame(render);
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [gamePhase]);

  // Handle click
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gamePhase !== 'playing') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check balloons in reverse (top-most first)
    for (let i = balloonsRef.current.length - 1; i >= 0; i--) {
      const balloon = balloonsRef.current[i];
      if (balloon.popped) continue;
      
      const dx = x - balloon.x;
      const dy = y - balloon.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < balloon.size) {
        popBalloon(balloon.id);
        break;
      }
    }
  };

  // Start game
  const startGame = useCallback(() => {
    setLevel(1);
    setScore(0);
    initializeRound();
  }, [initializeRound]);

  // Next level
  const nextLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    initializeRound();
  }, [initializeRound]);

  // Try again
  const tryAgain = useCallback(() => {
    initializeRound();
  }, [initializeRound]);

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
            <div className="text-8xl mb-4 animate-bounce">🎈</div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Balloon Count & Pop
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Pop the right number of balloons!
            </p>
            
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Popping! 🎈
            </button>
          </div>
        </div>
      )}
      
      {/* Game HUD */}
      {gamePhase === 'playing' && (
        <>
          {/* Target number */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 text-center">
            <div className="bg-white/90 rounded-3xl px-8 py-4 shadow-xl">
              <p className="text-white/70 text-sm mb-1">Pop this many:</p>
              <p className="text-6xl font-bold text-purple-600">{targetNumber}</p>
            </div>
          </div>
          
          {/* Popped count */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-white/90 rounded-2xl px-6 py-3 shadow-xl">
              <p className="text-3xl font-bold text-purple-600">
                Popped: {poppedCount} 🎈
              </p>
            </div>
          </div>
          
          {/* Level & Score */}
          <div className="absolute top-4 left-4 z-10 bg-white/80 rounded-xl px-4 py-2 shadow">
            <p className="text-lg font-bold text-purple-600">Level {level}</p>
            <p className="text-sm text-gray-600">⭐ {score}</p>
          </div>
        </>
      )}
      
      {/* Correct overlay */}
      {gamePhase === 'correct' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-5xl font-bold text-white mb-4">Perfect!</h2>
            <p className="text-2xl text-white/90 mb-6">
              You popped exactly {targetNumber} balloons!
            </p>
            <button
              onClick={nextLevel}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg"
            >
              Next Level →
            </button>
          </div>
        </div>
      )}
      
      {/* Wrong overlay */}
      {gamePhase === 'wrong' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4">🤔</div>
            <h2 className="text-4xl font-bold text-white mb-4">Oops!</h2>
            <p className="text-xl text-white/90 mb-2">
              You needed to pop {targetNumber} balloons
            </p>
            <p className="text-lg text-white/70 mb-6">
              You popped {poppedCount}
            </p>
            <button
              onClick={tryAgain}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg"
            >
              Try Again
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
