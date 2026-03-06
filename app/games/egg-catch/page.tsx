"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Egg {
  id: number;
  x: number;
  y: number;
  type: "normal" | "golden" | "rotten";
  speed: number;
  wobble: number;
  wobbleDir: number;
}

interface Chicken {
  x: number;
  bobOffset: number;
  nextEggTime: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

interface CrackEffect {
  id: number;
  x: number;
  y: number;
  life: number;
}

type GamePhase = "menu" | "playing" | "paused" | "gameOver";

const EGG_COLORS = {
  normal: "#FAFAFA",
  golden: "#FFD700",
  rotten: "#8B7355",
};

const CHICKEN_BODY = "#FFF8E1";
const CHICKEN_ACCENT = "#FFCC80";

export default function EggCatchPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);

  const basketRef = useRef({ x: 0, width: 80, y: 0, height: 50, targetX: 0 });
  const eggsRef = useRef<Egg[]>([]);
  const chickensRef = useRef<Chicken[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cracksRef = useRef<CrackEffect[]>([]);
  const animationRef = useRef<number>(0);
  const eggIdRef = useRef(0);
  const timeRef = useRef(0);

  // Game settings that increase over time
  const baseSpeedRef = useRef(1.5);
  const spawnRateRef = useRef(2000);

  const handleMove = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    basketRef.current.targetX = Math.max(basketRef.current.width / 2,
      Math.min(canvas.width - basketRef.current.width / 2, x));
  }, []);

  const handleKeyboard = useCallback((direction: "left" | "right") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const step = 30;
    if (direction === "left") {
      basketRef.current.targetX = Math.max(basketRef.current.width / 2,
        basketRef.current.targetX - step);
    } else {
      basketRef.current.targetX = Math.min(canvas.width - basketRef.current.width / 2,
        basketRef.current.targetX + step);
    }
  }, []);

  const createParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      particlesRef.current.push({
        id: Date.now() + i,
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        color,
        life: 1,
        size: 3 + Math.random() * 4,
      });
    }
  }, []);

  const createCrack = useCallback((x: number, y: number) => {
    cracksRef.current.push({
      id: Date.now(),
      x, y,
      life: 1,
    });
  }, []);

  const initChickens = useCallback((count: number, canvasWidth: number) => {
    const spacing = canvasWidth / (count + 1);
    chickensRef.current = [];
    for (let i = 0; i < count; i++) {
      chickensRef.current.push({
        x: spacing * (i + 1),
        bobOffset: Math.random() * Math.PI * 2,
        nextEggTime: Date.now() + 1000 + Math.random() * 2000,
      });
    }
  }, []);

  const drawChicken = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, bob: number, time: number) => {
    const bobY = Math.sin(bob + time * 0.005) * 3;
    
    ctx.save();
    ctx.translate(x, y + bobY);

    // Body (fluffy oval)
    ctx.fillStyle = CHICKEN_BODY;
    ctx.beginPath();
    ctx.ellipse(0, 0, 35, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.fillStyle = CHICKEN_ACCENT;
    ctx.beginPath();
    ctx.ellipse(-15, 5, 18, 15, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = CHICKEN_BODY;
    ctx.beginPath();
    ctx.arc(25, -15, 18, 0, Math.PI * 2);
    ctx.fill();

    // Comb (red)
    ctx.fillStyle = "#EF5350";
    ctx.beginPath();
    ctx.moveTo(25, -35);
    ctx.quadraticCurveTo(20, -40, 22, -35);
    ctx.quadraticCurveTo(18, -42, 25, -38);
    ctx.quadraticCurveTo(28, -42, 30, -35);
    ctx.quadraticCurveTo(32, -40, 30, -35);
    ctx.lineTo(28, -30);
    ctx.fill();

    // Beak
    ctx.fillStyle = "#FF9800";
    ctx.beginPath();
    ctx.moveTo(40, -15);
    ctx.lineTo(50, -12);
    ctx.lineTo(40, -8);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(32, -18, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(33, -19, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Wattle (under beak)
    ctx.fillStyle = "#EF5350";
    ctx.beginPath();
    ctx.ellipse(38, -5, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tail feathers
    ctx.fillStyle = CHICKEN_ACCENT;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-30, 0);
      ctx.quadraticCurveTo(-45, -15 + i * 10, -50, -10 + i * 15);
      ctx.quadraticCurveTo(-40, -5 + i * 8, -30, 5);
      ctx.fill();
    }

    // Feet
    ctx.fillStyle = "#FF9800";
    ctx.fillRect(-10, 25, 6, 15);
    ctx.fillRect(5, 25, 6, 15);

    ctx.restore();
  }, []);

  const drawEgg = useCallback((ctx: CanvasRenderingContext2D, egg: Egg, time: number) => {
    ctx.save();
    const wobbleX = Math.sin(time * 0.01 + egg.wobble) * egg.wobbleDir * 3;
    ctx.translate(egg.x + wobbleX, egg.y);
    ctx.rotate(Math.sin(time * 0.008 + egg.id) * 0.1);

    if (egg.type === "golden") {
      // Golden glow
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 20;
    }

    // Egg shape
    ctx.fillStyle = EGG_COLORS[egg.type];
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shine
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.ellipse(-4, -6, 4, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();

    if (egg.type === "golden") {
      // Extra sparkle
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.arc(5, -8, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (egg.type === "rotten") {
      // Rotten spots
      ctx.fillStyle = "#5D4037";
      ctx.beginPath();
      ctx.arc(-3, 3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(5, -2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, []);

  const drawBasket = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt * Math.PI / 180);

    // Basket back
    ctx.fillStyle = "#8B4513";
    ctx.beginPath();
    ctx.moveTo(-40, -25);
    ctx.lineTo(-35, 20);
    ctx.lineTo(35, 20);
    ctx.lineTo(40, -25);
    ctx.closePath();
    ctx.fill();

    // Weave pattern
    ctx.strokeStyle = "#A0522D";
    ctx.lineWidth = 2;
    for (let i = -30; i <= 30; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i, -20);
      ctx.lineTo(i, 15);
      ctx.stroke();
    }
    for (let j = -15; j <= 15; j += 10) {
      ctx.beginPath();
      ctx.moveTo(-35, j);
      ctx.lineTo(35, j);
      ctx.stroke();
    }

    // Rim
    ctx.fillStyle = "#6D4C41";
    ctx.beginPath();
    ctx.ellipse(0, -25, 42, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8D6E63";
    ctx.beginPath();
    ctx.ellipse(0, -25, 38, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Handle arcs
    ctx.strokeStyle = "#6D4C41";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, -25, 35, Math.PI, 0, false);
    ctx.stroke();

    ctx.restore();
  }, []);

  const drawCrack = useCallback((ctx: CanvasRenderingContext2D, crack: CrackEffect) => {
    ctx.save();
    ctx.globalAlpha = crack.life;
    ctx.translate(crack.x, crack.y);

    // Cracked egg shell
    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.ellipse(-8, 0, 10, 14, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, 2, 10, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Yolk
    ctx.fillStyle = "#FFB300";
    ctx.beginPath();
    ctx.ellipse(0, 8, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crack lines
    ctx.strokeStyle = "#CCC";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, -10);
    ctx.lineTo(0, 0);
    ctx.lineTo(-3, 10);
    ctx.moveTo(0, 0);
    ctx.lineTo(5, 5);
    ctx.stroke();

    ctx.restore();
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || phase !== "playing") return;

    timeRef.current = timestamp;

    // Farm background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, "#87CEEB");
    skyGrad.addColorStop(0.6, "#B0E0E6");
    skyGrad.addColorStop(1, "#90EE90");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sun
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "#FFA500";
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(canvas.width - 80, 80, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Clouds
    ctx.fillStyle = "#FFF";
    const drawCloud = (cx: number, cy: number, scale: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 25 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 25 * scale, cy - 10 * scale, 20 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 50 * scale, cy, 25 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 25 * scale, cy + 5 * scale, 20 * scale, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCloud(100 + (timestamp * 0.01) % (canvas.width + 200) - 100, 60, 1);
    drawCloud(400 + (timestamp * 0.008) % (canvas.width + 200) - 100, 100, 0.8);

    // Barn in background
    ctx.fillStyle = "#B22222";
    ctx.fillRect(canvas.width - 180, canvas.height - 250, 120, 150);
    // Roof
    ctx.fillStyle = "#8B0000";
    ctx.beginPath();
    ctx.moveTo(canvas.width - 200, canvas.height - 250);
    ctx.lineTo(canvas.width - 120, canvas.height - 320);
    ctx.lineTo(canvas.width - 40, canvas.height - 250);
    ctx.closePath();
    ctx.fill();
    // Door
    ctx.fillStyle = "#4A2000";
    ctx.fillRect(canvas.width - 150, canvas.height - 170, 60, 70);

    // Fence
    ctx.fillStyle = "#DEB887";
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.fillRect(i, canvas.height - 120, 8, 60);
    }
    ctx.fillRect(0, canvas.height - 100, canvas.width, 8);
    ctx.fillRect(0, canvas.height - 70, canvas.width, 8);

    // Ground/grass
    ctx.fillStyle = "#228B22";
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
    // Grass tufts
    ctx.fillStyle = "#32CD32";
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, canvas.height - 60);
      ctx.lineTo(i + 5, canvas.height - 75);
      ctx.lineTo(i + 10, canvas.height - 60);
      ctx.fill();
    }

    // Draw chickens on fence
    chickensRef.current.forEach(chicken => {
      drawChicken(ctx, chicken.x, canvas.height - 145, chicken.bobOffset, timestamp);
    });

    // Spawn eggs from chickens
    chickensRef.current.forEach(chicken => {
      if (timestamp > chicken.nextEggTime) {
        const rand = Math.random();
        let type: "normal" | "golden" | "rotten" = "normal";
        if (rand < 0.1) type = "golden";
        else if (rand < 0.2) type = "rotten";

        eggsRef.current.push({
          id: eggIdRef.current++,
          x: chicken.x,
          y: canvas.height - 160,
          type,
          speed: baseSpeedRef.current + Math.random() * 0.5,
          wobble: Math.random() * Math.PI * 2,
          wobbleDir: Math.random() > 0.5 ? 1 : -1,
        });

        chicken.nextEggTime = timestamp + spawnRateRef.current + Math.random() * 1000;
      }
    });

    // Update basket position (smooth following)
    const basket = basketRef.current;
    basket.x += (basket.targetX - basket.x) * 0.15;

    // Update and draw eggs
    eggsRef.current = eggsRef.current.filter(egg => {
      egg.y += egg.speed;

      // Draw egg
      drawEgg(ctx, egg, timestamp);

      // Check collision with basket
      const basketTop = basket.y - basket.height / 2;
      const basketLeft = basket.x - basket.width / 2;
      const basketRight = basket.x + basket.width / 2;

      if (egg.y > basketTop - 15 && egg.y < basket.y + 10 &&
          egg.x > basketLeft - 10 && egg.x < basketRight + 10) {
        // Caught!
        createParticles(egg.x, basketTop, EGG_COLORS[egg.type], 8);

        if (egg.type === "normal") {
          setScore(s => s + 1);
          createParticles(egg.x, basketTop, "#90EE90", 5);
        } else if (egg.type === "golden") {
          setScore(s => s + 5);
          createParticles(egg.x, basketTop, "#FFD700", 15);
        } else if (egg.type === "rotten") {
          setScore(s => Math.max(0, s - 3));
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) {
              setPhase("gameOver");
            }
            return newLives;
          });
          createParticles(egg.x, basketTop, "#5D4037", 8);
        }
        return false;
      }

      // Missed - hit ground
      if (egg.y > canvas.height - 60) {
        if (egg.type !== "rotten") {
          createCrack(egg.x, canvas.height - 60);
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) {
              setPhase("gameOver");
            }
            return newLives;
          });
        }
        return false;
      }

      return true;
    });

    // Draw crack effects
    cracksRef.current = cracksRef.current.filter(crack => {
      crack.life -= 0.02;
      if (crack.life > 0) {
        drawCrack(ctx, crack);
        return true;
      }
      return false;
    });

    // Draw basket
    const tilt = (basket.targetX - basket.x) * 0.3;
    drawBasket(ctx, basket.x, basket.y, tilt);

    // Draw particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.life -= 0.025;
      if (p.life > 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      }
      return false;
    });

    // Draw UI - Score
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFF";
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 3;
    ctx.strokeText(`Score: ${score}`, 20, 45);
    ctx.fillText(`Score: ${score}`, 20, 45);

    // Level
    ctx.font = "bold 24px Arial";
    ctx.strokeText(`Level ${level}`, 20, 80);
    ctx.fillText(`Level ${level}`, 20, 80);

    // Lives (hearts)
    for (let i = 0; i < 3; i++) {
      const heartX = canvas.width - 50 - i * 45;
      ctx.fillStyle = i < lives ? "#EF5350" : "#CCC";
      ctx.font = "36px Arial";
      ctx.textAlign = "center";
      ctx.fillText("❤️", heartX, 45);
    }

    // Increase difficulty over time based on score
    const newLevel = Math.floor(score / 10) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
      baseSpeedRef.current = 1.5 + newLevel * 0.3;
      spawnRateRef.current = Math.max(800, 2000 - newLevel * 150);
      
      // Add more chickens every 3 levels
      if (newLevel % 3 === 0 && chickensRef.current.length < 5) {
        initChickens(Math.min(5, chickensRef.current.length + 1), canvas.width);
      }
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [phase, score, lives, level, createParticles, createCrack, initChickens, drawChicken, drawEgg, drawBasket, drawCrack]);

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setScore(0);
    setLives(3);
    setLevel(1);
    eggsRef.current = [];
    particlesRef.current = [];
    cracksRef.current = [];
    baseSpeedRef.current = 1.5;
    spawnRateRef.current = 2000;
    basketRef.current.x = canvas.width / 2;
    basketRef.current.targetX = canvas.width / 2;
    initChickens(2, canvas.width);
    setPhase("playing");
  }, [initChickens]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    basketRef.current.y = canvas.height - 100;
    basketRef.current.x = canvas.width / 2;
    basketRef.current.targetX = canvas.width / 2;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      basketRef.current.y = canvas.height - 100;
      if (chickensRef.current.length > 0) {
        initChickens(chickensRef.current.length, canvas.width);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initChickens]);

  useEffect(() => {
    const saved = localStorage.getItem("egg-catch-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [phase, gameLoop]);

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      handleMove(x);
    };
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
    };
  }, [handleMove]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") handleKeyboard("left");
      if (e.key === "ArrowRight" || e.key === "d") handleKeyboard("right");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyboard]);

  // Update high score on game over
  useEffect(() => {
    if (phase === "gameOver" && score > highScore) {
      setHighScore(score);
      localStorage.setItem("egg-catch-high-score", String(score));
    }
  }, [phase, score, highScore]);

  return (
    <main className="min-h-screen bg-[#87CEEB] relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <div className="text-6xl mb-2">🥚🐔</div>
            <h1 className="text-4xl font-black text-[#8B4513] mb-2">Egg Catch</h1>
            <p className="text-gray-600 mb-4">Move the basket to catch falling eggs!</p>
            <div className="bg-yellow-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-gray-700 mb-2"><span className="text-2xl">🥚</span> White egg = +1 point</p>
              <p className="text-sm text-gray-700 mb-2"><span className="text-2xl">⭐</span> Golden egg = +5 points</p>
              <p className="text-sm text-gray-700 mb-2"><span className="text-2xl">🤢</span> Rotten egg = -3 points, lose life</p>
              <p className="text-sm text-gray-700"><span className="text-2xl">💔</span> Missed egg = lose life</p>
            </div>
            {highScore > 0 && (
              <p className="text-xl font-bold text-[#FFD700] mb-4">🏆 High Score: {highScore}</p>
            )}
            <button
              onClick={startGame}
              className="w-full px-6 py-4 bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold rounded-xl text-2xl transition-all shadow-lg hover:scale-105"
            >
              ▶️ Play!
            </button>
            <p className="text-sm text-gray-500 mt-4">Use arrow keys, A/D keys, or touch to move</p>
          </div>
        </div>
      )}

      {phase === "paused" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 text-center">
            <h2 className="text-3xl font-black text-gray-700 mb-6">⏸️ Paused</h2>
            <div className="space-x-2">
              <button onClick={() => setPhase("playing")}
                className="px-6 py-3 bg-[#4CAF50] text-white font-bold rounded-xl">Resume</button>
              <button onClick={startGame}
                className="px-6 py-3 bg-[#FF6B6B] text-white font-bold rounded-xl">Restart</button>
            </div>
          </div>
        </div>
      )}

      {phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <div className="text-5xl mb-2">🐣</div>
            <h2 className="text-3xl font-black text-[#FF6B6B] mb-2">Game Over!</h2>
            <p className="text-3xl font-bold text-gray-700 my-4">Score: {score}</p>
            <p className="text-lg text-gray-500 mb-2">Level: {level}</p>
            {score >= highScore && score > 0 && (
              <p className="text-xl font-bold text-[#FFD700] mb-4">🏆 New High Score!</p>
            )}
            <div className="space-y-2">
              <button onClick={startGame}
                className="w-full px-6 py-3 bg-[#4CAF50] text-white font-bold rounded-xl text-xl">Play Again</button>
              <button onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-400 text-white font-bold rounded-xl">Menu</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
