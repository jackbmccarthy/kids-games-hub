'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Types
interface Sheep {
  id: number;
  x: number;
  y: number;
  phase: 'waiting' | 'approaching' | 'jumping' | 'landing' | 'leaving';
  jumpProgress: number;
  jumpHeight: number;
  scale: number;
  fluffOffset: number;
  color: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  twinkleOffset: number;
  twinkleSpeed: number;
}

interface FloatingNumber {
  id: number;
  value: number;
  x: number;
  y: number;
  opacity: number;
}

type GamePhase = 'menu' | 'counting' | 'entering' | 'correct' | 'wrong' | 'levelComplete';

const SHEEP_COLORS = [
  '#FFFFFF', // White
  '#F5F5DC', // Beige
  '#FAF0E6', // Linen
  '#F8F8FF', // Ghost white
  '#FDF5E6', // Old lace
];

// Difficulty settings per level
const LEVEL_CONFIG = [
  { sheepCount: 3, maxDigit: 3, name: 'Baby Lamb' },
  { sheepCount: 5, maxDigit: 5, name: 'Little Sheep' },
  { sheepCount: 7, maxDigit: 7, name: 'Growing Flock' },
  { sheepCount: 10, maxDigit: 10, name: 'Shepherd' },
  { sheepCount: 12, maxDigit: 12, name: 'Expert Counter' },
  { sheepCount: 15, maxDigit: 15, name: 'Sleep Master' },
  { sheepCount: 18, maxDigit: 18, name: 'Dream Weaver' },
  { sheepCount: 20, maxDigit: 20, name: 'Counting Champion' },
];

export default function CountingSheep() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Game state
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [sheepToCount, setSheepToCount] = useState(0);
  const [playerGuess, setPlayerGuess] = useState('');
  const [countedSoFar, setCountedSoFar] = useState(0);
  
  // Animation state
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const sheepIdRef = useRef(0);
  const sheepSpawnedRef = useRef(0);
  const countingCompleteRef = useRef(false);
  const sheepRef = useRef<Sheep[]>([]);
  const floatingNumbersRef = useRef<FloatingNumber[]>([]);
  const backgroundStarsRef = useRef<Star[]>([]);
  const isInitializedRef = useRef(false);
  
  // Initialize background stars once on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    const stars: Star[] = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.6, // Only in top 60% of screen
        size: Math.random() * 2 + 0.5,
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
      });
    }
    backgroundStarsRef.current = stars;
  }, []);

  // Audio functions
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playCountSound = useCallback((count: number) => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      
      // Higher pitch for higher counts (like counting notes)
      const baseFreq = 400 + count * 30;
      oscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      oscillator.type = 'sine';
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch {}
  }, [soundEnabled, initAudio]);

  const playJumpSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      
      // Soft "boing" sound
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
      oscillator.type = 'sine';
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
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
      
      // Happy twinkle sound
      const notes = [523.25, 659.25, 783.99];
      
      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
        
        oscillator.start(ctx.currentTime + i * 0.15);
        oscillator.stop(ctx.currentTime + i * 0.15 + 0.3);
      });
    } catch {}
  }, [soundEnabled, initAudio]);

  const playWrongSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);
      oscillator.type = 'triangle';
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch {}
  }, [soundEnabled, initAudio]);

  // Start a round
  const startRound = useCallback(() => {
    const config = LEVEL_CONFIG[level];
    const sheepCount = config.sheepCount;
    
    setSheepToCount(sheepCount);
    setCountedSoFar(0);
    setPlayerGuess('');
    sheepSpawnedRef.current = 0;
    countingCompleteRef.current = false;
    sheepRef.current = [];
    floatingNumbersRef.current = [];
    setGamePhase('counting');
  }, [level]);

  // Spawn a sheep
  const spawnSheep = useCallback(() => {
    const config = LEVEL_CONFIG[level];
    if (sheepSpawnedRef.current >= config.sheepCount) return;
    
    const newSheep: Sheep = {
      id: sheepIdRef.current++,
      x: -100,
      y: 0,
      phase: 'approaching',
      jumpProgress: 0,
      jumpHeight: 0,
      scale: 0.8 + Math.random() * 0.2,
      fluffOffset: Math.random() * Math.PI * 2,
      color: SHEEP_COLORS[Math.floor(Math.random() * SHEEP_COLORS.length)],
    };
    
    sheepRef.current = [...sheepRef.current, newSheep];
    sheepSpawnedRef.current++;
  }, [level]);

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
    const SPAWN_INTERVAL = 1800; // ms between sheep spawns
    const GROUND_Y = canvas.height * 0.75;
    const FENCE_X = canvas.width * 0.5;
    
    const drawMoon = (x: number, y: number, radius: number) => {
      // Moon glow
      const glowGradient = ctx.createRadialGradient(x, y, radius, x, y, radius * 2);
      glowGradient.addColorStop(0, 'rgba(255, 255, 230, 0.3)');
      glowGradient.addColorStop(1, 'rgba(255, 255, 230, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Moon body
      const moonGradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
      moonGradient.addColorStop(0, '#FFFACD');
      moonGradient.addColorStop(0.7, '#F0E68C');
      moonGradient.addColorStop(1, '#DAA520');
      ctx.fillStyle = moonGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Moon craters
      ctx.fillStyle = 'rgba(200, 180, 100, 0.3)';
      ctx.beginPath();
      ctx.arc(x - radius * 0.3, y + radius * 0.2, radius * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + radius * 0.2, y - radius * 0.3, radius * 0.1, 0, Math.PI * 2);
      ctx.fill();
    };
    
    const drawCloud = (x: number, y: number, size: number) => {
      ctx.fillStyle = 'rgba(50, 50, 80, 0.5)';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
      ctx.arc(x + size * 1.5, y, size * 0.6, 0, Math.PI * 2);
      ctx.arc(x - size * 0.5, y + size * 0.1, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    };
    
    const drawFence = (x: number, y: number) => {
      const fenceWidth = 120;
      const fenceHeight = 80;
      const postWidth = 15;
      
      // Left post
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(x - fenceWidth / 2, y - fenceHeight, postWidth, fenceHeight);
      
      // Right post
      ctx.fillRect(x + fenceWidth / 2 - postWidth, y - fenceHeight, postWidth, fenceHeight);
      
      // Horizontal bars
      ctx.fillStyle = '#A0522D';
      ctx.fillRect(x - fenceWidth / 2, y - fenceHeight + 15, fenceWidth, 12);
      ctx.fillRect(x - fenceWidth / 2, y - fenceHeight + 45, fenceWidth, 12);
      
      // Post tops (pointed)
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.moveTo(x - fenceWidth / 2 - 3, y - fenceHeight);
      ctx.lineTo(x - fenceWidth / 2 + postWidth / 2, y - fenceHeight - 15);
      ctx.lineTo(x - fenceWidth / 2 + postWidth + 3, y - fenceHeight);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(x + fenceWidth / 2 - postWidth - 3, y - fenceHeight);
      ctx.lineTo(x + fenceWidth / 2 - postWidth / 2, y - fenceHeight - 15);
      ctx.lineTo(x + fenceWidth / 2 - postWidth + postWidth + 3, y - fenceHeight);
      ctx.fill();
    };
    
    const drawSheep = (sheep: Sheep, time: number) => {
      const { x, y, scale, fluffOffset, color, phase } = sheep;
      const baseY = GROUND_Y - 30;
      
      ctx.save();
      ctx.translate(x, baseY + y);
      ctx.scale(scale, scale);
      
      // Bobbing animation
      const bob = Math.sin(time * 3 + fluffOffset) * 3;
      
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 35, 30, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Legs
      const legOffset = phase === 'jumping' ? Math.sin(sheep.jumpProgress * Math.PI) * 10 : 0;
      ctx.fillStyle = '#4A4A4A';
      ctx.fillRect(-20, 15 - legOffset, 8, 25);
      ctx.fillRect(-5, 15 - legOffset, 8, 25);
      ctx.fillRect(8, 15 - legOffset, 8, 25);
      ctx.fillRect(18, 15 - legOffset, 8, 25);
      
      // Hooves
      ctx.fillStyle = '#2A2A2A';
      ctx.fillRect(-22, 35 - legOffset, 12, 8);
      ctx.fillRect(-3, 35 - legOffset, 12, 8);
      ctx.fillRect(10, 35 - legOffset, 12, 8);
      ctx.fillRect(20, 35 - legOffset, 12, 8);
      
      // Body (fluffy wool)
      ctx.fillStyle = color;
      
      // Main body fluffs
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const fluffX = Math.cos(angle) * 25 + Math.sin(time * 4 + fluffOffset + i) * 2;
        const fluffY = Math.sin(angle) * 20 + bob + Math.sin(time * 3 + i) * 1;
        const fluffSize = 15 + Math.sin(time * 2 + i + fluffOffset) * 2;
        
        ctx.beginPath();
        ctx.arc(fluffX, fluffY, fluffSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Tail fluff
      const tailWag = Math.sin(time * 5 + fluffOffset) * 10;
      ctx.beginPath();
      ctx.arc(35 + tailWag * 0.3, bob, 12 + Math.sin(time * 3) * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Head
      ctx.fillStyle = '#3A3A3A';
      ctx.beginPath();
      ctx.ellipse(-35, -5 + bob, 18, 15, -0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // Ears
      ctx.fillStyle = '#4A4A4A';
      ctx.beginPath();
      ctx.ellipse(-45, -15 + bob, 8, 12, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-30, -18 + bob, 8, 12, 0.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner ears (pink)
      ctx.fillStyle = '#FFB6C1';
      ctx.beginPath();
      ctx.ellipse(-45, -15 + bob, 4, 8, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-30, -18 + bob, 4, 8, 0.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(-42, -8 + bob, 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Pupils
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-43, -8 + bob, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye shine
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-44, -9 + bob, 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Nose
      ctx.fillStyle = '#2A2A2A';
      ctx.beginPath();
      ctx.ellipse(-50, -2 + bob, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Nose shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.ellipse(-51, -3 + bob, 2, 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Mouth (slight smile)
      ctx.strokeStyle = '#2A2A2A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-48, 2 + bob, 4, 0.2, Math.PI - 0.2);
      ctx.stroke();
      
      ctx.restore();
    };
    
    const render = (timestamp: number) => {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      
      // Clear with night sky gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#0a0a2e');
      bgGradient.addColorStop(0.4, '#1a1a4e');
      bgGradient.addColorStop(0.7, '#2a1a3e');
      bgGradient.addColorStop(1, '#1a3a2a');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw background stars
      backgroundStarsRef.current.forEach(star => {
        const twinkle = Math.sin(timestamp * 0.001 * star.twinkleSpeed * 60 + star.twinkleOffset) * 0.5 + 0.5;
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
      
      // Draw moon
      drawMoon(canvas.width * 0.8, canvas.height * 0.15, 50);
      
      // Draw clouds
      drawCloud(canvas.width * 0.2, canvas.height * 0.12, 40);
      drawCloud(canvas.width * 0.6, canvas.height * 0.08, 35);
      drawCloud(canvas.width * 0.9, canvas.height * 0.18, 30);
      
      // Draw hills in background
      ctx.fillStyle = '#1a3a2a';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      ctx.quadraticCurveTo(canvas.width * 0.25, canvas.height * 0.6, canvas.width * 0.5, canvas.height * 0.7);
      ctx.quadraticCurveTo(canvas.width * 0.75, canvas.height * 0.65, canvas.width, canvas.height * 0.7);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.fill();
      
      // Draw ground/grass
      const grassGradient = ctx.createLinearGradient(0, canvas.height * 0.7, 0, canvas.height);
      grassGradient.addColorStop(0, '#2d5a27');
      grassGradient.addColorStop(1, '#1a3a1a');
      ctx.fillStyle = grassGradient;
      ctx.fillRect(0, canvas.height * 0.75, canvas.width, canvas.height * 0.25);
      
      // Draw some grass tufts
      ctx.strokeStyle = '#3a7a33';
      ctx.lineWidth = 2;
      for (let i = 0; i < 50; i++) {
        const gx = (i / 50) * canvas.width;
        const gy = canvas.height * 0.75 + Math.sin(i) * 5;
        ctx.beginPath();
        ctx.moveTo(gx, gy + 20);
        ctx.quadraticCurveTo(gx - 5, gy, gx, gy - 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(gx, gy + 20);
        ctx.quadraticCurveTo(gx + 5, gy, gx + 3, gy - 8);
        ctx.stroke();
      }
      
      // Draw fence
      drawFence(FENCE_X, canvas.height * 0.75);
      
      // Spawn sheep during counting phase
      if (gamePhase === 'counting') {
        spawnTimer += deltaTime;
        if (spawnTimer >= SPAWN_INTERVAL && sheepSpawnedRef.current < LEVEL_CONFIG[level].sheepCount) {
          spawnSheep();
          spawnTimer = 0;
        }
      }
      
      // Update and draw sheep
      sheepRef.current = sheepRef.current.map(s => {
        const sheep = { ...s };
        const speed = 2;
        
        switch (sheep.phase) {
          case 'approaching':
            sheep.x += speed;
            if (sheep.x >= FENCE_X - 80) {
              sheep.phase = 'jumping';
              sheep.jumpProgress = 0;
            }
            break;
            
          case 'jumping':
            sheep.jumpProgress += 0.015;
            sheep.x += speed * 0.8;
            // Parabolic jump
            sheep.y = -Math.sin(sheep.jumpProgress * Math.PI) * 120;
            
            if (sheep.jumpProgress >= 0.5 && sheep.jumpProgress < 0.52) {
              // Count the sheep at the peak of the jump
              playJumpSound();
              setCountedSoFar(prev => {
                const newCount = prev + 1;
                // Show floating number
                floatingNumbersRef.current.push({
                  id: Date.now(),
                  value: newCount,
                  x: sheep.x,
                  y: canvas.height * 0.75 + sheep.y - 100,
                  opacity: 1,
                });
                // Play count sound
                playCountSound(newCount);
                return newCount;
              });
            }
            
            if (sheep.jumpProgress >= 1) {
              sheep.phase = 'leaving';
              sheep.y = 0;
            }
            break;
            
          case 'leaving':
            sheep.x += speed;
            break;
        }
        
        return sheep;
      }).filter(s => s.x < canvas.width + 100);
      
      // Check if all sheep have been counted
      if (gamePhase === 'counting' && 
          sheepSpawnedRef.current >= LEVEL_CONFIG[level].sheepCount && 
          sheepRef.current.length === 0 && 
          !countingCompleteRef.current) {
        countingCompleteRef.current = true;
        setTimeout(() => {
          setGamePhase('entering');
        }, 500);
      }
      
      // Draw sheep
      sheepRef.current.forEach(s => drawSheep(s, timestamp * 0.001));
      
      // Update floating numbers
      floatingNumbersRef.current = floatingNumbersRef.current
        .map(n => ({
          ...n,
          y: n.y - 1,
          opacity: n.opacity - 0.01,
        }))
        .filter(n => n.opacity > 0);
      
      // Draw floating numbers
      floatingNumbersRef.current.forEach(n => {
        ctx.save();
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(255, 215, 0, ${n.opacity})`;
        ctx.strokeStyle = `rgba(0, 0, 0, ${n.opacity * 0.5})`;
        ctx.lineWidth = 4;
        ctx.strokeText(String(n.value), n.x, n.y);
        ctx.fillText(String(n.value), n.x, n.y);
        ctx.restore();
      });
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    animationRef.current = requestAnimationFrame(render);
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [gamePhase, level, spawnSheep, playJumpSound, playCountSound]);

  // Handle guess submission
  const handleSubmitGuess = useCallback(() => {
    const guess = parseInt(playerGuess, 10);
    
    if (guess === sheepToCount) {
      setGamePhase('correct');
      setCorrectCount(prev => prev + 1);
      setTotalRounds(prev => prev + 1);
      const points = 10 + level * 5; // More points for higher levels
      setScore(prev => prev + points);
      playSuccessSound();
    } else {
      setGamePhase('wrong');
      setTotalRounds(prev => prev + 1);
      playWrongSound();
    }
  }, [playerGuess, sheepToCount, level, playSuccessSound, playWrongSound]);

  // Move to next level or repeat
  const handleNextRound = useCallback(() => {
    // Move to next level every 2 correct answers
    if (correctCount > 0 && correctCount % 2 === 0 && level < LEVEL_CONFIG.length - 1) {
      setLevel(prev => prev + 1);
    }
    startRound();
  }, [correctCount, level, startRound]);

  // Start game
  const startGame = useCallback(() => {
    setLevel(0);
    setScore(0);
    setCorrectCount(0);
    setTotalRounds(0);
    startRound();
  }, [startRound]);

  // Number pad handler
  const handleNumberPress = useCallback((num: string) => {
    if (playerGuess.length < 2) {
      setPlayerGuess(prev => prev + num);
    }
  }, [playerGuess]);

  // Clear input
  const handleClear = useCallback(() => {
    setPlayerGuess('');
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
      />
      
      {/* Sound toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all text-xl"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      
      {/* Menu overlay */}
      {gamePhase === 'menu' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center max-w-md mx-4">
            <div className="text-8xl mb-4 animate-bounce">🐑</div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Counting Sheep
            </h1>
            <p className="text-xl text-blue-200 mb-8">
              Watch the sheep jump over the fence and count them!
            </p>
            
            <div className="space-y-3 mb-8 text-left max-w-sm mx-auto">
              <p className="text-lg text-white/80 flex items-center gap-3">
                <span className="text-3xl">🐑</span> 
                <span>Watch sheep jump over the fence</span>
              </p>
              <p className="text-lg text-white/80 flex items-center gap-3">
                <span className="text-3xl">🔢</span> 
                <span>Count how many sheep you see</span>
              </p>
              <p className="text-lg text-white/80 flex items-center gap-3">
                <span className="text-3xl">✨</span> 
                <span>Enter the number to score points</span>
              </p>
              <p className="text-lg text-white/80 flex items-center gap-3">
                <span className="text-3xl">🌙</span> 
                <span>Levels get harder as you go!</span>
              </p>
            </div>
            
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Counting! 🌙
            </button>
          </div>
        </div>
      )}
      
      {/* Counting phase UI */}
      {gamePhase === 'counting' && (
        <>
          {/* Top HUD */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-6">
            {/* Level */}
            <div className="bg-white/10 rounded-2xl px-6 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌙</span>
                <span className="text-xl font-bold text-white">
                  {LEVEL_CONFIG[level].name}
                </span>
              </div>
            </div>
            
            {/* Score */}
            <div className="bg-white/10 rounded-2xl px-6 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span className="text-2xl font-bold text-yellow-400">{score}</span>
              </div>
            </div>
          </div>
          
          {/* Count so far */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 text-center">
            <div className="bg-white/10 rounded-2xl px-8 py-4 backdrop-blur-sm">
              <p className="text-white/70 text-lg mb-1">Count along!</p>
              <p className="text-4xl font-bold text-white">
                {countedSoFar > 0 ? `🐑 ${countedSoFar}` : '🐑 ...'}
              </p>
            </div>
          </div>
        </>
      )}
      
      {/* Entering guess phase */}
      {gamePhase === 'entering' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center max-w-sm mx-4">
            <h2 className="text-4xl font-bold text-white mb-4">
              How many sheep? 🐑
            </h2>
            
            {/* Display */}
            <div className="bg-white/20 rounded-3xl p-6 mb-6 backdrop-blur-sm">
              <div className="text-6xl font-bold text-white min-h-[80px] flex items-center justify-center">
                {playerGuess || '?'}
              </div>
            </div>
            
            {/* Number pad */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '✓'].map((num) => (
                <button
                  key={String(num)}
                  onClick={() => {
                    if (num === 'C') handleClear();
                    else if (num === '✓') {
                      if (playerGuess) handleSubmitGuess();
                    }
                    else handleNumberPress(String(num));
                  }}
                  className={`${
                    num === '✓' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : num === 'C' 
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-white/20 hover:bg-white/30'
                  } text-white text-3xl font-bold py-4 rounded-2xl transition-all active:scale-95`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Correct answer overlay */}
      {gamePhase === 'correct' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-5xl font-bold text-green-400 mb-2">
              Correct!
            </h2>
            <p className="text-3xl text-white mb-2">
              {sheepToCount} sheep! 🐑
            </p>
            <p className="text-2xl text-yellow-400 mb-6">
              +{10 + level * 5} points!
            </p>
            <button
              onClick={handleNextRound}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Next Round →
            </button>
          </div>
        </div>
      )}
      
      {/* Wrong answer overlay */}
      {gamePhase === 'wrong' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4">🤔</div>
            <h2 className="text-4xl font-bold text-white mb-2">
              Almost!
            </h2>
            <p className="text-2xl text-white/80 mb-2">
              There were <span className="text-yellow-400 font-bold">{sheepToCount}</span> sheep
            </p>
            <p className="text-xl text-white/60 mb-6">
              You guessed {playerGuess || '?'}
            </p>
            <button
              onClick={handleNextRound}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Try Again →
            </button>
          </div>
        </div>
      )}
      
      {/* Stats bar */}
      {(gamePhase === 'counting' || gamePhase === 'entering') && (
        <div className="absolute bottom-4 left-4 z-10 bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm">
          <p className="text-white/70 text-sm">
            Correct: {correctCount}/{totalRounds} | Level: {level + 1}
          </p>
        </div>
      )}
      
      {/* Back to menu button */}
      {gamePhase !== 'menu' && (
        <button
          onClick={() => setGamePhase('menu')}
          className="absolute top-4 left-4 z-20 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all text-xl"
        >
          ←
        </button>
      )}
    </main>
  );
}
