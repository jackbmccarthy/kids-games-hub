'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Types
interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  twinkleOffset: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
}

interface BackgroundStar {
  x: number;
  y: number;
  size: number;
  twinkleOffset: number;
  twinkleSpeed: number;
}

interface ShapeDefinition {
  name: string;
  points: number;
  preview: string; // SVG path or points
  color: string;
  emoji: string;
}

// Shape definitions
const SHAPES: ShapeDefinition[] = [
  { name: 'Triangle', points: 3, preview: '▲', color: '#ff6b9d', emoji: '🔺' },
  { name: 'Square', points: 4, preview: '■', color: '#4ecdc4', emoji: '🟦' },
  { name: 'Star', points: 5, preview: '★', color: '#ffe66d', emoji: '⭐' },
];

const STAR_COLORS = ['#ffe66d', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3'];

export default function StarCatcher() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'success' | 'wrong'>('menu');
  const [fallingStars, setFallingStars] = useState<Star[]>([]);
  const [selectedStarIds, setSelectedStarIds] = useState<number[]>([]);
  const [backgroundStars, setBackgroundStars] = useState<BackgroundStar[]>([]);
  const [currentShapeIndex, setCurrentShapeIndex] = useState(0);
  const [timer, setTimer] = useState(15);
  const [score, setScore] = useState(0);
  const [shapesCompleted, setShapesCompleted] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [starIdCounter, setStarIdCounter] = useState(0);
  const [showBonus, setShowBonus] = useState<{ points: number; x: number; y: number } | null>(null);
  const [glowPulse, setGlowPulse] = useState(0);
  const [message, setMessage] = useState<string>('');
  
  const currentShape = SHAPES[currentShapeIndex];

  // Initialize background stars
  useEffect(() => {
    const stars: BackgroundStar[] = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 2 + 0.5,
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
      });
    }
    setBackgroundStars(stars);
  }, []);

  // Audio setup
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = soundEnabled ? 0.3 : 0;
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
    return audioContextRef.current;
  }, [soundEnabled]);

  // Play star select sound
  const playSelectSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      
      oscillator.connect(gain);
      gain.connect(gainNodeRef.current || ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  }, [soundEnabled, initAudio]);

  // Play success sound
  const playSuccessSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const notes = [523.25, 659.25, 783.99, 1046.50];
      
      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        
        oscillator.connect(gain);
        gain.connect(gainNodeRef.current || ctx.destination);
        
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.4);
        
        oscillator.start(ctx.currentTime + i * 0.12);
        oscillator.stop(ctx.currentTime + i * 0.12 + 0.4);
      });
    } catch (e) {}
  }, [soundEnabled, initAudio]);

  // Play wrong sound
  const playWrongSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      
      oscillator.connect(gain);
      gain.connect(gainNodeRef.current || ctx.destination);
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  }, [soundEnabled, initAudio]);

  // Spawn falling stars
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const spawnInterval = setInterval(() => {
      if (fallingStars.length < 12) {
        const newStar: Star = {
          id: starIdCounter,
          x: 60 + Math.random() * (window.innerWidth - 120),
          y: -30,
          size: 25 + Math.random() * 15,
          speed: 0.4 + Math.random() * 0.3,
          twinkleOffset: Math.random() * Math.PI * 2,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        };
        setFallingStars(prev => [...prev, newStar]);
        setStarIdCounter(prev => prev + 1);
      }
    }, 800);
    
    return () => clearInterval(spawnInterval);
  }, [gameState, fallingStars.length, starIdCounter]);

  // Update falling stars
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const updateInterval = setInterval(() => {
      setFallingStars(prev => 
        prev
          .map(star => ({
            ...star,
            y: star.y + star.speed,
            rotation: star.rotation + star.rotationSpeed,
          }))
          .filter(star => star.y < window.innerHeight + 50)
      );
    }, 16);
    
    return () => clearInterval(updateInterval);
  }, [gameState]);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const timerInterval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          // Time's up - fail the shape
          handleWrongShape();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [gameState]);

  // Glow pulse animation
  useEffect(() => {
    const interval = setInterval(() => {
      setGlowPulse(prev => (prev + 0.1) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Handle wrong shape
  const handleWrongShape = useCallback(() => {
    setGameState('wrong');
    playWrongSound();
    setMessage('Try again!');
    setSelectedStarIds([]);
    
    setTimeout(() => {
      setGameState('playing');
      setMessage('');
    }, 1500);
  }, [playWrongSound]);

  // Handle shape completion
  const handleShapeComplete = useCallback(() => {
    setGameState('success');
    playSuccessSound();
    
    // Calculate bonus based on remaining time
    const timeBonus = timer * 10;
    const basePoints = 100;
    const totalPoints = basePoints + timeBonus;
    
    setScore(prev => prev + totalPoints);
    setShapesCompleted(prev => prev + 1);
    setShowBonus({ points: totalPoints, x: window.innerWidth / 2, y: window.innerHeight / 2 });
    
    setTimeout(() => {
      setShowBonus(null);
      setCurrentShapeIndex(prev => (prev + 1) % SHAPES.length);
      setSelectedStarIds([]);
      setTimer(15);
      setGameState('playing');
    }, 2000);
  }, [timer, playSuccessSound]);

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
    
    let time = 0;
    
    const drawStar = (cx: number, cy: number, size: number, rotation: number, color: string, glow: number = 0) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      
      // Glow effect
      if (glow > 0) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 20 + glow * 15;
      }
      
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const x = Math.cos(angle) * size;
        const y = Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.5, color);
      gradient.addColorStop(1, color);
      
      ctx.fillStyle = gradient;
      ctx.fill();
      
      ctx.restore();
    };
    
    const render = () => {
      time += 0.016;
      
      // Clear with night sky gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#0a0a2e');
      bgGradient.addColorStop(0.5, '#1a1a4e');
      bgGradient.addColorStop(1, '#2a1a3e');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw background stars
      backgroundStars.forEach(star => {
        const twinkle = Math.sin(time * star.twinkleSpeed * 60 + star.twinkleOffset) * 0.5 + 0.5;
        const alpha = 0.3 + twinkle * 0.7;
        
        ctx.beginPath();
        ctx.arc(
          star.x * canvas.width,
          star.y * canvas.height,
          star.size * twinkle,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });
      
      // Draw falling stars
      fallingStars.forEach(star => {
        const isSelected = selectedStarIds.includes(star.id);
        const glow = isSelected ? Math.sin(glowPulse) * 0.5 + 1 : 0;
        const twinkle = Math.sin(time * 3 + star.twinkleOffset) * 0.1 + 1;
        
        drawStar(
          star.x,
          star.y,
          star.size * twinkle,
          star.rotation,
          isSelected ? '#00ffff' : star.color,
          glow
        );
      });
      
      // Draw connection lines between selected stars
      if (selectedStarIds.length >= 2) {
        const selectedStars = fallingStars.filter(s => selectedStarIds.includes(s.id));
        
        ctx.beginPath();
        selectedStars.forEach((star, index) => {
          if (index === 0) {
            ctx.moveTo(star.x, star.y);
          } else {
            ctx.lineTo(star.x, star.y);
          }
        });
        
        // Close the shape if we have enough points
        if (selectedStars.length >= 3) {
          ctx.lineTo(selectedStars[0].x, selectedStars[0].y);
        }
        
        ctx.strokeStyle = currentShape.color;
        ctx.lineWidth = 4;
        ctx.shadowColor = currentShape.color;
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Draw glowing dots at connection points
        selectedStars.forEach(star => {
          ctx.beginPath();
          ctx.arc(star.x, star.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = currentShape.color;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [backgroundStars, fallingStars, selectedStarIds, glowPulse, currentShape]);

  // Handle star click
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Find clicked star
    let clickedStar: Star | null = null;
    let minDistance = Infinity;
    
    for (const star of fallingStars) {
      const distance = Math.sqrt((clickX - star.x) ** 2 + (clickY - star.y) ** 2);
      if (distance < star.size + 15 && distance < minDistance) {
        minDistance = distance;
        clickedStar = star;
      }
    }
    
    if (!clickedStar) return;
    
    const clickedId = clickedStar.id;
    
    // Toggle selection
    if (selectedStarIds.includes(clickedId)) {
      // Deselect
      setSelectedStarIds(prev => prev.filter(id => id !== clickedId));
    } else {
      // Select if not at limit
      if (selectedStarIds.length < currentShape.points) {
        playSelectSound();
        const newSelected = [...selectedStarIds, clickedId];
        setSelectedStarIds(newSelected);
        
        // Check if shape is complete
        if (newSelected.length === currentShape.points) {
          // For simplicity, any selection of right number = success
          // In a more complex version, we'd check actual shape geometry
          setTimeout(() => handleShapeComplete(), 500);
        }
      }
    }
  }, [gameState, fallingStars, selectedStarIds, currentShape, playSelectSound, handleShapeComplete]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedStarIds([]);
  }, []);

  // Start game
  const startGame = useCallback(() => {
    setGameState('playing');
    setSelectedStarIds([]);
    setFallingStars([]);
    setTimer(15);
    setScore(0);
    setShapesCompleted(0);
    setCurrentShapeIndex(0);
    setMessage('');
  }, []);

  // Back to menu
  const backToMenu = useCallback(() => {
    setGameState('menu');
    setSelectedStarIds([]);
    setFallingStars([]);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-pointer"
        onClick={handleCanvasClick}
      />
      
      {/* Sound toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all text-xl"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      
      {/* Menu overlay */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
              ⭐ Star Catcher ⭐
            </h1>
            <p className="text-xl text-purple-200 mb-8">
              Catch falling stars and connect them to make shapes!
            </p>
            
            <div className="space-y-3 mb-8 max-w-md mx-auto">
              <p className="text-lg text-white/80 flex items-center justify-center gap-2">
                <span className="text-2xl">🌟</span> Stars fall from the sky
              </p>
              <p className="text-lg text-white/80 flex items-center justify-center gap-2">
                <span className="text-2xl">👆</span> Click stars to connect them
              </p>
              <p className="text-lg text-white/80 flex items-center justify-center gap-2">
                <span className="text-2xl">🔺</span> Make shapes: Triangle, Square, Star
              </p>
              <p className="text-lg text-white/80 flex items-center justify-center gap-2">
                <span className="text-2xl">⏱️</span> Faster = More bonus points!
              </p>
            </div>
            
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Playing! 🌟
            </button>
          </div>
        </div>
      )}
      
      {/* Playing UI */}
      {gameState === 'playing' && (
        <>
          {/* Top bar */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-6">
            {/* Timer */}
            <div className="bg-white/10 rounded-2xl px-6 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⏱️</span>
                <span className={`text-3xl font-bold ${timer <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {timer}s
                </span>
              </div>
            </div>
            
            {/* Score */}
            <div className="bg-white/10 rounded-2xl px-6 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <span className="text-3xl font-bold text-yellow-400">{score}</span>
              </div>
            </div>
          </div>
          
          {/* Shape target */}
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 text-center">
            <div className="bg-white/10 rounded-2xl px-8 py-4 backdrop-blur-sm">
              <p className="text-white/70 text-sm mb-1">Make this shape:</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl">{currentShape.emoji}</span>
                <span className="text-3xl font-bold text-white">{currentShape.name}</span>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                {Array.from({ length: currentShape.points }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-full transition-all ${
                      i < selectedStarIds.length
                        ? 'bg-cyan-400 scale-110'
                        : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
              <p className="text-white/60 text-sm mt-1">
                {selectedStarIds.length} / {currentShape.points} stars selected
              </p>
            </div>
          </div>
          
          {/* Back button */}
          <button
            onClick={backToMenu}
            className="absolute top-4 left-4 z-20 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all text-xl"
          >
            ←
          </button>
          
          {/* Clear button */}
          {selectedStarIds.length > 0 && (
            <button
              onClick={clearSelection}
              className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 bg-red-500/80 hover:bg-red-600 text-white px-6 py-3 rounded-full font-bold transition-all"
            >
              Clear Selection ✖
            </button>
          )}
          
          {/* Message */}
          {message && (
            <div className="absolute bottom-36 left-1/2 transform -translate-x-1/2 z-20">
              <p className="text-2xl font-bold text-white animate-bounce">{message}</p>
            </div>
          )}
          
          {/* Instructions */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 text-center">
            <p className="text-white/60 text-lg">
              Click on {currentShape.points} stars to make a {currentShape.name}!
            </p>
          </div>
        </>
      )}
      
      {/* Success overlay */}
      {gameState === 'success' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">{currentShape.emoji}</div>
            <h2 className="text-5xl font-bold text-white mb-2">
              {currentShape.name} Complete!
            </h2>
            <p className="text-3xl text-yellow-400 font-bold">
              +{showBonus?.points || 0} points!
            </p>
            {timer > 10 && (
              <p className="text-xl text-green-400 mt-2">
                ⚡ Speed Bonus! (+{(timer) * 10})
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Wrong overlay */}
      {gameState === 'wrong' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-6xl mb-4">🤔</div>
            <h2 className="text-4xl font-bold text-white mb-2">
              Try Again!
            </h2>
            <p className="text-xl text-white/70">
              You need exactly {currentShape.points} stars for a {currentShape.name}!
            </p>
          </div>
        </div>
      )}
      
      {/* Bonus popup */}
      {showBonus && gameState === 'success' && (
        <div 
          className="absolute z-30 pointer-events-none"
          style={{ 
            left: showBonus.x, 
            top: showBonus.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="text-4xl font-bold text-yellow-400 animate-ping">
            +{showBonus.points}
          </div>
        </div>
      )}
    </div>
  );
}
