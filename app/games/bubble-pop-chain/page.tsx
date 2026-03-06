"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Bubble {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  velocityY: number;
  wobbleOffset: number;
  wobbleSpeed: number;
  isGolden: boolean;
  isIce: boolean;
  isBomb: boolean;
  isRainbow: boolean;
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

interface FloatingScore {
  id: number;
  x: number;
  y: number;
  score: number;
  life: number;
}

type Difficulty = "easy" | "medium" | "hard";
type GamePhase = "menu" | "playing" | "paused" | "gameOver";

const PASTEL_COLORS = [
  "#FFB3BA", "#BAFFC9", "#BAE1FF", "#FFFFBA", "#FFDFBA",
  "#E0BBE4", "#957DAD", "#D4A5A5", "#A8D8EA", "#AA96DA",
];

const DIFFICULTY_SETTINGS = {
  easy: { spawnRate: 2000, maxBubbles: 20, speedMultiplier: 0.6 },
  medium: { spawnRate: 1500, maxBubbles: 25, speedMultiplier: 0.8 },
  hard: { spawnRate: 1000, maxBubbles: 30, speedMultiplier: 1.0 },
};

export default function BubblePopChainPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [chainMultiplier, setChainMultiplier] = useState(1);
  
  const bubblesRef = useRef<Bubble[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingScoresRef = useRef<FloatingScore[]>([]);
  const animationRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const bubbleIdRef = useRef(0);
  const chainTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play pop sound
  const playPopSound = useCallback((pitch: number = 1) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(400 * pitch, ctx.currentTime);
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio not available
    }
  }, [getAudioContext]);

  // Create a new bubble
  const createBubble = useCallback((canvasWidth: number, canvasHeight: number): Bubble => {
    const radius = 20 + Math.random() * 40;
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const specialRoll = Math.random();
    
    return {
      id: bubbleIdRef.current++,
      x: radius + Math.random() * (canvasWidth - radius * 2),
      y: canvasHeight + radius,
      radius,
      color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
      velocityY: (0.3 + Math.random() * 0.5) * settings.speedMultiplier,
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      isGolden: specialRoll < 0.05,
      isIce: specialRoll >= 0.05 && specialRoll < 0.08,
      isBomb: specialRoll >= 0.08 && specialRoll < 0.11,
      isRainbow: specialRoll >= 0.11 && specialRoll < 0.14,
    };
  }, [difficulty]);

  // Create particles
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      particlesRef.current.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1,
        radius: 3 + Math.random() * 5,
      });
    }
  }, []);

  // Create floating score
  const createFloatingScore = useCallback((x: number, y: number, points: number) => {
    floatingScoresRef.current.push({
      id: Date.now() + Math.random(),
      x,
      y,
      score: points,
      life: 1,
    });
  }, []);

  // Pop a bubble and check for chain reactions
  const popBubble = useCallback((bubble: Bubble, canvasWidth: number) => {
    const index = bubblesRef.current.findIndex(b => b.id === bubble.id);
    if (index === -1) return;

    bubblesRef.current.splice(index, 1);

    // Calculate score
    let points = Math.round(bubble.radius * chainMultiplier);
    if (bubble.isGolden) points *= 5;
    if (bubble.isBomb) points = Math.round(points * 1.5);

    setScore(prev => prev + points);
    createFloatingScore(bubble.x, bubble.y, points);
    createParticles(bubble.x, bubble.y, bubble.isGolden ? "#FFD700" : bubble.color);
    playPopSound(bubble.radius / 40);

    // Chain reaction
    const chainRadius = bubble.radius * 1.5;
    const nearbyBubbles = bubblesRef.current.filter(b => {
      const dist = Math.sqrt((b.x - bubble.x) ** 2 + (b.y - bubble.y) ** 2);
      return dist < chainRadius + b.radius;
    });

    if (nearbyBubbles.length > 0) {
      setCombo(prev => {
        const newCombo = prev + 1;
        setMaxCombo(max => Math.max(max, newCombo));
        return newCombo;
      });
      setChainMultiplier(prev => Math.min(prev + 0.5, 5));

      // Reset chain timeout
      if (chainTimeoutRef.current) clearTimeout(chainTimeoutRef.current);
      chainTimeoutRef.current = setTimeout(() => {
        setCombo(0);
        setChainMultiplier(1);
      }, 1000);

      // Pop nearby bubbles with delay for visual effect
      nearbyBubbles.forEach((b, i) => {
        setTimeout(() => popBubble(b, canvasWidth), 100 * (i + 1));
      });
    }

    // Special bubble effects
    if (bubble.isIce) {
      // Freeze nearby bubbles (slow them down)
      bubblesRef.current.forEach(b => {
        const dist = Math.sqrt((b.x - bubble.x) ** 2 + (b.y - bubble.y) ** 2);
        if (dist < bubble.radius * 3) {
          b.velocityY *= 0.3;
        }
      });
    }

    if (bubble.isBomb) {
      // Pop all bubbles in radius
      const bombRadius = bubble.radius * 2.5;
      bubblesRef.current = bubblesRef.current.filter(b => {
        const dist = Math.sqrt((b.x - bubble.x) ** 2 + (b.y - bubble.y) ** 2);
        if (dist < bombRadius && b.id !== bubble.id) {
          createParticles(b.x, b.y, b.color);
          playPopSound(b.radius / 40);
          return false;
        }
        return true;
      });
    }
  }, [chainMultiplier, createParticles, createFloatingScore, playPopSound]);

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

    // Find clicked bubble (top-most first)
    for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
      const bubble = bubblesRef.current[i];
      const dist = Math.sqrt((bubble.x - x) ** 2 + (bubble.y - y) ** 2);
      if (dist < bubble.radius) {
        popBubble(bubble, canvas.width);
        break;
      }
    }
  }, [phase, popBubble]);

  // Main game loop
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const settings = DIFFICULTY_SETTINGS[difficulty];

    // Clear canvas
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#FFFFFF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Spawn bubbles
    if (timestamp - lastSpawnRef.current > settings.spawnRate && 
        bubblesRef.current.length < settings.maxBubbles) {
      bubblesRef.current.push(createBubble(canvas.width, canvas.height));
      lastSpawnRef.current = timestamp;
    }

    // Update and draw bubbles
    let gameOver = false;
    bubblesRef.current = bubblesRef.current.filter(bubble => {
      // Update position
      bubble.y -= bubble.velocityY;
      bubble.wobbleOffset += bubble.wobbleSpeed;
      const wobbleX = Math.sin(bubble.wobbleOffset) * 2;

      // Draw bubble
      ctx.save();
      ctx.translate(bubble.x + wobbleX, bubble.y);

      // Shadow
      ctx.beginPath();
      ctx.arc(3, 3, bubble.radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fill();

      // Main bubble
      const bubbleGradient = ctx.createRadialGradient(
        -bubble.radius * 0.3, -bubble.radius * 0.3, 0,
        0, 0, bubble.radius
      );
      
      let baseColor = bubble.color;
      if (bubble.isGolden) baseColor = "#FFD700";
      if (bubble.isIce) baseColor = "#B3E5FC";
      if (bubble.isBomb) baseColor = "#FF5722";
      if (bubble.isRainbow) {
        baseColor = `hsl(${(timestamp / 10) % 360}, 80%, 70%)`;
      }

      bubbleGradient.addColorStop(0, "#FFFFFF");
      bubbleGradient.addColorStop(0.3, baseColor);
      bubbleGradient.addColorStop(1, baseColor);

      ctx.beginPath();
      ctx.arc(0, 0, bubble.radius, 0, Math.PI * 2);
      ctx.fillStyle = bubbleGradient;
      ctx.fill();

      // Glossy highlight
      ctx.beginPath();
      ctx.arc(-bubble.radius * 0.3, -bubble.radius * 0.3, bubble.radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fill();

      // Special indicators
      if (bubble.isGolden) {
        ctx.font = `${bubble.radius * 0.6}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⭐", 0, 0);
      }
      if (bubble.isBomb) {
        ctx.font = `${bubble.radius * 0.5}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("💣", 0, 0);
      }
      if (bubble.isIce) {
        ctx.font = `${bubble.radius * 0.5}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("❄️", 0, 0);
      }

      ctx.restore();

      // Check game over
      if (bubble.y - bubble.radius < 0) {
        gameOver = true;
      }

      return bubble.y + bubble.radius > -50;
    });

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // gravity
      particle.life -= 0.02;

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

    // Update and draw floating scores
    floatingScoresRef.current = floatingScoresRef.current.filter(fs => {
      fs.y -= 2;
      fs.life -= 0.02;

      if (fs.life > 0) {
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "#FFD700";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.globalAlpha = fs.life;
        ctx.strokeText(`+${fs.score}`, fs.x, fs.y);
        ctx.fillText(`+${fs.score}`, fs.x, fs.y);
        ctx.globalAlpha = 1;
        return true;
      }
      return false;
    });

    // Draw UI
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "right";
    ctx.fillStyle = "#2C3E50";
    ctx.fillText(`Score: ${score}`, canvas.width - 20, 40);

    if (combo > 0) {
      ctx.font = "bold 24px Arial";
      ctx.fillStyle = "#FF6B6B";
      ctx.fillText(`Combo: ${combo}x`, canvas.width - 20, 70);
      ctx.fillText(`Multiplier: ${chainMultiplier.toFixed(1)}x`, canvas.width - 20, 100);
    }

    if (gameOver) {
      setPhase("gameOver");
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("bubble-pop-high-score", String(score));
      }
    }

    if (phase === "playing") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [difficulty, createBubble, phase, score, combo, chainMultiplier, highScore, popBubble]);

  // Start game
  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setChainMultiplier(1);
    bubblesRef.current = [];
    particlesRef.current = [];
    floatingScoresRef.current = [];
    lastSpawnRef.current = 0;
    setPhase("playing");
  }, []);

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

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("bubble-pop-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Start/stop game loop
  useEffect(() => {
    if (phase === "playing") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [phase, gameLoop]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "p") {
        if (phase === "playing") setPhase("paused");
        else if (phase === "paused") setPhase("playing");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#87CEEB] to-[#FFFFFF] relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        onClick={(e) => handleInteraction(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          handleInteraction(touch.clientX, touch.clientY);
        }}
      />

      {/* Menu Overlay */}
      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h1 className="text-4xl font-black text-[#FF6B6B] mb-2">🫧 Bubble Pop Chain 🫧</h1>
            <p className="text-gray-600 mb-6">Pop bubbles and create chain reactions!</p>
            
            {highScore > 0 && (
              <p className="text-xl font-bold text-[#FFD700] mb-4">
                🏆 High Score: {highScore}
              </p>
            )}

            <div className="space-y-3">
              <p className="font-bold text-gray-700">Select Difficulty:</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => startGame("easy")}
                  className="px-6 py-3 bg-green-400 hover:bg-green-500 text-white font-bold rounded-xl transition-all hover:scale-105"
                >
                  Easy 🌱
                </button>
                <button
                  onClick={() => startGame("medium")}
                  className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-xl transition-all hover:scale-105"
                >
                  Medium ⭐
                </button>
                <button
                  onClick={() => startGame("hard")}
                  className="px-6 py-3 bg-red-400 hover:bg-red-500 text-white font-bold rounded-xl transition-all hover:scale-105"
                >
                  Hard 🔥
                </button>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              <p>⭐ Golden = 5x points | 💣 Bomb = Chain explosion | ❄️ Ice = Slows nearby</p>
            </div>
          </div>
        </div>
      )}

      {/* Pause Button */}
      {phase === "playing" && (
        <button
          onClick={() => setPhase("paused")}
          className="absolute top-4 left-4 bg-white/80 hover:bg-white px-4 py-2 rounded-xl font-bold text-gray-700 shadow-lg transition-all"
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
                onClick={() => setPhase("playing")}
                className="w-full px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
              >
                ▶️ Resume
              </button>
              <button
                onClick={() => startGame(difficulty)}
                className="w-full px-6 py-3 bg-[#FF6B6B] hover:bg-[#FF5A5A] text-white font-bold rounded-xl transition-all"
              >
                🔄 Restart
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl transition-all"
              >
                🏠 Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-3xl font-black text-[#FF6B6B] mb-2">🎮 Game Over!</h2>
            
            <div className="my-6 space-y-2">
              <p className="text-2xl font-bold text-gray-700">
                Score: <span className="text-[#4ECDC4]">{score}</span>
              </p>
              <p className="text-lg text-gray-600">
                Max Combo: <span className="font-bold">{maxCombo}x</span>
              </p>
              {score >= highScore && score > 0 && (
                <p className="text-xl font-bold text-[#FFD700]">🏆 New High Score! 🏆</p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => startGame(difficulty)}
                className="w-full px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => setPhase("menu")}
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
