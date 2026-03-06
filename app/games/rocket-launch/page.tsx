"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type GamePhase = "menu" | "playing" | "gameOver";

interface Asteroid {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  speed: number;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  collected: boolean;
  sparkle: number;
}

interface ShieldPowerUp {
  id: number;
  x: number;
  y: number;
  size: number;
  active: boolean;
}

interface TrailParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  color: string;
}

interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export default function RocketLaunchPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const rocketRef = useRef({ x: 200, targetX: 200, width: 40, height: 60 });
  const asteroidsRef = useRef<Asteroid[]>([]);
  const starsRef = useRef<Star[]>([]);
  const shieldsRef = useRef<ShieldPowerUp[]>([]);
  const trailRef = useRef<TrailParticle[]>([]);
  const explosionRef = useRef<ExplosionParticle[]>([]);
  const speedRef = useRef(2);
  const distanceRef = useRef(0);
  const hasShieldRef = useRef(false);
  const shieldTimerRef = useRef(0);
  const animationRef = useRef<number>(0);
  const lastSpawnRef = useRef({ asteroid: 0, star: 0, shield: 0 });

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;

  const drawRocket = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, hasShield: boolean) => {
    // Shield glow
    if (hasShield) {
      const gradient = ctx.createRadialGradient(x, y + 30, 10, x, y + 30, 50);
      gradient.addColorStop(0, "rgba(0, 200, 255, 0.3)");
      gradient.addColorStop(0.5, "rgba(0, 200, 255, 0.15)");
      gradient.addColorStop(1, "rgba(0, 200, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y + 30, 50, 0, Math.PI * 2);
      ctx.fill();
      
      // Shield border
      ctx.strokeStyle = "rgba(0, 200, 255, 0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y + 30, 45, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Rocket body
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 15, y + 50);
    ctx.lineTo(x + 15, y + 50);
    ctx.closePath();
    ctx.fill();

    // Window
    ctx.fillStyle = "#3498db";
    ctx.beginPath();
    ctx.arc(x, y + 20, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#87CEEB";
    ctx.beginPath();
    ctx.arc(x - 2, y + 18, 3, 0, Math.PI * 2);
    ctx.fill();

    // Fins
    ctx.fillStyle = "#c0392b";
    ctx.beginPath();
    ctx.moveTo(x - 15, y + 40);
    ctx.lineTo(x - 25, y + 60);
    ctx.lineTo(x - 10, y + 50);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 15, y + 40);
    ctx.lineTo(x + 25, y + 60);
    ctx.lineTo(x + 10, y + 50);
    ctx.closePath();
    ctx.fill();

    // Engine
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(x - 8, y + 50, 16, 8);
  }, []);

  const drawAsteroid = useCallback((ctx: CanvasRenderingContext2D, asteroid: Asteroid) => {
    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.rotation);

    ctx.fillStyle = "#8B4513";
    ctx.beginPath();
    const points = 8;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const radius = asteroid.size * (0.8 + Math.sin(i * 2.5) * 0.2);
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Craters
    ctx.fillStyle = "#654321";
    ctx.beginPath();
    ctx.arc(-asteroid.size * 0.3, -asteroid.size * 0.2, asteroid.size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(asteroid.size * 0.2, asteroid.size * 0.3, asteroid.size * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, []);

  const drawStar = useCallback((ctx: CanvasRenderingContext2D, star: Star, timestamp: number) => {
    const pulse = 1 + Math.sin(timestamp / 150 + star.sparkle) * 0.2;
    const size = star.size * pulse;

    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 15;

    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const innerAngle = outerAngle + Math.PI / 5;
      const outerX = star.x + Math.cos(outerAngle) * size;
      const outerY = star.y + Math.sin(outerAngle) * size;
      const innerX = star.x + Math.cos(innerAngle) * (size * 0.4);
      const innerY = star.y + Math.sin(innerAngle) * (size * 0.4);
      if (i === 0) ctx.moveTo(outerX, outerY);
      else ctx.lineTo(outerX, outerY);
      ctx.lineTo(innerX, innerY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }, []);

  const drawShieldPowerUp = useCallback((ctx: CanvasRenderingContext2D, shield: ShieldPowerUp, timestamp: number) => {
    const pulse = 1 + Math.sin(timestamp / 100) * 0.15;
    const size = shield.size * pulse;

    ctx.strokeStyle = "#00CED1";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#00CED1";
    ctx.shadowBlur = 10;

    // Shield shape
    ctx.beginPath();
    ctx.moveTo(shield.x, shield.y - size);
    ctx.lineTo(shield.x + size, shield.y - size * 0.3);
    ctx.lineTo(shield.x + size, shield.y + size * 0.3);
    ctx.lineTo(shield.x, shield.y + size);
    ctx.lineTo(shield.x - size, shield.y + size * 0.3);
    ctx.lineTo(shield.x - size, shield.y - size * 0.3);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "rgba(0, 206, 209, 0.3)";
    ctx.fill();

    ctx.shadowBlur = 0;
  }, []);

  const steerLeft = useCallback(() => {
    if (phase === "playing") {
      rocketRef.current.targetX = Math.max(30, rocketRef.current.targetX - 15);
    }
  }, [phase]);

  const steerRight = useCallback(() => {
    if (phase === "playing") {
      rocketRef.current.targetX = Math.min(CANVAS_WIDTH - 30, rocketRef.current.targetX + 15);
    }
  }, [phase]);

  const handleLeftTouch = useCallback(() => steerLeft(), [steerLeft]);
  const handleRightTouch = useCallback(() => steerRight(), [steerRight]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        e.preventDefault();
        steerLeft();
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        e.preventDefault();
        steerRight();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [steerLeft, steerRight]);

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || phase !== "playing") return;

    // Clear with space gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#0a0a2e");
    gradient.addColorStop(0.5, "#1a1a4e");
    gradient.addColorStop(1, "#2a1a3e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background stars (static)
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 50; i++) {
      const x = (i * 73 + distanceRef.current * 0.5) % CANVAS_WIDTH;
      const y = (i * 97 + distanceRef.current * 2) % CANVAS_HEIGHT;
      const size = (i % 3) + 1;
      ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Update distance and speed
    distanceRef.current += speedRef.current;
    speedRef.current = 2 + Math.floor(distanceRef.current / 1000) * 0.3;
    speedRef.current = Math.min(speedRef.current, 8);

    // Update shield timer
    if (hasShieldRef.current) {
      shieldTimerRef.current -= 16;
      if (shieldTimerRef.current <= 0) {
        hasShieldRef.current = false;
      }
    }

    // Smooth rocket movement
    const rocket = rocketRef.current;
    rocket.x += (rocket.targetX - rocket.x) * 0.15;

    // Add trail particles
    if (timestamp % 2 === 0) {
      trailRef.current.push({
        x: rocket.x + (Math.random() - 0.5) * 10,
        y: 520,
        size: 3 + Math.random() * 4,
        alpha: 1,
        color: Math.random() > 0.5 ? "#ff6b35" : "#ffd93d",
      });
    }

    // Update and draw trail
    trailRef.current = trailRef.current.filter(p => {
      p.y += speedRef.current * 1.5;
      p.alpha -= 0.03;
      p.size *= 0.97;

      if (p.alpha > 0) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      }
      return false;
    });

    // Draw rocket
    drawRocket(ctx, rocket.x, 480, hasShieldRef.current);

    // Spawn asteroids
    if (timestamp - lastSpawnRef.current.asteroid > 800 - speedRef.current * 50) {
      asteroidsRef.current.push({
        id: Date.now() + Math.random(),
        x: 30 + Math.random() * (CANVAS_WIDTH - 60),
        y: -40,
        size: 20 + Math.random() * 20,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        speed: speedRef.current * (0.8 + Math.random() * 0.4),
      });
      lastSpawnRef.current.asteroid = timestamp;
    }

    // Spawn stars
    if (timestamp - lastSpawnRef.current.star > 1200) {
      starsRef.current.push({
        id: Date.now() + Math.random(),
        x: 30 + Math.random() * (CANVAS_WIDTH - 60),
        y: -20,
        size: 12 + Math.random() * 6,
        collected: false,
        sparkle: Math.random() * Math.PI * 2,
      });
      lastSpawnRef.current.star = timestamp;
    }

    // Spawn shield power-ups (rare)
    if (timestamp - lastSpawnRef.current.shield > 8000 && Math.random() > 0.7) {
      shieldsRef.current.push({
        id: Date.now() + Math.random(),
        x: 30 + Math.random() * (CANVAS_WIDTH - 60),
        y: -25,
        size: 20,
        active: true,
      });
      lastSpawnRef.current.shield = timestamp;
    }

    // Update and draw asteroids
    let collision = false;
    asteroidsRef.current = asteroidsRef.current.filter(asteroid => {
      asteroid.y += asteroid.speed;
      asteroid.rotation += asteroid.rotationSpeed;

      drawAsteroid(ctx, asteroid);

      // Collision check (simple circle collision)
      const dx = rocket.x - asteroid.x;
      const dy = 510 - asteroid.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < asteroid.size + 20) {
        if (hasShieldRef.current) {
          // Destroy asteroid with shield
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            explosionRef.current.push({
              x: asteroid.x,
              y: asteroid.y,
              vx: Math.cos(angle) * 3,
              vy: Math.sin(angle) * 3,
              size: asteroid.size * 0.3,
              alpha: 1,
              color: "#8B4513",
            });
          }
          return false;
        }
        collision = true;
      }

      return asteroid.y < CANVAS_HEIGHT + 50;
    });

    // Update and draw stars
    starsRef.current = starsRef.current.filter(star => {
      star.y += speedRef.current;

      if (!star.collected) {
        drawStar(ctx, star, timestamp);

        // Collection check
        const dx = rocket.x - star.x;
        const dy = 510 - star.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < star.size + 25) {
          star.collected = true;
          setScore(s => s + 100);
          // Sparkle effect
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            explosionRef.current.push({
              x: star.x,
              y: star.y,
              vx: Math.cos(angle) * 2,
              vy: Math.sin(angle) * 2,
              size: 4,
              alpha: 1,
              color: "#FFD700",
            });
          }
          return false;
        }
      }

      return star.y < CANVAS_HEIGHT + 30;
    });

    // Update and draw shield power-ups
    shieldsRef.current = shieldsRef.current.filter(shield => {
      shield.y += speedRef.current * 0.8;

      if (shield.active) {
        drawShieldPowerUp(ctx, shield, timestamp);

        // Collection check
        const dx = rocket.x - shield.x;
        const dy = 510 - shield.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < shield.size + 25) {
          shield.active = false;
          hasShieldRef.current = true;
          shieldTimerRef.current = 5000; // 5 seconds
          return false;
        }
      }

      return shield.y < CANVAS_HEIGHT + 30;
    });

    // Update and draw explosion particles
    explosionRef.current = explosionRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.02;

      if (p.alpha > 0) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      }
      return false;
    });

    // Create game over explosion
    if (collision) {
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        explosionRef.current.push({
          x: rocket.x,
          y: 510,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 6,
          alpha: 1,
          color: ["#ff6b35", "#ffd93d", "#ff4444", "#ff8800"][Math.floor(Math.random() * 4)],
        });
      }
    }

    // Update score display
    const currentScore = Math.floor(distanceRef.current / 10);
    setScore(currentScore);

    // Draw HUD
    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(`${currentScore}m`, 20, 40);

    // Shield indicator
    if (hasShieldRef.current) {
      const shieldPercent = shieldTimerRef.current / 5000;
      ctx.fillStyle = "#00CED1";
      ctx.fillRect(20, 50, 100 * shieldPercent, 8);
      ctx.strokeStyle = "#00CED1";
      ctx.strokeRect(20, 50, 100, 8);
    }

    // Speed indicator
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#aaaaaa";
    ctx.fillText(`Speed: ${speedRef.current.toFixed(1)}x`, 20, 80);

    if (collision) {
      const finalScore = currentScore;
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem("rocket-launch-high-score", String(finalScore));
      }
      setPhase("gameOver");
      return;
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [phase, highScore, drawRocket, drawAsteroid, drawStar, drawShieldPowerUp]);

  const startGame = useCallback(() => {
    rocketRef.current = { x: CANVAS_WIDTH / 2, targetX: CANVAS_WIDTH / 2, width: 40, height: 60 };
    asteroidsRef.current = [];
    starsRef.current = [];
    shieldsRef.current = [];
    trailRef.current = [];
    explosionRef.current = [];
    speedRef.current = 2;
    distanceRef.current = 0;
    hasShieldRef.current = false;
    shieldTimerRef.current = 0;
    lastSpawnRef.current = { asteroid: 0, star: 0, shield: 0 };
    setScore(0);
    setPhase("playing");
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("rocket-launch-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [phase, gameLoop]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-purple-900 flex flex-col items-center justify-center select-none">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-2xl shadow-2xl border-4 border-purple-500"
        />

        {/* Touch Controls */}
        {phase === "playing" && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-between p-4">
            <button
              onTouchStart={handleLeftTouch}
              onMouseDown={handleLeftTouch}
              className="w-20 h-20 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-full flex items-center justify-center text-4xl backdrop-blur-sm border-2 border-white/30"
            >
              ←
            </button>
            <button
              onTouchStart={handleRightTouch}
              onMouseDown={handleRightTouch}
              className="w-20 h-20 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-full flex items-center justify-center text-4xl backdrop-blur-sm border-2 border-white/30"
            >
              →
            </button>
          </div>
        )}

        {phase === "menu" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
            <div className="bg-gradient-to-b from-purple-600 to-indigo-700 rounded-3xl p-8 shadow-2xl text-center border-4 border-yellow-400">
              <div className="text-6xl mb-2">🚀</div>
              <h1 className="text-4xl font-black text-white mb-2 drop-shadow-lg">Rocket Launch</h1>
              <p className="text-yellow-200 mb-4">Guide the rocket through space!</p>
              <div className="text-white/80 text-sm mb-4 space-y-1">
                <p>← → or A/D to steer</p>
                <p>⭐ Collect stars for points</p>
                <p>🛡️ Grab shields for protection</p>
                <p>🪨 Avoid asteroids!</p>
              </div>
              {highScore > 0 && (
                <p className="text-xl font-bold text-yellow-300 mb-4">
                  🏆 Best: {highScore}m
                </p>
              )}
              <button
                onClick={startGame}
                className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-black rounded-xl text-2xl shadow-lg transform hover:scale-105 transition-transform"
              >
                🚀 Launch!
              </button>
            </div>
          </div>
        )}

        {phase === "gameOver" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
            <div className="bg-gradient-to-b from-red-500 to-orange-600 rounded-3xl p-8 shadow-2xl text-center border-4 border-yellow-400">
              <div className="text-6xl mb-2">💥</div>
              <h2 className="text-3xl font-black text-white mb-2">Crashed!</h2>
              <p className="text-4xl font-black text-yellow-300 my-4">{score}m</p>
              {score >= highScore && score > 0 && (
                <p className="text-xl font-bold text-yellow-200 mb-4 animate-pulse">
                  🏆 New Record!
                </p>
              )}
              <div className="space-y-3">
                <button
                  onClick={startGame}
                  className="w-full px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-bold rounded-xl text-xl"
                >
                  🚀 Try Again
                </button>
                <button
                  onClick={() => setPhase("menu")}
                  className="w-full px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl"
                >
                  Menu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
