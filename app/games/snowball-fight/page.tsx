"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Target {
  id: number;
  x: number;
  y: number;
  type: "target" | "friend";
  barrierIndex: number;
  popTime: number;
  visible: boolean;
  hit: boolean;
}

interface Snowball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface HitEffect {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  time: number;
}

type GamePhase = "menu" | "playing" | "gameOver";

const GAME_DURATION = 60;
const GRAVITY = 0.3;
const WIND_STRENGTH = 0.05;
const THROW_POWER_MULTIPLIER = 0.15;

export default function SnowballFightPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [shots, setShots] = useState(0);
  const [hits, setHits] = useState(0);

  const targetsRef = useRef<Target[]>([]);
  const snowballsRef = useRef<Snowball[]>([]);
  const hitEffectsRef = useRef<HitEffect[]>([]);
  const windRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragEndRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>(0);
  const throwOriginRef = useRef({ x: 0, y: 0 });

  const barriers = [
    { x: 100, y: 400, width: 80, height: 60 },
    { x: 250, y: 380, width: 90, height: 80 },
    { x: 400, y: 420, width: 70, height: 50 },
    { x: 550, y: 390, width: 85, height: 70 },
    { x: 700, y: 410, width: 75, height: 55 },
  ];

  const spawnTarget = useCallback(() => {
    const availableBarriers = barriers.map((_, i) => i);
    const barrierIndex = availableBarriers[Math.floor(Math.random() * availableBarriers.length)];
    const barrier = barriers[barrierIndex];
    
    const isFriend = Math.random() < 0.3;
    
    const target: Target = {
      id: Date.now() + Math.random(),
      x: barrier.x + barrier.width / 2,
      y: barrier.y - 20,
      barrierIndex,
      type: isFriend ? "friend" : "target",
      popTime: 2000 + Math.random() * 2000,
      visible: true,
      hit: false,
    };
    
    targetsRef.current.push(target);

    setTimeout(() => {
      targetsRef.current = targetsRef.current.filter(t => t.id !== target.id);
    }, target.popTime);
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || phase !== "playing") return;

    // Winter sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, "#87CEEB");
    skyGradient.addColorStop(0.6, "#E0F7FA");
    skyGradient.addColorStop(1, "#FFFFFF");
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Snow ground
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 100);
    ctx.quadraticCurveTo(canvas.width * 0.25, canvas.height - 120, canvas.width * 0.5, canvas.height - 100);
    ctx.quadraticCurveTo(canvas.width * 0.75, canvas.height - 80, canvas.width, canvas.height - 100);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fill();

    // Snow drifts
    ctx.fillStyle = "rgba(200, 220, 255, 0.5)";
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(i * 120 + 50, canvas.height - 90 + Math.sin(i) * 10, 40 + Math.sin(i * 2) * 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Falling snow
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    for (let i = 0; i < 50; i++) {
      const x = (i * 37 + timestamp / 20) % canvas.width;
      const y = (i * 23 + timestamp / 15) % (canvas.height - 50);
      ctx.beginPath();
      ctx.arc(x, y, 2 + Math.sin(i) * 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw barriers (snow forts)
    barriers.forEach((barrier, i) => {
      // Shadow
      ctx.fillStyle = "rgba(150, 180, 200, 0.3)";
      ctx.beginPath();
      ctx.ellipse(barrier.x + barrier.width / 2, barrier.y + barrier.height + 5, barrier.width / 2 + 10, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Snow fort
      const gradient = ctx.createLinearGradient(barrier.x, barrier.y, barrier.x + barrier.width, barrier.y + barrier.height);
      gradient.addColorStop(0, "#FFFFFF");
      gradient.addColorStop(0.5, "#E8F4FC");
      gradient.addColorStop(1, "#D0E8F5");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(barrier.x, barrier.y, barrier.width, barrier.height, 8);
      ctx.fill();

      // Snow fort details
      ctx.strokeStyle = "#B8D4E8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(barrier.x, barrier.y, barrier.width, barrier.height, 8);
      ctx.stroke();

      // Brick pattern
      ctx.strokeStyle = "rgba(180, 200, 220, 0.4)";
      ctx.lineWidth = 1;
      for (let row = 0; row < 3; row++) {
        ctx.beginPath();
        ctx.moveTo(barrier.x + 5, barrier.y + 15 + row * 20);
        ctx.lineTo(barrier.x + barrier.width - 5, barrier.y + 15 + row * 20);
        ctx.stroke();
      }
    });

    // Draw targets
    targetsRef.current.forEach(target => {
      if (!target.visible || target.hit) return;

      const barrier = barriers[target.barrierIndex];
      const popOffset = Math.sin(timestamp / 200 + target.id) * 5;
      
      ctx.save();
      ctx.translate(target.x, target.y - 30 + popOffset);

      if (target.type === "target") {
        // Green target (enemy)
        ctx.fillStyle = "#4ADE80";
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Target rings
        ctx.strokeStyle = "#22C55E";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.stroke();

        // Bullseye
        ctx.fillStyle = "#166534";
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Points indicator
        ctx.fillStyle = "#166534";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("+10", 0, -35);
      } else {
        // Red target (friend)
        ctx.fillStyle = "#F87171";
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();

        // Friend face
        ctx.fillStyle = "#FEE2E2";
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = "#1F2937";
        ctx.beginPath();
        ctx.arc(-6, -3, 3, 0, Math.PI * 2);
        ctx.arc(6, -3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = "#1F2937";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 2, 8, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // Warning indicator
        ctx.fillStyle = "#DC2626";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("-5", 0, -35);
      }

      ctx.restore();
    });

    // Draw snowballs
    snowballsRef.current = snowballsRef.current.filter(snowball => {
      // Apply physics
      snowball.vx += windRef.current * WIND_STRENGTH;
      snowball.vy += GRAVITY;
      snowball.x += snowball.vx;
      snowball.y += snowball.vy;

      // Draw snowball
      ctx.save();
      ctx.translate(snowball.x, snowball.y);

      // Shadow
      ctx.fillStyle = "rgba(100, 150, 200, 0.3)";
      ctx.beginPath();
      ctx.ellipse(3, 3, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Snowball
      const ballGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, 12);
      ballGradient.addColorStop(0, "#FFFFFF");
      ballGradient.addColorStop(1, "#E0E7EF");
      ctx.fillStyle = ballGradient;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      // Shine
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.arc(-4, -4, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Check collision with targets
      targetsRef.current.forEach(target => {
        if (!target.visible || target.hit) return;
        const dist = Math.sqrt((snowball.x - target.x) ** 2 + (snowball.y - (target.y - 30)) ** 2);
        if (dist < 35) {
          target.hit = true;
          const points = target.type === "target" ? 10 : -5;
          setScore(s => Math.max(0, s + points));
          if (target.type === "target") setHits(h => h + 1);

          // Hit effect
          hitEffectsRef.current.push({
            id: Date.now(),
            x: target.x,
            y: target.y - 30,
            text: target.type === "target" ? "+10" : "-5",
            color: target.type === "target" ? "#22C55E" : "#EF4444",
            time: timestamp,
          });
        }
      });

      // Remove if off screen
      return snowball.y < canvas.height + 50 && snowball.x > -50 && snowball.x < canvas.width + 50;
    });

    // Draw throw trajectory preview
    if (isDraggingRef.current) {
      const dx = dragStartRef.current.x - dragEndRef.current.x;
      const dy = dragStartRef.current.y - dragEndRef.current.y;
      
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      
      let previewX = throwOriginRef.current.x;
      let previewY = throwOriginRef.current.y;
      let previewVx = dx * THROW_POWER_MULTIPLIER;
      let previewVy = dy * THROW_POWER_MULTIPLIER;
      
      ctx.moveTo(previewX, previewY);
      
      for (let i = 0; i < 30; i++) {
        previewVx += windRef.current * WIND_STRENGTH;
        previewVy += GRAVITY;
        previewX += previewVx;
        previewY += previewVy;
        
        if (previewY > canvas.height) break;
        ctx.lineTo(previewX, previewY);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw power indicator
      const power = Math.min(100, Math.sqrt(dx * dx + dy * dy) * 0.5);
      ctx.fillStyle = `hsl(${120 - power * 1.2}, 70%, 50%)`;
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Power: ${Math.round(power)}%`, throwOriginRef.current.x, throwOriginRef.current.y + 40);
    }

    // Draw hit effects
    hitEffectsRef.current = hitEffectsRef.current.filter(effect => {
      const age = timestamp - effect.time;
      if (age > 1000) return false;

      const alpha = 1 - age / 1000;
      const offsetY = age / 10;

      ctx.fillStyle = effect.color;
      ctx.globalAlpha = alpha;
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(effect.text, effect.x, effect.y - offsetY);
      ctx.globalAlpha = 1;

      return true;
    });

    // Draw wind indicator
    const windArrowX = canvas.width - 100;
    const windArrowY = 80;
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.beginPath();
    ctx.roundRect(windArrowX - 50, windArrowY - 25, 100, 50, 10);
    ctx.fill();

    ctx.fillStyle = "#1F2937";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Wind", windArrowX, windArrowY - 5);

    // Wind arrow
    const windStrength = Math.abs(windRef.current);
    const windDirection = windRef.current > 0 ? 1 : -1;
    
    ctx.strokeStyle = "#3B82F6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(windArrowX - windDirection * 20, windArrowY + 10);
    ctx.lineTo(windArrowX + windDirection * 20, windArrowY + 10);
    ctx.stroke();

    // Arrow head
    ctx.fillStyle = "#3B82F6";
    ctx.beginPath();
    ctx.moveTo(windArrowX + windDirection * 25, windArrowY + 10);
    ctx.lineTo(windArrowX + windDirection * 15, windArrowY + 5);
    ctx.lineTo(windArrowX + windDirection * 15, windArrowY + 15);
    ctx.closePath();
    ctx.fill();

    // Wind strength indicator
    ctx.fillStyle = windStrength > 2 ? "#EF4444" : "#22C55E";
    ctx.font = "12px sans-serif";
    ctx.fillText(windStrength > 2 ? "Strong" : "Light", windArrowX, windArrowY + 30);

    // Draw player (snowball thrower)
    const playerX = 80;
    const playerY = canvas.height - 140;
    
    ctx.save();
    ctx.translate(playerX, playerY);

    // Body
    ctx.fillStyle = "#3B82F6";
    ctx.beginPath();
    ctx.roundRect(-15, 0, 30, 40, 5);
    ctx.fill();

    // Head
    ctx.fillStyle = "#FBBF24";
    ctx.beginPath();
    ctx.arc(0, -15, 20, 0, Math.PI * 2);
    ctx.fill();

    // Hat
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.roundRect(-18, -35, 36, 10, 3);
    ctx.fill();
    ctx.fillStyle = "#DC2626";
    ctx.beginPath();
    ctx.roundRect(-12, -45, 24, 12, 3);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#1F2937";
    ctx.beginPath();
    ctx.arc(-7, -18, 3, 0, Math.PI * 2);
    ctx.arc(7, -18, 3, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = "#1F2937";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -12, 8, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Arm with snowball
    ctx.fillStyle = "#3B82F6";
    ctx.beginPath();
    ctx.roundRect(15, 5, 25, 8, 4);
    ctx.fill();

    // Snowball in hand
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(45, 9, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [phase]);

  const handlePointerDown = useCallback((clientX: number, clientY: number) => {
    if (phase !== "playing") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    isDraggingRef.current = true;
    dragStartRef.current = { x, y };
    dragEndRef.current = { x, y };
    throwOriginRef.current = { x: 80 + 45, y: canvas.height - 140 + 9 };
  }, [phase]);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    dragEndRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!isDraggingRef.current || phase !== "playing") {
      isDraggingRef.current = false;
      return;
    }

    const dx = dragStartRef.current.x - dragEndRef.current.x;
    const dy = dragStartRef.current.y - dragEndRef.current.y;
    
    const power = Math.sqrt(dx * dx + dy * dy);
    if (power < 20) {
      isDraggingRef.current = false;
      return;
    }

    const snowball: Snowball = {
      id: Date.now(),
      x: throwOriginRef.current.x,
      y: throwOriginRef.current.y,
      vx: dx * THROW_POWER_MULTIPLIER,
      vy: dy * THROW_POWER_MULTIPLIER,
    };

    snowballsRef.current.push(snowball);
    setShots(s => s + 1);
    isDraggingRef.current = false;
  }, [phase]);

  const startGame = useCallback(() => {
    targetsRef.current = [];
    snowballsRef.current = [];
    hitEffectsRef.current = [];
    setScore(0);
    setShots(0);
    setHits(0);
    setTimeLeft(GAME_DURATION);
    windRef.current = (Math.random() - 0.5) * 4;
    setPhase("playing");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = Math.min(850, window.innerWidth);
    canvas.height = Math.min(550, window.innerHeight - 150);

    const handleResize = () => {
      canvas.width = Math.min(850, window.innerWidth);
      canvas.height = Math.min(550, window.innerHeight - 150);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("snowball-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;

    animationRef.current = requestAnimationFrame(gameLoop);

    const spawnInterval = setInterval(() => {
      if (targetsRef.current.length < 4) {
        spawnTarget();
      }
    }, 800);

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setPhase("gameOver");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const windInterval = setInterval(() => {
      windRef.current += (Math.random() - 0.5) * 0.5;
      windRef.current = Math.max(-3, Math.min(3, windRef.current));
    }, 2000);

    return () => {
      cancelAnimationFrame(animationRef.current);
      clearInterval(spawnInterval);
      clearInterval(timer);
      clearInterval(windInterval);
    };
  }, [phase, gameLoop, spawnTarget]);

  useEffect(() => {
    if (phase === "gameOver" && score > highScore) {
      setHighScore(score);
      localStorage.setItem("snowball-high-score", String(score));
    }
  }, [phase, score, highScore]);

  const accuracy = shots > 0 ? Math.round((hits / shots) * 100) : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-200 to-sky-100 flex flex-col items-center pt-4">
      {/* Score UI */}
      {phase === "playing" && (
        <div className="flex gap-4 mb-2 flex-wrap justify-center">
          <div className="bg-white/90 rounded-xl px-4 py-2 shadow-lg">
            <p className="text-xl font-bold text-blue-700">❄️ {score}</p>
          </div>
          <div className="bg-white/90 rounded-xl px-4 py-2 shadow-lg">
            <p className="text-xl font-bold text-orange-500">⏱️ {timeLeft}s</p>
          </div>
          <div className="bg-white/90 rounded-xl px-4 py-2 shadow-lg">
            <p className="text-xl font-bold text-purple-600">🎯 {accuracy}%</p>
          </div>
        </div>
      )}

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="rounded-2xl shadow-2xl cursor-crosshair touch-none"
        onPointerDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onPointerMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      {/* Instructions */}
      {phase === "playing" && (
        <div className="mt-2 bg-white/80 rounded-xl px-4 py-2 shadow text-center max-w-md">
          <p className="text-sm text-gray-600">
            🎯 Drag backwards and release to throw! 
            <span className="text-green-600 font-bold"> Green = +10</span> | 
            <span className="text-red-600 font-bold"> Red = -5</span>
          </p>
        </div>
      )}

      {/* Menu */}
      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h1 className="text-4xl font-black text-blue-600 mb-2">❄️ Snowball Fight!</h1>
            <p className="text-gray-600 mb-4">Throw snowballs at targets!</p>
            
            <div className="flex justify-center gap-4 mb-4">
              <div className="bg-green-100 rounded-xl px-4 py-2">
                <span className="text-2xl">🎯</span>
                <p className="text-sm font-bold text-green-600">Target +10</p>
              </div>
              <div className="bg-red-100 rounded-xl px-4 py-2">
                <span className="text-2xl">😊</span>
                <p className="text-sm font-bold text-red-600">Friend -5</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-2">
              Drag backwards to aim, release to throw!
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Watch the wind - it affects your throws!
            </p>

            {highScore > 0 && (
              <p className="text-xl font-bold text-yellow-500 mb-4">🏆 Best: {highScore}</p>
            )}
            
            <button
              onClick={startGame}
              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xl shadow-lg active:scale-95 transition-transform"
            >
              ▶️ Play
            </button>
          </div>
        </div>
      )}

      {/* Game Over */}
      {phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-3xl font-black text-blue-600 mb-2">⏱️ Time's Up!</h2>
            <p className="text-3xl font-bold text-gray-700 my-4">❄️ {score} points!</p>
            
            <div className="bg-gray-100 rounded-xl p-4 mb-4">
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{shots}</p>
                  <p className="text-sm text-gray-500">Throws</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{hits}</p>
                  <p className="text-sm text-gray-500">Hits</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{accuracy}%</p>
                  <p className="text-sm text-gray-500">Accuracy</p>
                </div>
              </div>
            </div>

            {score >= highScore && score > 0 && (
              <p className="text-xl font-bold text-yellow-500 mb-4">🏆 New Best!</p>
            )}
            
            <div className="space-y-2">
              <button
                onClick={startGame}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
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
