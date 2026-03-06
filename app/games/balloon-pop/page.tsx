"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Balloon {
  id: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  velocityY: number;
  wobbleOffset: number;
  wobbleSpeed: number;
  type: "normal" | "golden" | "rainbow" | "bomb";
  points: number;
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
  text: string;
  color: string;
  life: number;
}

type GamePhase = "menu" | "playing" | "paused" | "gameOver";

const BALLOON_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#FFE66D", // Yellow
  "#95E1D3", // Mint
  "#F38181", // Coral
  "#AA96DA", // Purple
  "#FCBAD3", // Pink
  "#A8D8EA", // Light Blue
  "#FF9F43", // Orange
  "#26DE81", // Green
];

const POINTS_BY_COLOR: { [key: string]: number } = {
  "#FF6B6B": 10,   // Red
  "#4ECDC4": 10,   // Teal
  "#FFE66D": 15,   // Yellow - slightly more
  "#95E1D3": 10,   // Mint
  "#F38181": 10,   // Coral
  "#AA96DA": 15,   // Purple - slightly more
  "#FCBAD3": 10,   // Pink
  "#A8D8EA": 10,   // Light Blue
  "#FF9F43": 15,   // Orange - slightly more
  "#26DE81": 10,   // Green
};

export default function BalloonPopPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameSpeed, setGameSpeed] = useState(1);
  
  const balloonsRef = useRef<Balloon[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingScoresRef = useRef<FloatingScore[]>([]);
  const animationRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const balloonIdRef = useRef(0);
  const lastPopTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play pop sound with varying pitch
  const playPopSound = useCallback((pitch: number = 1, isGolden: boolean = false, isBomb: boolean = false) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (isBomb) {
        // Low boom sound for bomb
        oscillator.frequency.setValueAtTime(100, ctx.currentTime);
        oscillator.type = "sawtooth";
        gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
      } else if (isGolden) {
        // Magical sound for golden balloon
        oscillator.frequency.setValueAtTime(600, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1);
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
      } else {
        // Normal pop
        oscillator.frequency.setValueAtTime(400 * pitch, ctx.currentTime);
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.12);
      }
    } catch {
      // Audio not available
    }
  }, [getAudioContext]);

  // Create a new balloon
  const createBalloon = useCallback((canvasWidth: number, canvasHeight: number): Balloon => {
    const radius = 30 + Math.random() * 25;
    const typeRoll = Math.random();
    let type: Balloon["type"] = "normal";
    let color: string;
    let points: number;
    
    if (typeRoll < 0.05) {
      // 5% chance golden
      type = "golden";
      color = "#FFD700";
      points = 50;
    } else if (typeRoll < 0.10) {
      // 5% chance rainbow
      type = "rainbow";
      color = "rainbow";
      points = 30;
    } else if (typeRoll < 0.18) {
      // 8% chance bomb
      type = "bomb";
      color = "#333333";
      points = -25;
    } else {
      // Normal balloon
      type = "normal";
      color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
      points = POINTS_BY_COLOR[color] || 10;
    }

    return {
      id: balloonIdRef.current++,
      x: radius + Math.random() * (canvasWidth - radius * 2),
      y: canvasHeight + radius,
      radius,
      color,
      velocityY: (0.8 + Math.random() * 0.6) * gameSpeed,
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.015 + Math.random() * 0.02,
      type,
      points,
    };
  }, [gameSpeed]);

  // Create particles for pop effect
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 12) => {
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

  // Create floating score text
  const createFloatingScore = useCallback((x: number, y: number, text: string, color: string) => {
    floatingScoresRef.current.push({
      id: Date.now() + Math.random(),
      x,
      y,
      text,
      color,
      life: 1,
    });
  }, []);

  // Pop a balloon
  const popBalloon = useCallback((balloon: Balloon) => {
    const index = balloonsRef.current.findIndex(b => b.id === balloon.id);
    if (index === -1) return;

    balloonsRef.current.splice(index, 1);

    const now = Date.now();
    const isCombo = now - lastPopTimeRef.current < 800;
    lastPopTimeRef.current = now;

    let points = balloon.points;
    let comboCount = 0;

    if (balloon.type !== "bomb") {
      if (isCombo) {
        setCombo(prev => {
          comboCount = prev + 1;
          setMaxCombo(max => Math.max(max, comboCount));
          return comboCount;
        });
        points = Math.round(points * (1 + comboCount * 0.2)); // Combo bonus
      } else {
        setCombo(0);
      }
    }

    setScore(prev => Math.max(0, prev + points));

    // Visual effects
    let particleColor = balloon.type === "rainbow" ? "#FF69B4" : balloon.color;
    if (balloon.type === "golden") particleColor = "#FFD700";
    if (balloon.type === "bomb") particleColor = "#FF4500";
    
    createParticles(balloon.x, balloon.y, particleColor, balloon.type === "bomb" ? 20 : 12);

    // Floating text
    if (points > 0) {
      const text = comboCount > 1 ? `+${points} (${comboCount}x COMBO!)` : `+${points}`;
      createFloatingScore(balloon.x, balloon.y, text, balloon.type === "golden" ? "#FFD700" : "#22C55E");
    } else {
      createFloatingScore(balloon.x, balloon.y, `${points}`, "#EF4444");
    }

    // Sound
    playPopSound(balloon.radius / 40, balloon.type === "golden", balloon.type === "bomb");
  }, [createParticles, createFloatingScore, playPopSound]);

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

    // Find clicked balloon (top-most first)
    for (let i = balloonsRef.current.length - 1; i >= 0; i--) {
      const balloon = balloonsRef.current[i];
      const dist = Math.sqrt((balloon.x - x) ** 2 + (balloon.y - y) ** 2);
      if (dist < balloon.radius) {
        popBalloon(balloon);
        break;
      }
    }
  }, [phase, popBalloon]);

  // Main game loop
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Calculate elapsed time for speed increase
    const elapsed = (timestamp - startTimeRef.current) / 1000;
    const currentSpeed = 1 + elapsed * 0.015; // Speed increases over time
    setGameSpeed(currentSpeed);

    // Spawn rate decreases as speed increases
    const spawnRate = Math.max(400, 1000 - elapsed * 10);

    // Clear canvas with sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(0.5, "#B0E0E6");
    gradient.addColorStop(1, "#F0F8FF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw some clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    drawCloud(ctx, 100, 80, 60);
    drawCloud(ctx, canvas.width - 150, 120, 50);
    drawCloud(ctx, canvas.width / 2, 60, 70);

    // Spawn balloons
    if (timestamp - lastSpawnRef.current > spawnRate) {
      balloonsRef.current.push(createBalloon(canvas.width, canvas.height));
      lastSpawnRef.current = timestamp;
    }

    // Update and draw balloons
    balloonsRef.current = balloonsRef.current.filter(balloon => {
      // Update position
      balloon.y -= balloon.velocityY * currentSpeed;
      balloon.wobbleOffset += balloon.wobbleSpeed;
      const wobbleX = Math.sin(balloon.wobbleOffset) * 3;

      // Draw balloon
      ctx.save();
      ctx.translate(balloon.x + wobbleX, balloon.y);

      // Draw string
      ctx.beginPath();
      ctx.moveTo(0, balloon.radius);
      ctx.quadraticCurveTo(wobbleX * 2, balloon.radius + 30, 0, balloon.radius + 50);
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Shadow
      ctx.beginPath();
      ctx.ellipse(4, 4, balloon.radius, balloon.radius * 1.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fill();

      // Main balloon body (oval shape)
      let displayColor = balloon.color;
      if (balloon.type === "rainbow") {
        // Rainbow gradient
        const hue = (timestamp / 5 + balloon.id * 20) % 360;
        displayColor = `hsl(${hue}, 90%, 60%)`;
      }

      const balloonGradient = ctx.createRadialGradient(
        -balloon.radius * 0.3, -balloon.radius * 0.3, 0,
        0, 0, balloon.radius
      );
      balloonGradient.addColorStop(0, "#FFFFFF");
      balloonGradient.addColorStop(0.2, lightenColor(displayColor, 30));
      balloonGradient.addColorStop(0.7, displayColor);
      balloonGradient.addColorStop(1, darkenColor(displayColor, 20));

      ctx.beginPath();
      ctx.ellipse(0, 0, balloon.radius, balloon.radius * 1.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = balloonGradient;
      ctx.fill();

      // Glossy highlight
      ctx.beginPath();
      ctx.ellipse(-balloon.radius * 0.35, -balloon.radius * 0.4, balloon.radius * 0.25, balloon.radius * 0.3, -0.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fill();

      // Knot at bottom
      ctx.beginPath();
      ctx.moveTo(-6, balloon.radius * 1.15);
      ctx.lineTo(0, balloon.radius * 1.25);
      ctx.lineTo(6, balloon.radius * 1.15);
      ctx.closePath();
      ctx.fillStyle = darkenColor(displayColor, 30);
      ctx.fill();

      // Special balloon indicators
      if (balloon.type === "golden") {
        ctx.font = `${balloon.radius * 0.7}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⭐", 0, 0);
      }
      if (balloon.type === "bomb") {
        ctx.font = `${balloon.radius * 0.5}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("💣", 0, 0);
      }

      ctx.restore();

      // Remove if off screen
      return balloon.y + balloon.radius > -100;
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

    // Update and draw floating scores
    floatingScoresRef.current = floatingScoresRef.current.filter(fs => {
      fs.y -= 2.5;
      fs.life -= 0.02;

      if (fs.life > 0) {
        ctx.font = "bold 28px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = fs.color;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.globalAlpha = fs.life;
        ctx.strokeText(fs.text, fs.x, fs.y);
        ctx.fillText(fs.text, fs.x, fs.y);
        ctx.globalAlpha = 1;
        return true;
      }
      return false;
    });

    if (phase === "playing") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [createBalloon, phase, popBalloon]);

  // Helper function to draw a cloud
  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
    ctx.arc(x + size * 1.5, y, size * 0.6, 0, Math.PI * 2);
    ctx.arc(x - size * 0.6, y + size * 0.1, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  };

  // Helper to lighten a color
  const lightenColor = (color: string, percent: number): string => {
    if (color === "rainbow" || color.startsWith("hsl")) return color;
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  };

  // Helper to darken a color
  const darkenColor = (color: string, percent: number): string => {
    if (color === "rainbow" || color.startsWith("hsl")) return color;
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  };

  // Start game
  const startGame = useCallback(() => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(60);
    setGameSpeed(1);
    balloonsRef.current = [];
    particlesRef.current = [];
    floatingScoresRef.current = [];
    lastSpawnRef.current = 0;
    lastPopTimeRef.current = 0;
    startTimeRef.current = performance.now();
    setPhase("playing");
  }, []);

  // Timer effect
  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setPhase("gameOver");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

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
    const saved = localStorage.getItem("balloon-pop-high-score");
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

  // Save high score on game over
  useEffect(() => {
    if (phase === "gameOver" && score > highScore) {
      setHighScore(score);
      localStorage.setItem("balloon-pop-high-score", String(score));
    }
  }, [phase, score, highScore]);

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
    <main className="min-h-screen bg-gradient-to-br from-[#87CEEB] to-[#F0F8FF] relative overflow-hidden">
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

      {/* HUD - Score and Timer */}
      {phase === "playing" && (
        <>
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
            <div className="bg-white/90 backdrop-blur rounded-2xl px-4 py-3 shadow-lg">
              <p className="text-sm font-bold text-gray-500">SCORE</p>
              <p className="text-3xl font-black text-[#4ECDC4]">{score}</p>
            </div>
            
            <div className="bg-white/90 backdrop-blur rounded-2xl px-4 py-3 shadow-lg">
              <p className="text-sm font-bold text-gray-500">TIME</p>
              <p className={`text-3xl font-black ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-[#FF6B6B]"}`}>
                {timeLeft}s
              </p>
            </div>
          </div>

          {/* Combo display */}
          {combo > 1 && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black text-2xl px-6 py-2 rounded-full shadow-lg animate-bounce">
              🔥 {combo}x COMBO!
            </div>
          )}

          {/* Pause Button */}
          <button
            onClick={() => setPhase("paused")}
            className="absolute bottom-4 left-4 bg-white/80 hover:bg-white px-4 py-2 rounded-xl font-bold text-gray-700 shadow-lg transition-all pointer-events-auto"
          >
            ⏸️ Pause
          </button>
        </>
      )}

      {/* Menu Overlay */}
      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h1 className="text-4xl font-black text-[#FF6B6B] mb-2">🎈 Balloon Pop! 🎈</h1>
            <p className="text-gray-600 mb-6">Pop balloons for points, avoid the bombs!</p>
            
            {highScore > 0 && (
              <p className="text-xl font-bold text-[#FFD700] mb-4">
                🏆 High Score: {highScore}
              </p>
            )}

            <button
              onClick={startGame}
              className="w-full px-8 py-4 bg-gradient-to-r from-[#4ECDC4] to-[#44A08D] hover:from-[#3DBDB5] hover:to-[#3D8B7D] text-white text-xl font-bold rounded-2xl transition-all hover:scale-105 shadow-lg"
            >
              🎮 Play Game!
            </button>

            <div className="mt-6 text-sm text-gray-500 space-y-1">
              <p>🎈 Normal balloons = 10-15 points</p>
              <p>⭐ Golden balloon = 50 points</p>
              <p>🌈 Rainbow balloon = 30 points</p>
              <p>💣 Bomb = -25 points (avoid!)</p>
              <p>🔥 Pop quickly for combo bonus!</p>
            </div>
          </div>
        </div>
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
                onClick={startGame}
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
            <h2 className="text-3xl font-black text-[#FF6B6B] mb-2">🎉 Time&apos;s Up!</h2>
            
            <div className="my-6 space-y-2">
              <p className="text-3xl font-bold text-gray-700">
                Score: <span className="text-[#4ECDC4]">{score}</span>
              </p>
              <p className="text-lg text-gray-600">
                Best Combo: <span className="font-bold text-orange-500">{maxCombo}x</span>
              </p>
              {score >= highScore && score > 0 && (
                <p className="text-xl font-bold text-[#FFD700] animate-pulse">🏆 New High Score! 🏆</p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={startGame}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#4ECDC4] to-[#44A08D] hover:from-[#3DBDB5] hover:to-[#3D8B7D] text-white font-bold rounded-xl transition-all"
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
