"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type GamePhase = "menu" | "playing" | "gameOver";

interface Fish {
  id: number;
  x: number;
  y: number;
  size: "small" | "medium" | "large";
  speed: number;
  direction: 1 | -1;
  points: number;
  color: string;
}

interface Jellyfish {
  id: number;
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  pulsePhase: number;
}

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
}

interface CatchEffect {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

const FISH_COLORS = {
  small: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"],
  medium: ["#FF8C42", "#6C5CE7", "#00B894", "#E17055", "#74B9FF"],
  large: ["#FFD700", "#FF4757", "#2ED573", "#1E90FF", "#FF6348"],
};

const FISH_POINTS = { small: 5, medium: 15, large: 30 };
const FISH_SIZES = { small: 25, medium: 40, large: 60 };

export default function FishingFrenzyPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [depth, setDepth] = useState(0);
  const [isHolding, setIsHolding] = useState(false);

  const hookRef = useRef({ x: 0, y: 50, targetY: 50, speed: 4 });
  const fishRef = useRef<Fish[]>([]);
  const jellyfishRef = useRef<Jellyfish[]>([]);
  const bubblesRef = useRef<Bubble[]>([]);
  const catchEffectsRef = useRef<CatchEffect[]>([]);
  const animationRef = useRef<number>(0);
  const fishIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sound effects
  const playSound = useCallback((type: "catch" | "jellyfish" | "splash" | "tick") => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      if (type === "catch") {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(523, ctx.currentTime);
        oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
      } else if (type === "jellyfish") {
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
      } else if (type === "splash") {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
      } else if (type === "tick") {
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
      }
    } catch (e) {
      // Audio not supported
    }
  }, []);

  // Create catch effect
  const createCatchEffect = useCallback((x: number, y: number, text: string, color: string) => {
    catchEffectsRef.current.push({
      id: Date.now() + Math.random(),
      x,
      y,
      text,
      color,
      life: 1,
    });
  }, []);

  // Check collision between hook and fish
  const checkCollision = useCallback((fish: Fish, hookX: number, hookY: number): boolean => {
    const fishWidth = FISH_SIZES[fish.size];
    const fishHeight = fishWidth * 0.6;
    const hookSize = 20;

    return (
      hookX < fish.x + fishWidth / 2 + hookSize &&
      hookX > fish.x - fishWidth / 2 - hookSize &&
      hookY < fish.y + fishHeight / 2 + hookSize &&
      hookY > fish.y - fishHeight / 2 - hookSize
    );
  }, []);

  // Check collision with jellyfish
  const checkJellyfishCollision = useCallback((jelly: Jellyfish, hookX: number, hookY: number): boolean => {
    const dist = Math.sqrt((hookX - jelly.x) ** 2 + (hookY - jelly.y) ** 2);
    return dist < 35;
  }, []);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || phase !== "playing") return;

    const waterLevel = 80;

    // Draw gradient sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, waterLevel);
    skyGradient.addColorStop(0, "#87CEEB");
    skyGradient.addColorStop(1, "#E0F7FA");
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, waterLevel);

    // Draw sun
    ctx.beginPath();
    ctx.arc(canvas.width - 80, 50, 35, 0, Math.PI * 2);
    ctx.fillStyle = "#FFD700";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(canvas.width - 80, 50, 45, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
    ctx.fill();

    // Draw water gradient
    const waterGradient = ctx.createLinearGradient(0, waterLevel, 0, canvas.height);
    waterGradient.addColorStop(0, "#4FC3F7");
    waterGradient.addColorStop(0.3, "#0288D1");
    waterGradient.addColorStop(0.7, "#01579B");
    waterGradient.addColorStop(1, "#003d5c");
    ctx.fillStyle = waterGradient;
    ctx.fillRect(0, waterLevel, canvas.width, canvas.height - waterLevel);

    // Draw water surface waves
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 5) {
      const waveY = waterLevel + Math.sin((x + timestamp / 100) * 0.05) * 5;
      if (x === 0) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.stroke();

    // Update bubbles (background decoration)
    bubblesRef.current = bubblesRef.current.filter(bubble => {
      bubble.y -= bubble.speed;
      bubble.x += Math.sin(timestamp / 500 + bubble.id) * 0.3;

      ctx.beginPath();
      ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();

      return bubble.y > waterLevel;
    });

    // Spawn bubbles occasionally
    if (Math.random() < 0.02) {
      bubblesRef.current.push({
        id: Date.now() + Math.random(),
        x: Math.random() * canvas.width,
        y: canvas.height,
        size: 3 + Math.random() * 8,
        speed: 0.5 + Math.random() * 1.5,
      });
    }

    // Spawn fish
    if (timestamp - lastSpawnRef.current > 800) {
      const sizes: ("small" | "medium" | "large")[] = ["small", "small", "small", "medium", "medium", "large"];
      const size = sizes[Math.floor(Math.random() * sizes.length)];
      const colors = FISH_COLORS[size];
      const direction = Math.random() > 0.5 ? 1 : -1;

      fishRef.current.push({
        id: fishIdRef.current++,
        x: direction === 1 ? -50 : canvas.width + 50,
        y: waterLevel + 50 + Math.random() * (canvas.height - waterLevel - 150),
        size,
        speed: 1 + Math.random() * 2 + (size === "small" ? 1 : size === "medium" ? 0.5 : 0),
        direction,
        points: FISH_POINTS[size],
        color: colors[Math.floor(Math.random() * colors.length)],
      });
      lastSpawnRef.current = timestamp;
    }

    // Spawn jellyfish (rarely)
    if (Math.random() < 0.003 && jellyfishRef.current.length < 3) {
      const direction = Math.random() > 0.5 ? 1 : -1;
      jellyfishRef.current.push({
        id: Date.now(),
        x: direction === 1 ? -40 : canvas.width + 40,
        y: waterLevel + 80 + Math.random() * (canvas.height - waterLevel - 200),
        speed: 0.5 + Math.random() * 0.5,
        direction,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Update and draw fish
    fishRef.current = fishRef.current.filter(fish => {
      fish.x += fish.speed * fish.direction;

      // Draw fish
      const fishSize = FISH_SIZES[fish.size];
      ctx.save();
      ctx.translate(fish.x, fish.y);
      if (fish.direction === -1) ctx.scale(-1, 1);

      // Fish body
      ctx.beginPath();
      ctx.ellipse(0, 0, fishSize / 2, fishSize / 4, 0, 0, Math.PI * 2);
      ctx.fillStyle = fish.color;
      ctx.fill();

      // Fish tail
      ctx.beginPath();
      ctx.moveTo(-fishSize / 2, 0);
      ctx.lineTo(-fishSize / 2 - fishSize / 3, -fishSize / 4);
      ctx.lineTo(-fishSize / 2 - fishSize / 3, fishSize / 4);
      ctx.closePath();
      ctx.fill();

      // Fish eye
      ctx.beginPath();
      ctx.arc(fishSize / 4, -fishSize / 10, fishSize / 10, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(fishSize / 4 + 2, -fishSize / 10, fishSize / 15, 0, Math.PI * 2);
      ctx.fillStyle = "black";
      ctx.fill();

      // Fish fin
      ctx.beginPath();
      ctx.moveTo(0, -fishSize / 4);
      ctx.lineTo(fishSize / 6, -fishSize / 2);
      ctx.lineTo(fishSize / 4, -fishSize / 4);
      ctx.closePath();
      ctx.fillStyle = fish.color;
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.restore();

      return fish.x > -100 && fish.x < canvas.width + 100;
    });

    // Update and draw jellyfish
    jellyfishRef.current = jellyfishRef.current.filter(jelly => {
      jelly.x += jelly.speed * jelly.direction;
      jelly.pulsePhase += 0.1;
      const pulse = Math.sin(jelly.pulsePhase) * 0.2;

      ctx.save();
      ctx.translate(jelly.x, jelly.y);

      // Jellyfish bell
      ctx.beginPath();
      ctx.ellipse(0, 0, 25 * (1 + pulse), 20 * (1 + pulse * 0.5), 0, Math.PI, 0);
      ctx.fillStyle = "rgba(255, 100, 200, 0.7)";
      ctx.fill();

      // Jellyfish glow
      ctx.beginPath();
      ctx.ellipse(0, 5, 15, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 150, 220, 0.5)";
      ctx.fill();

      // Tentacles
      ctx.strokeStyle = "rgba(255, 100, 200, 0.6)";
      ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 8, 15);
        const wave = Math.sin(jelly.pulsePhase + i * 0.5) * 5;
        ctx.quadraticCurveTo(i * 8 + wave, 35, i * 8, 50);
        ctx.stroke();
      }

      ctx.restore();

      return jelly.x > -60 && jelly.x < canvas.width + 60;
    });

    // Update hook position based on holding
    const hook = hookRef.current;
    const maxDepth = canvas.height - 60;
    
    if (isHolding) {
      hook.targetY = Math.min(maxDepth, hook.targetY + hook.speed);
    } else {
      hook.targetY = Math.max(50, hook.targetY - hook.speed * 1.5);
    }
    
    // Smooth hook movement
    hook.y += (hook.targetY - hook.y) * 0.15;
    
    // Calculate depth percentage
    const depthPercent = Math.round(((hook.y - waterLevel) / (maxDepth - waterLevel)) * 100);
    setDepth(Math.max(0, depthPercent));

    // Draw fishing line
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hook.x, 0);
    ctx.lineTo(hook.x, Math.max(waterLevel, hook.y));
    ctx.stroke();

    // Draw water droplets on line when coming up
    if (!isHolding && hook.y < waterLevel) {
      ctx.fillStyle = "#4FC3F7";
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(hook.x + Math.sin(timestamp / 100 + i) * 5, waterLevel + i * 15, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw hook
    ctx.save();
    ctx.translate(hook.x, hook.y);
    
    // Hook shine
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 15);
    ctx.arc(10, 15, 10, Math.PI, 0, true);
    ctx.lineTo(20, 5);
    ctx.stroke();

    // Hook point
    ctx.beginPath();
    ctx.moveTo(20, 5);
    ctx.lineTo(15, 0);
    ctx.strokeStyle = "#C0C0C0";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();

    // Check fish catches
    const fishesToRemove: number[] = [];
    fishRef.current.forEach(fish => {
      if (hook.y > waterLevel && checkCollision(fish, hook.x, hook.y)) {
        fishesToRemove.push(fish.id);
        setScore(s => s + fish.points);
        playSound("catch");
        createCatchEffect(fish.x, fish.y, `+${fish.points}`, fish.color);
      }
    });
    fishRef.current = fishRef.current.filter(f => !fishesToRemove.includes(f.id));

    // Check jellyfish collision (game over)
    let hitJellyfish = false;
    jellyfishRef.current.forEach(jelly => {
      if (hook.y > waterLevel && checkJellyfishCollision(jelly, hook.x, hook.y)) {
        hitJellyfish = true;
      }
    });

    // Update and draw catch effects
    catchEffectsRef.current = catchEffectsRef.current.filter(effect => {
      effect.y -= 1;
      effect.life -= 0.02;

      if (effect.life > 0) {
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = effect.color;
        ctx.globalAlpha = effect.life;
        ctx.fillText(effect.text, effect.x, effect.y);
        ctx.globalAlpha = 1;
        return true;
      }
      return false;
    });

    // Draw UI
    // Score
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 4;
    ctx.fillText(`🐟 Score: ${score}`, 20, 40);

    // Timer
    ctx.textAlign = "right";
    ctx.fillStyle = timeLeft <= 10 ? "#FF6B6B" : "white";
    ctx.fillText(`⏱️ ${timeLeft}s`, canvas.width - 20, 40);

    // Depth meter
    const meterX = canvas.width - 50;
    const meterY = 80;
    const meterHeight = canvas.height - 120;
    
    // Meter background
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(meterX, meterY, 25, meterHeight);
    
    // Meter fill
    const fillHeight = (depth / 100) * meterHeight;
    const depthGradient = ctx.createLinearGradient(0, meterY, 0, meterY + meterHeight);
    depthGradient.addColorStop(0, "#4FC3F7");
    depthGradient.addColorStop(1, "#003d5c");
    ctx.fillStyle = depthGradient;
    ctx.fillRect(meterX + 3, meterY + meterHeight - fillHeight, 19, fillHeight);
    
    // Meter border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(meterX, meterY, 25, meterHeight);

    // Depth label
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.fillText(`${depth}%`, meterX + 12, meterY + meterHeight + 20);

    ctx.shadowBlur = 0;

    if (hitJellyfish) {
      playSound("jellyfish");
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("fishing-frenzy-high-score", String(score));
      }
      setPhase("gameOver");
      return;
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [phase, score, highScore, timeLeft, isHolding, depth, checkCollision, checkJellyfishCollision, playSound, createCatchEffect]);

  // Timer countdown
  useEffect(() => {
    if (phase !== "playing") return;
    
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          playSound("splash");
          if (score > highScore) {
            setHighScore(score);
            localStorage.setItem("fishing-frenzy-high-score", String(score));
          }
          setPhase("gameOver");
          return 0;
        }
        if (t <= 10) playSound("tick");
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, score, highScore, playSound]);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(60);
    setDepth(0);
    setIsHolding(false);
    hookRef.current = { x: canvasRef.current!.width / 2, y: 50, targetY: 50, speed: 4 };
    fishRef.current = [];
    jellyfishRef.current = [];
    bubblesRef.current = [];
    catchEffectsRef.current = [];
    lastSpawnRef.current = 0;
    setPhase("playing");
  }, []);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      hookRef.current.x = canvas.width / 2;
    };
    
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("fishing-frenzy-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Game loop
  useEffect(() => {
    if (phase === "playing") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [phase, gameLoop]);

  // Mouse/touch handlers
  useEffect(() => {
    const handleStart = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (phase === "playing") {
        setIsHolding(true);
        
        // Also move hook horizontally on touch
        if ("touches" in e) {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            hookRef.current.x = e.touches[0].clientX - rect.left;
          }
        }
      }
    };

    const handleEnd = () => {
      setIsHolding(false);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (phase === "playing") {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const x = "touches" in e ? e.touches[0].clientX : e.clientX;
          hookRef.current.x = x - rect.left;
        }
      }
    };

    window.addEventListener("mousedown", handleStart);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchstart", handleStart, { passive: false });
    window.addEventListener("touchend", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });

    return () => {
      window.removeEventListener("mousedown", handleStart);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchmove", handleMove);
    };
  }, [phase]);

  const endReason = timeLeft === 0 ? "Time's Up!" : "⚡ Zap!";

  return (
    <main className="min-h-screen bg-[#0288D1] relative overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h1 className="text-5xl font-black text-[#0288D1] mb-2">🎣 Fishing Frenzy</h1>
            <p className="text-gray-600 mb-4 text-lg">Hold to lower your hook and catch fish!</p>
            
            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
              <p className="font-bold text-gray-700 mb-2">🐟 Fish Points:</p>
              <div className="flex justify-around text-sm">
                <span className="text-[#FF6B6B]">Small: 5</span>
                <span className="text-[#FF8C42]">Medium: 15</span>
                <span className="text-[#FFD700]">Large: 30</span>
              </div>
              <p className="text-center text-purple-500 mt-2 font-bold">⚠️ Avoid Jellyfish!</p>
            </div>

            {highScore > 0 && (
              <p className="text-2xl font-bold text-[#FFD700] mb-4">🏆 High Score: {highScore}</p>
            )}
            
            <button
              onClick={startGame}
              className="w-full px-8 py-5 bg-[#0288D1] hover:bg-[#01579B] text-white font-bold rounded-xl text-2xl transition-all shadow-lg active:scale-95"
            >
              ▶️ Start Fishing!
            </button>
          </div>
        </div>
      )}

      {phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-4xl font-black text-[#0288D1] mb-2">
              {timeLeft === 0 ? "⏱️ Time's Up!" : "⚡ Zap!"}
            </h2>
            {timeLeft > 0 && (
              <p className="text-purple-500 mb-2">Watch out for jellyfish!</p>
            )}
            <p className="text-3xl font-bold text-gray-700 my-4">🐟 {score} Points</p>
            {score >= highScore && score > 0 && (
              <p className="text-xl font-bold text-[#FFD700] mb-4 animate-pulse">🏆 New High Score!</p>
            )}
            <div className="space-y-3">
              <button
                onClick={startGame}
                className="w-full px-6 py-4 bg-[#0288D1] text-white font-bold rounded-xl text-xl transition-all active:scale-95"
              >
                🎣 Play Again
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-300 text-gray-700 font-bold rounded-xl transition-all active:scale-95"
              >
                🏠 Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
