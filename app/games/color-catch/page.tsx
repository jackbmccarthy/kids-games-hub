'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Ball {
  id: number;
  x: number;
  y: number;
  color: 'red' | 'blue' | 'yellow';
  speed: number;
}

type GamePhase = 'menu' | 'playing' | 'paused' | 'gameOver';

const COLORS = {
  red: '#FF6B6B',
  blue: '#4ECDC4',
  yellow: '#FFE66D',
};

export default function ColorCatch() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const basketXRef = useRef(0);
  const ballsRef = useRef<Ball[]>([]);
  const ballIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  
  // Audio
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playCatchSound = useCallback((correct: boolean) => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (correct) {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.type = 'sine';
      } else {
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.type = 'sawtooth';
      }
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }, [soundEnabled, initAudio]);

  // Spawn ball
  const spawnBall = useCallback((canvasWidth: number) => {
    const colors: Array<'red' | 'blue' | 'yellow'> = ['red', 'blue', 'yellow'];
    const ball: Ball = {
      id: ballIdRef.current++,
      x: 50 + Math.random() * (canvasWidth - 100),
      y: -20,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: 2 + Math.random() * 2,
    };
    
    ballsRef.current = [...ballsRef.current, ball];
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
      basketXRef.current = canvas.width / 2;
    };
    resize();
    window.addEventListener('resize', resize);
    
    const basketWidth = 240;
    const zoneWidth = basketWidth / 3;
    const basketY = canvas.height - 120;
    
    const render = (timestamp: number) => {
      // Sky gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#87CEEB');
      bgGradient.addColorStop(0.7, '#90EE90');
      bgGradient.addColorStop(1, '#228B22');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      [[100, 80], [canvas.width - 150, 100], [canvas.width / 2, 60]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.arc(x + 30, y - 10, 30, 0, Math.PI * 2);
        ctx.arc(x + 60, y, 25, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Sun
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(canvas.width - 80, 80, 50, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw basket
      const basketX = basketXRef.current - basketWidth / 2;
      
      // Basket zones
      const zones: Array<'red' | 'blue' | 'yellow'> = ['red', 'blue', 'yellow'];
      zones.forEach((color, i) => {
        const zoneX = basketX + i * zoneWidth;
        
        // Zone background
        ctx.fillStyle = COLORS[color];
        ctx.globalAlpha = 0.3;
        ctx.fillRect(zoneX, basketY, zoneWidth, 80);
        ctx.globalAlpha = 1;
        
        // Zone border
        ctx.strokeStyle = COLORS[color];
        ctx.lineWidth = 3;
        ctx.strokeRect(zoneX, basketY, zoneWidth, 80);
      });
      
      // Basket weave texture
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const x = basketX + i * (basketWidth / 5);
        ctx.beginPath();
        ctx.moveTo(x, basketY);
        ctx.lineTo(x, basketY + 80);
        ctx.stroke();
      }
      
      // Spawn balls during gameplay
      if (gamePhase === 'playing') {
        if (timestamp - lastSpawnRef.current > 1500) {
          spawnBall(canvas.width);
          lastSpawnRef.current = timestamp;
        }
      }
      
      // Update and draw balls
      ballsRef.current = ballsRef.current.filter(ball => {
        ball.y += ball.speed;
        
        // Trail effect
        ctx.fillStyle = COLORS[ball.color];
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y - 20, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Ball shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(ball.x, basketY + 70, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Ball
        const gradient = ctx.createRadialGradient(
          ball.x - 8, ball.y - 8, 0,
          ball.x, ball.y, 20
        );
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(0.5, COLORS[ball.color]);
        gradient.addColorStop(1, COLORS[ball.color]);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Check if ball reached basket
        if (ball.y >= basketY && ball.y <= basketY + 80) {
          const ballZoneX = ball.x - basketX;
          if (ballZoneX >= 0 && ballZoneX <= basketWidth) {
            const zoneIndex = Math.floor(ballZoneX / zoneWidth);
            const caughtColor = zones[zoneIndex];
            
            if (caughtColor === ball.color) {
              playCatchSound(true);
              setScore(prev => prev + 1);
            } else {
              playCatchSound(false);
              setHearts(prev => {
                const newHearts = prev - 1;
                if (newHearts <= 0) {
                  setGamePhase('gameOver');
                }
                return newHearts;
              });
            }
          }
          return false; // Remove ball
        }
        
        return ball.y < canvas.height + 50;
      });
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    animationRef.current = requestAnimationFrame(render);
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [gamePhase, spawnBall, playCatchSound]);

  // Handle mouse/touch move
  const handleMove = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas || gamePhase !== 'playing') return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    basketXRef.current = Math.max(120, Math.min(canvas.width - 120, x));
  };

  // Start game
  const startGame = useCallback(() => {
    setGamePhase('playing');
    setScore(0);
    setHearts(3);
    ballsRef.current = [];
    lastSpawnRef.current = 0;
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseMove={(e) => handleMove(e.clientX)}
        onTouchMove={(e) => {
          e.preventDefault();
          handleMove(e.touches[0].clientX);
        }}
        className="absolute inset-0 cursor-none"
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
            <div className="text-8xl mb-4 animate-bounce">🧺</div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Color Catch
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Move the basket to catch matching colors!
            </p>
            
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Catching! 🎨
            </button>
          </div>
        </div>
      )}
      
      {/* Game HUD */}
      {gamePhase === 'playing' && (
        <>
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/90 rounded-2xl px-6 py-3 shadow-xl">
            <span className="text-2xl font-bold text-purple-600">⭐ {score}</span>
          </div>
          
          <div className="absolute top-4 left-4 z-10 bg-white/90 rounded-xl px-4 py-2 shadow">
            <span className="text-2xl">❤️ {hearts}</span>
          </div>
        </>
      )}
      
      {/* Game over */}
      {gamePhase === 'gameOver' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4">🎮</div>
            <h2 className="text-5xl font-bold text-white mb-4">Game Over!</h2>
            <p className="text-3xl text-yellow-400 mb-6">
              You scored {score} points!
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
