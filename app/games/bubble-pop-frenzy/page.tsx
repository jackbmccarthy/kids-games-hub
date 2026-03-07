'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Types
interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  wobbleOffset: number;
  wobbleSpeed: number;
  speed: number;
  isGolden: boolean;
  opacity: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  opacity: number;
}

type GameMode = 'menu' | 'endless' | 'timed' | 'playing' | 'paused' | 'gameOver';

const BUBBLE_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#95E1D3', // Green
  '#FFE66D', // Yellow
  '#F38181', // Pink
  '#AA96DA', // Purple
];

export default function BubblePopFrenzy() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Game state
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [missedCount, setMissedCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Animation refs
  const bubblesRef = useRef<Bubble[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const bubbleIdRef = useRef(0);
  const lastPopTimeRef = useRef(0);
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio functions
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
      
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
      oscillator.type = 'sine';
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch {}
  }, [soundEnabled, initAudio]);

  const playGoldenSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const notes = [523.25, 659.25, 783.99, 1046.50];
      
      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.2);
        
        oscillator.start(ctx.currentTime + i * 0.05);
        oscillator.stop(ctx.currentTime + i * 0.05 + 0.2);
      });
    } catch {}
  }, [soundEnabled, initAudio]);

  const playComboSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.15);
      oscillator.type = 'triangle';
      
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch {}
  }, [soundEnabled, initAudio]);

  // Spawn bubble
  const spawnBubble = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const isGolden = Math.random() < 0.05;
    const size = 40 + Math.random() * 40;
    
    const newBubble: Bubble = {
      id: bubbleIdRef.current++,
      x: 20 + Math.random() * (canvas.width - 40),
      y: canvas.height + size,
      size: isGolden ? size * 1.2 : size,
      color: isGolden ? '#FFD700' : BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.5 + Math.random() * 1,
      speed: 0.5 + Math.random() * 1.5,
      isGolden,
      opacity: 1,
    };
    
    bubblesRef.current = [...bubblesRef.current, newBubble];
  }, []);

  // Pop bubble
  const popBubble = useCallback((bubble: Bubble, x: number, y: number) => {
    // Remove bubble
    bubblesRef.current = bubblesRef.current.filter(b => b.id !== bubble.id);
    
    // Create particles
    const particleCount = 8;
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 3 + Math.random() * 3;
      
      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: bubble.color,
        size: 8 + Math.random() * 6,
        opacity: 1,
      });
    }
    
    particlesRef.current = [...particlesRef.current, ...newParticles];
    
    // Update combo
    const now = Date.now();
    if (now - lastPopTimeRef.current < 1000) {
      setCombo(prev => {
        const newCombo = prev + 1;
        if (newCombo === 5) {
          playComboSound();
        }
        return newCombo;
      });
    } else {
      setCombo(1);
    }
    lastPopTimeRef.current = now;
    
    // Reset combo timeout
    if (comboTimeoutRef.current) {
      clearTimeout(comboTimeoutRef.current);
    }
    comboTimeoutRef.current = setTimeout(() => setCombo(0), 1000);
    
    // Update score
    const points = bubble.isGolden ? 5 : 1;
    const comboBonus = combo >= 5 ? 2 : 1;
    setScore(prev => prev + points * comboBonus);
    
    // Play sound
    if (bubble.isGolden) {
      playGoldenSound();
    } else {
      playPopSound();
    }
  }, [combo, playPopSound, playGoldenSound, playComboSound]);

  // Handle canvas click/touch
  const handleCanvasInteraction = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Check for bubble hits (reverse order to check top bubbles first)
    for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
      const bubble = bubblesRef.current[i];
      const dx = x - bubble.x;
      const dy = y - bubble.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Touch area slightly larger than bubble
      if (distance < bubble.size + 10) {
        popBubble(bubble, bubble.x, bubble.y);
        break;
      }
    }
  }, [popBubble]);

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
    
    let lastTime = 0;
    let spawnTimer = 0;
    
    const getSpawnInterval = () => {
      switch (difficulty) {
        case 'easy': return 800;
        case 'medium': return 500;
        case 'hard': return 300;
      }
    };
    
    const getMaxBubbles = () => {
      switch (difficulty) {
        case 'easy': return 8;
        case 'medium': return 12;
        case 'hard': return 18;
      }
    };
    
    const render = (timestamp: number) => {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      
      // Clear with gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#87CEEB');
      bgGradient.addColorStop(0.5, '#B0E0E6');
      bgGradient.addColorStop(1, '#E0F6FF');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      const cloudY = canvas.height * 0.15;
      ctx.beginPath();
      ctx.arc(canvas.width * 0.2, cloudY, 50, 0, Math.PI * 2);
      ctx.arc(canvas.width * 0.2 + 40, cloudY - 10, 40, 0, Math.PI * 2);
      ctx.arc(canvas.width * 0.2 + 80, cloudY, 35, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(canvas.width * 0.7, cloudY + 20, 45, 0, Math.PI * 2);
      ctx.arc(canvas.width * 0.7 + 35, cloudY + 10, 35, 0, Math.PI * 2);
      ctx.arc(canvas.width * 0.7 + 70, cloudY + 20, 30, 0, Math.PI * 2);
      ctx.fill();
      
      // Spawn bubbles during gameplay
      if (gameMode === 'playing' || gameMode === 'endless' || gameMode === 'timed') {
        spawnTimer += deltaTime;
        const spawnInterval = getSpawnInterval();
        const maxBubbles = getMaxBubbles();
        
        if (spawnTimer >= spawnInterval && bubblesRef.current.length < maxBubbles) {
          spawnBubble();
          spawnTimer = 0;
        }
      }
      
      // Update and draw bubbles
      bubblesRef.current = bubblesRef.current.filter(bubble => {
        // Update position
        bubble.y -= bubble.speed;
        bubble.x += Math.sin(timestamp * 0.001 * bubble.wobbleSpeed + bubble.wobbleOffset) * 0.5;
        
        // Check if escaped
        if (bubble.y < -bubble.size) {
          if (gameMode === 'endless') {
            setMissedCount(prev => prev + 1);
          }
          return false;
        }
        
        // Draw bubble
        ctx.save();
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.ellipse(bubble.x, bubble.y + bubble.size * 0.8, bubble.size * 0.8, bubble.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bubble body with gradient
        const gradient = ctx.createRadialGradient(
          bubble.x - bubble.size * 0.3,
          bubble.y - bubble.size * 0.3,
          0,
          bubble.x,
          bubble.y,
          bubble.size
        );
        
        gradient.addColorStop(0, bubble.isGolden ? '#FFFACD' : 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.5, bubble.color);
        gradient.addColorStop(1, bubble.isGolden ? '#DAA520' : bubble.color);
        
        ctx.fillStyle = gradient;
        ctx.globalAlpha = bubble.opacity * 0.8;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(
          bubble.x - bubble.size * 0.3,
          bubble.y - bubble.size * 0.3,
          bubble.size * 0.25,
          bubble.size * 0.15,
          -Math.PI / 4,
          0,
          Math.PI * 2
        );
        ctx.fill();
        
        // Golden sparkle
        if (bubble.isGolden) {
          const sparkle = (timestamp * 0.005) % 1;
          ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(sparkle * Math.PI * 2) * 0.5})`;
          ctx.beginPath();
          ctx.arc(bubble.x, bubble.y, bubble.size * 0.15, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
        
        return true;
      });
      
      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.opacity -= 0.02;
        particle.size *= 0.95;
        
        if (particle.opacity <= 0) return false;
        
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        return true;
      });
      
      // Check game over for endless mode
      if (gameMode === 'endless' && missedCount >= 10) {
        setGameMode('gameOver');
      }
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    animationRef.current = requestAnimationFrame(render);
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [gameMode, difficulty, missedCount, spawnBubble]);

  // Timer for timed mode
  useEffect(() => {
    if (gameMode === 'timed') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameMode('gameOver');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [gameMode]);

  // Start game
  const startGame = useCallback((mode: 'endless' | 'timed') => {
    setGameMode(mode);
    setScore(0);
    setCombo(0);
    setMissedCount(0);
    setTimeLeft(60);
    bubblesRef.current = [];
    particlesRef.current = [];
  }, []);

  // Canvas event handlers
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleCanvasInteraction(e.clientX, e.clientY);
  };

  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleCanvasInteraction(touch.clientX, touch.clientY);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onTouchStart={handleTouch}
        className="absolute inset-0 cursor-pointer"
      />
      
      {/* Sound toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all text-xl backdrop-blur-sm"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      
      {/* Menu overlay */}
      {gameMode === 'menu' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="text-center max-w-md mx-4">
            <div className="text-8xl mb-4 animate-bounce">🫧</div>
            <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
              Bubble Pop Frenzy
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Tap bubbles before they float away!
            </p>
            
            {/* Difficulty selector */}
            <div className="mb-6">
              <p className="text-white mb-2 font-semibold">Difficulty:</p>
              <div className="flex gap-2 justify-center">
                {(['easy', 'medium', 'hard'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-4 py-2 rounded-full font-semibold capitalize ${
                      difficulty === d
                        ? 'bg-white text-blue-600'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Game modes */}
            <div className="space-y-3">
              <button
                onClick={() => startGame('endless')}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xl font-bold py-4 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all"
              >
                🎯 Endless Mode
              </button>
              
              <button
                onClick={() => startGame('timed')}
                className="w-full bg-gradient-to-r from-pink-500 to-red-600 hover:from-pink-600 hover:to-red-700 text-white text-xl font-bold py-4 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all"
              >
                ⏱️ Timed Mode (60s)
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Game HUD */}
      {(gameMode === 'playing' || gameMode === 'endless' || gameMode === 'timed') && (
        <>
          {/* Score */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/20 rounded-2xl px-6 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-white">{score}</span>
              {combo >= 5 && (
                <span className="text-2xl animate-pulse">🔥 x{combo}</span>
              )}
            </div>
          </div>
          
          {/* Timer for timed mode */}
          {gameMode === 'timed' && (
            <div className="absolute top-4 left-4 z-10 bg-white/20 rounded-2xl px-4 py-2 backdrop-blur-sm">
              <span className="text-2xl font-bold text-white">⏱️ {timeLeft}s</span>
            </div>
          )}
          
          {/* Missed count for endless mode */}
          {gameMode === 'endless' && (
            <div className="absolute top-4 left-4 z-10 bg-white/20 rounded-2xl px-4 py-2 backdrop-blur-sm">
              <span className="text-2xl font-bold text-white">❤️ {10 - missedCount}</span>
            </div>
          )}
          
          {/* Pause button */}
          <button
            onClick={() => setGameMode('paused')}
            className="absolute bottom-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full text-xl backdrop-blur-sm"
          >
            ⏸️
          </button>
          
          {/* Combo indicator */}
          {combo >= 5 && (
            <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-6xl animate-bounce">
              🔥
            </div>
          )}
        </>
      )}
      
      {/* Paused overlay */}
      {gameMode === 'paused' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <h2 className="text-5xl font-bold text-white mb-8">Paused</h2>
            <div className="space-y-3">
              <button
                onClick={() => setGameMode('endless')}
                className="block w-full bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-3 px-8 rounded-full"
              >
                Resume
              </button>
              <button
                onClick={() => startGame('endless')}
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-xl font-bold py-3 px-8 rounded-full"
              >
                Restart
              </button>
              <button
                onClick={() => setGameMode('menu')}
                className="block w-full bg-gray-500 hover:bg-gray-600 text-white text-xl font-bold py-3 px-8 rounded-full"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Game over overlay */}
      {gameMode === 'gameOver' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4">🎉</div>
            <h2 className="text-5xl font-bold text-white mb-4">Game Over!</h2>
            <p className="text-3xl text-yellow-400 mb-6">Score: {score}</p>
            <div className="space-y-3">
              <button
                onClick={() => startGame('endless')}
                className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xl font-bold py-3 px-8 rounded-full"
              >
                Play Again
              </button>
              <button
                onClick={() => setGameMode('menu')}
                className="block w-full bg-gray-500 hover:bg-gray-600 text-white text-xl font-bold py-3 px-8 rounded-full"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Back to menu button */}
      {gameMode !== 'menu' && gameMode !== 'paused' && gameMode !== 'gameOver' && (
        <button
          onClick={() => setGameMode('menu')}
          className="absolute top-4 left-4 z-20 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all text-xl backdrop-blur-sm"
        >
          ←
        </button>
      )}
    </main>
  );
}
