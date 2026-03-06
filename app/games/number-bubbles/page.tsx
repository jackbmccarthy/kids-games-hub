"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Bubble {
  id: number;
  number: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  wobbleOffset: number;
  wobbleSpeed: number;
  isShaking: boolean;
  shakeTime: number;
  isPopped: boolean;
  popAnimation: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  radius: number;
}

interface Confetti {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  size: number;
}

type GameMode = "forward" | "backward" | "skip2" | "skip5" | "skip10";
type GamePhase = "menu" | "playing" | "complete" | "paused";

const BUBBLE_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F8B500", "#FF8C94", "#A8E6CF", "#FFD93D", "#6BCB77",
  "#FF8066", "#7868E6", "#B8E994", "#F9ED69", "#F08A5D",
];

const MODE_INFO: Record<GameMode, { name: string; sequence: number[]; description: string }> = {
  forward: { 
    name: "Count Up 1-20", 
    sequence: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    description: "Pop bubbles in order: 1, 2, 3..."
  },
  backward: { 
    name: "Count Down 20-1", 
    sequence: [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    description: "Pop backwards: 20, 19, 18..."
  },
  skip2: { 
    name: "Skip by 2s", 
    sequence: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
    description: "Count by 2s: 2, 4, 6, 8..."
  },
  skip5: { 
    name: "Skip by 5s", 
    sequence: [5, 10, 15, 20],
    description: "Count by 5s: 5, 10, 15, 20"
  },
  skip10: { 
    name: "Skip by 10s", 
    sequence: [10, 20],
    description: "Count by 10s: 10, 20"
  },
};

export default function NumberBubblesPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [gameMode, setGameMode] = useState<GameMode>("forward");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [bestTimes, setBestTimes] = useState<Record<GameMode, number | null>>({
    forward: null,
    backward: null,
    skip2: null,
    skip5: null,
    skip10: null,
  });
  
  const bubblesRef = useRef<Bubble[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const confettiRef = useRef<Confetti[]>([]);
  const animationRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play pop sound with pitch variation
  const playPopSound = useCallback((number: number) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Higher pitch for higher numbers
      const baseFreq = 300 + (number * 15);
      oscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch {
      // Audio not available
    }
  }, [getAudioContext]);

  // Speak the number using speech synthesis
  const speakNumber = useCallback((number: number) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(String(number));
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      
      // Try to find a kid-friendly voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('karen')
      );
      if (preferredVoice) utterance.voice = preferredVoice;
      
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Play error sound
  const playErrorSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(150, ctx.currentTime);
      oscillator.type = "square";
      
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio not available
    }
  }, [getAudioContext]);

  // Play celebration sound
  const playCelebrationSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
      
      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        oscillator.type = "sine";
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.15 + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
        
        oscillator.start(ctx.currentTime + i * 0.15);
        oscillator.stop(ctx.currentTime + i * 0.15 + 0.3);
      });
    } catch {
      // Audio not available
    }
  }, [getAudioContext]);

  // Create particles
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 15) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 3 + Math.random() * 5;
      particlesRef.current.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1,
        radius: 4 + Math.random() * 6,
      });
    }
  }, []);

  // Create confetti
  const createConfetti = useCallback(() => {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#FF8C94"];
    for (let i = 0; i < 100; i++) {
      confettiRef.current.push({
        id: Date.now() + i,
        x: Math.random() * (canvasRef.current?.width || 800),
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        size: 8 + Math.random() * 8,
      });
    }
  }, []);

  // Create bubbles for the sequence
  const createBubbles = useCallback((mode: GameMode, canvasWidth: number, canvasHeight: number) => {
    const sequence = MODE_INFO[mode].sequence;
    const bubbles: Bubble[] = [];
    const padding = 80;
    
    sequence.forEach((number, index) => {
      const radius = 45 + Math.random() * 15;
      let x: number, y: number;
      let attempts = 0;
      
      // Find non-overlapping position
      do {
        x = padding + Math.random() * (canvasWidth - padding * 2);
        y = padding + Math.random() * (canvasHeight - padding * 2 - 100); // Leave space for UI
        attempts++;
      } while (
        attempts < 50 &&
        bubbles.some(b => {
          const dist = Math.sqrt((b.x - x) ** 2 + (b.y - y) ** 2);
          return dist < b.radius + radius + 20;
        })
      );
      
      bubbles.push({
        id: index,
        number,
        x,
        y,
        radius,
        color: BUBBLE_COLORS[number - 1] || BUBBLE_COLORS[0],
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        wobbleOffset: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.015 + Math.random() * 0.02,
        isShaking: false,
        shakeTime: 0,
        isPopped: false,
        popAnimation: 0,
      });
    });
    
    return bubbles;
  }, []);

  // Handle bubble click
  const handleBubbleClick = useCallback((bubble: Bubble) => {
    if (bubble.isPopped || phase !== "playing") return;
    
    const sequence = MODE_INFO[gameMode].sequence;
    const expectedNumber = sequence[currentIndex];
    
    if (bubble.number === expectedNumber) {
      // Correct!
      bubble.isPopped = true;
      bubble.popAnimation = 1;
      
      // Sound and speech
      playPopSound(bubble.number);
      speakNumber(bubble.number);
      
      // Create particles
      createParticles(bubble.x, bubble.y, bubble.color, 20);
      
      // Move to next
      setCurrentIndex(prev => prev + 1);
      
      // Check completion
      if (currentIndex + 1 >= sequence.length) {
        // Game complete!
        setTimeout(() => {
          setPhase("complete");
          playCelebrationSound();
          createConfetti();
          
          // Save best time
          const currentBest = bestTimes[gameMode];
          if (!currentBest || timer < currentBest) {
            const newBestTimes = { ...bestTimes, [gameMode]: timer };
            setBestTimes(newBestTimes);
            localStorage.setItem("number-bubbles-best-times", JSON.stringify(newBestTimes));
          }
        }, 300);
      }
    } else {
      // Wrong number - shake the bubble
      bubble.isShaking = true;
      bubble.shakeTime = 0;
      playErrorSound();
      
      // Stop shaking after 500ms
      setTimeout(() => {
        bubble.isShaking = false;
      }, 500);
    }
  }, [phase, gameMode, currentIndex, playPopSound, speakNumber, createParticles, playErrorSound, bestTimes, timer, playCelebrationSound, createConfetti]);

  // Handle click/touch
  const handleInteraction = useCallback((clientX: number, clientY: number) => {
    if (phase !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Find clicked bubble (check all, not just top-most since we need to validate)
    for (const bubble of bubblesRef.current) {
      if (bubble.isPopped) continue;
      const dist = Math.sqrt((bubble.x - x) ** 2 + (bubble.y - y) ** 2);
      if (dist < bubble.radius) {
        handleBubbleClick(bubble);
        break;
      }
    }
  }, [phase, handleBubbleClick]);

  // Main game loop
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#E8F4FD");
    gradient.addColorStop(1, "#B8E0F7");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw some background bubbles for atmosphere
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 5; i++) {
      const bx = (Math.sin(timestamp / 3000 + i) * 100) + (canvas.width / 6) * (i + 1);
      const by = (Math.cos(timestamp / 4000 + i * 2) * 50) + canvas.height / 2;
      ctx.beginPath();
      ctx.arc(bx, by, 60 + i * 20, 0, Math.PI * 2);
      ctx.fillStyle = BUBBLE_COLORS[i];
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Update and draw bubbles
    bubblesRef.current.forEach(bubble => {
      if (bubble.isPopped) {
        // Pop animation
        bubble.popAnimation -= 0.08;
        if (bubble.popAnimation > 0) {
          ctx.save();
          ctx.globalAlpha = bubble.popAnimation;
          ctx.translate(bubble.x, bubble.y);
          ctx.scale(1 + (1 - bubble.popAnimation) * 0.5, 1 + (1 - bubble.popAnimation) * 0.5);
          
          ctx.beginPath();
          ctx.arc(0, 0, bubble.radius, 0, Math.PI * 2);
          ctx.fillStyle = bubble.color;
          ctx.fill();
          
          ctx.restore();
        }
        return;
      }

      // Update position with slow drift
      bubble.x += bubble.vx;
      bubble.y += bubble.vy;
      bubble.wobbleOffset += bubble.wobbleSpeed;

      // Bounce off edges
      if (bubble.x - bubble.radius < 0 || bubble.x + bubble.radius > canvas.width) {
        bubble.vx *= -1;
        bubble.x = Math.max(bubble.radius, Math.min(canvas.width - bubble.radius, bubble.x));
      }
      if (bubble.y - bubble.radius < 80 || bubble.y + bubble.radius > canvas.height - 20) {
        bubble.vy *= -1;
        bubble.y = Math.max(80 + bubble.radius, Math.min(canvas.height - 20 - bubble.radius, bubble.y));
      }

      const wobbleX = Math.sin(bubble.wobbleOffset) * 3;
      const wobbleY = Math.cos(bubble.wobbleOffset * 1.3) * 2;

      ctx.save();
      
      // Shake effect
      let shakeX = 0;
      if (bubble.isShaking) {
        bubble.shakeTime += 0.3;
        shakeX = Math.sin(bubble.shakeTime * 20) * 8;
      }
      
      ctx.translate(bubble.x + wobbleX + shakeX, bubble.y + wobbleY);

      // Shadow
      ctx.beginPath();
      ctx.arc(4, 4, bubble.radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fill();

      // Main bubble with gradient
      const bubbleGradient = ctx.createRadialGradient(
        -bubble.radius * 0.3, -bubble.radius * 0.3, 0,
        0, 0, bubble.radius
      );
      bubbleGradient.addColorStop(0, "#FFFFFF");
      bubbleGradient.addColorStop(0.2, "#FFFFFF");
      bubbleGradient.addColorStop(0.5, bubble.color);
      bubbleGradient.addColorStop(1, bubble.color);

      ctx.beginPath();
      ctx.arc(0, 0, bubble.radius, 0, Math.PI * 2);
      ctx.fillStyle = bubbleGradient;
      ctx.fill();
      
      // Bubble outline
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Glossy highlight
      ctx.beginPath();
      ctx.arc(-bubble.radius * 0.35, -bubble.radius * 0.35, bubble.radius * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fill();

      // Number
      const fontSize = bubble.radius * 0.7;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Text shadow for readability
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillText(String(bubble.number), 2, 2);
      
      // White text with dark outline
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.lineWidth = 3;
      ctx.strokeText(String(bubble.number), 0, 0);
      ctx.fillText(String(bubble.number), 0, 0);

      ctx.restore();
    });

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.15; // gravity
      particle.life -= 0.025;

      if (particle.life > 0) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * particle.life, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life;
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      }
      return false;
    });

    // Update and draw confetti
    confettiRef.current = confettiRef.current.filter(c => {
      c.x += c.vx;
      c.y += c.vy;
      c.vy += 0.05; // light gravity
      c.rotation += c.rotationSpeed;

      if (c.y < canvas.height + 50) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
        ctx.restore();
        return true;
      }
      return false;
    });

    // Draw UI bar at top
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.fillRect(0, 0, canvas.width, 70);
    ctx.strokeStyle = "#E0E0E0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 70);
    ctx.lineTo(canvas.width, 70);
    ctx.stroke();

    // Progress indicator
    const sequence = MODE_INFO[gameMode].sequence;
    const progress = currentIndex / sequence.length;
    
    // Progress bar background
    ctx.fillStyle = "#E8E8E8";
    ctx.fillRect(20, 25, canvas.width - 40, 20);
    
    // Progress bar fill
    const progressGradient = ctx.createLinearGradient(20, 0, canvas.width - 40, 0);
    progressGradient.addColorStop(0, "#4ECDC4");
    progressGradient.addColorStop(1, "#45B7D1");
    ctx.fillStyle = progressGradient;
    ctx.fillRect(20, 25, (canvas.width - 40) * progress, 20);

    // Timer
    ctx.font = "bold 24px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "#2C3E50";
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    ctx.fillText(`⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`, 20, 60);

    // Current number hint
    if (currentIndex < sequence.length) {
      ctx.font = "bold 22px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#FF6B6B";
      ctx.fillText(`Find: ${sequence[currentIndex]}`, canvas.width / 2, 55);
    }

    // Progress text
    ctx.font = "18px Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillStyle = "#666";
    ctx.fillText(`${currentIndex}/${sequence.length}`, canvas.width - 20, 60);

    if (phase === "playing" || phase === "complete") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [phase, gameMode, currentIndex, timer]);

  // Start game
  const startGame = useCallback((mode: GameMode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setGameMode(mode);
    setCurrentIndex(0);
    setTimer(0);
    bubblesRef.current = createBubbles(mode, canvas.width, canvas.height);
    particlesRef.current = [];
    confettiRef.current = [];
    setPhase("playing");

    // Start timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  }, [createBubbles]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Load best times
  useEffect(() => {
    const saved = localStorage.getItem("number-bubbles-best-times");
    if (saved) {
      try {
        setBestTimes(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
    
    // Load voices for speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Start/stop game loop
  useEffect(() => {
    if (phase === "playing" || phase === "complete") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [phase, gameLoop]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#E8F4FD] to-[#B8E0F7] relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        onClick={(e) => handleInteraction(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleInteraction(touch.clientX, touch.clientY);
        }}
      />

      {/* Menu Overlay */}
      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl text-center">
            <h1 className="text-4xl font-black text-[#4ECDC4] mb-2">🫧 Number Bubbles 🫧</h1>
            <p className="text-gray-600 mb-6">Pop the bubbles in the right order!</p>
            
            <div className="grid grid-cols-1 gap-3 mb-6">
              {(Object.keys(MODE_INFO) as GameMode[]).map(mode => {
                const info = MODE_INFO[mode];
                const best = bestTimes[mode];
                return (
                  <button
                    key={mode}
                    onClick={() => startGame(mode)}
                    className="w-full px-4 py-4 bg-gradient-to-r from-[#4ECDC4] to-[#45B7D1] hover:from-[#3DBDB5] hover:to-[#34A6C0] text-white font-bold rounded-xl transition-all hover:scale-105 text-left"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-lg">{info.name}</div>
                        <div className="text-sm opacity-80">{info.description}</div>
                      </div>
                      {best && (
                        <div className="text-right bg-white/20 px-3 py-1 rounded-lg">
                          <div className="text-xs">Best</div>
                          <div className="font-mono">⏱️ {formatTime(best)}</div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-sm text-gray-500 bg-gray-100 rounded-xl p-3">
              <p>👆 Tap bubbles in order</p>
              <p>❌ Wrong bubble = shake, try again!</p>
              <p>🏆 Beat your best time!</p>
            </div>
          </div>
        </div>
      )}

      {/* Pause Button */}
      {phase === "playing" && (
        <button
          onClick={() => {
            setPhase("paused");
            if (timerRef.current) clearInterval(timerRef.current);
          }}
          className="absolute top-[80px] left-4 bg-white/90 hover:bg-white px-4 py-2 rounded-xl font-bold text-gray-700 shadow-lg transition-all z-10"
        >
          ⏸️ Pause
        </button>
      )}

      {/* Pause Overlay */}
      {phase === "paused" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-3xl font-black text-[#4ECDC4] mb-6">⏸️ Paused</h2>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setPhase("playing");
                  timerRef.current = setInterval(() => setTimer(prev => prev + 1), 1000);
                }}
                className="w-full px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
              >
                ▶️ Resume
              </button>
              <button
                onClick={() => startGame(gameMode)}
                className="w-full px-6 py-3 bg-[#FF6B6B] hover:bg-[#FF5A5A] text-white font-bold rounded-xl transition-all"
              >
                🔄 Restart
              </button>
              <button
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  setPhase("menu");
                }}
                className="w-full px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl transition-all"
              >
                🏠 Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Overlay */}
      {phase === "complete" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center pointer-events-auto">
            <h2 className="text-4xl font-black text-[#4ECDC4] mb-2">🎉 Amazing! 🎉</h2>
            <p className="text-gray-600 mb-4">You completed {MODE_INFO[gameMode].name}!</p>
            
            <div className="my-6 space-y-3">
              <div className="text-3xl font-bold text-[#45B7D1]">
                ⏱️ {formatTime(timer)}
              </div>
              {bestTimes[gameMode] === timer && (
                <p className="text-xl font-bold text-[#FFD700]">🏆 New Best Time! 🏆</p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => startGame(gameMode)}
                className="w-full px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  setPhase("menu");
                }}
                className="w-full px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl transition-all"
              >
                🏠 Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
