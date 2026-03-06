"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type GamePhase = "menu" | "playing" | "gameOver";

interface Obstacle {
  id: number;
  x: number;
  type: "cactus" | "bird";
  width: number;
  height: number;
  y: number;
}

export default function DinoJumpPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const dinoRef = useRef({ y: 0, vy: 0, isJumping: false, isDucking: false });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const groundRef = useRef(0);
  const speedRef = useRef(5);
  const animationRef = useRef<number>(0);
  const lastObstacleRef = useRef(0);

  const GROUND_Y = 300;
  const GRAVITY = 0.8;
  const JUMP_FORCE = -15;

  const jump = useCallback(() => {
    if (!dinoRef.current.isJumping && !dinoRef.current.isDucking) {
      dinoRef.current.vy = JUMP_FORCE;
      dinoRef.current.isJumping = true;
    }
  }, []);

  const duck = useCallback((isDucking: boolean) => {
    dinoRef.current.isDucking = isDucking;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (phase === "playing") jump();
      }
      if (e.code === "ArrowDown") {
        e.preventDefault();
        if (phase === "playing") duck(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown") duck(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [phase, jump, duck]);

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || phase !== "playing") return;

    // Clear
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ground
    groundRef.current = (groundRef.current + speedRef.current) % 20;
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(canvas.width, GROUND_Y);
    for (let i = -groundRef.current; i < canvas.width; i += 20) {
      ctx.moveTo(i, GROUND_Y);
      ctx.lineTo(i + 10, GROUND_Y + 5);
    }
    ctx.stroke();

    // Update dino
    const dino = dinoRef.current;
    dino.vy += GRAVITY;
    dino.y += dino.vy;
    if (dino.y >= 0) {
      dino.y = 0;
      dino.vy = 0;
      dino.isJumping = false;
    }

    // Draw dino (simple pixel style)
    const dinoX = 50;
    const dinoY = GROUND_Y - 40 + dino.y;
    const dinoH = dino.isDucking ? 25 : 40;
    
    ctx.fillStyle = "#2d5016";
    // Body
    ctx.fillRect(dinoX, dinoY, 40, dinoH);
    // Head
    if (!dino.isDucking) {
      ctx.fillRect(dinoX + 25, dinoY - 20, 25, 20);
      // Eye
      ctx.fillStyle = "#fff";
      ctx.fillRect(dinoX + 40, dinoY - 15, 5, 5);
    }
    // Legs (animated)
    ctx.fillStyle = "#2d5016";
    if (dino.isJumping) {
      ctx.fillRect(dinoX + 5, dinoY + dinoH, 8, 15);
      ctx.fillRect(dinoX + 25, dinoY + dinoH, 8, 15);
    } else {
      const legOffset = Math.sin(timestamp / 100) * 5;
      ctx.fillRect(dinoX + 5 + legOffset, dinoY + dinoH, 8, 10);
      ctx.fillRect(dinoX + 25 - legOffset, dinoY + dinoH, 8, 10);
    }

    // Spawn obstacles
    if (timestamp - lastObstacleRef.current > 1500 + Math.random() * 1000) {
      const isBird = Math.random() > 0.7 && score > 100;
      obstaclesRef.current.push({
        id: Date.now(),
        x: canvas.width,
        type: isBird ? "bird" : "cactus",
        width: isBird ? 40 : 20 + Math.random() * 20,
        height: isBird ? 30 : 40 + Math.random() * 20,
        y: isBird ? GROUND_Y - 80 - Math.random() * 40 : GROUND_Y - 40,
      });
      lastObstacleRef.current = timestamp;
    }

    // Update and draw obstacles
    let collision = false;
    obstaclesRef.current = obstaclesRef.current.filter(obs => {
      obs.x -= speedRef.current;

      // Draw obstacle
      if (obs.type === "cactus") {
        ctx.fillStyle = "#2d5016";
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        // Arms
        ctx.fillRect(obs.x - 10, obs.y + 15, 10, 5);
        ctx.fillRect(obs.x + obs.width, obs.y + 10, 10, 5);
      } else {
        // Bird
        ctx.fillStyle = "#333";
        const wingY = Math.sin(timestamp / 100) * 5;
        ctx.fillRect(obs.x, obs.y + wingY, obs.width, 10);
        ctx.fillRect(obs.x + 15, obs.y, 10, 15);
      }

      // Collision check
      const dinoLeft = dinoX;
      const dinoRight = dinoX + 40;
      const dinoTop = dinoY;
      const dinoBottom = dinoY + dinoH;

      if (dinoRight > obs.x && dinoLeft < obs.x + obs.width &&
          dinoBottom > obs.y && dinoTop < obs.y + obs.height) {
        collision = true;
      }

      return obs.x > -50;
    });

    // Update score
    setScore(s => {
      const newScore = s + 1;
      speedRef.current = 5 + Math.floor(newScore / 100) * 0.5;
      return newScore;
    });

    // Draw score
    ctx.font = "bold 24px monospace";
    ctx.fillStyle = "#333";
    ctx.fillText(`Score: ${score}`, canvas.width - 150, 40);

    if (collision) {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("dino-high-score", String(score));
      }
      setPhase("gameOver");
      return;
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [phase, score, highScore]);

  const startGame = useCallback(() => {
    dinoRef.current = { y: 0, vy: 0, isJumping: false, isDucking: false };
    obstaclesRef.current = [];
    speedRef.current = 5;
    setScore(0);
    lastObstacleRef.current = 0;
    setPhase("playing");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = Math.min(800, window.innerWidth);
    canvas.height = 350;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("dino-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [phase, gameLoop]);

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <canvas
        ref={canvasRef}
        className="border-b-4 border-gray-300 bg-white cursor-pointer"
        onClick={jump}
        onTouchStart={jump}
      />

      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center border-4 border-gray-300">
            <h1 className="text-4xl font-black text-gray-700 mb-2">🦖 Dino Jump</h1>
            <p className="text-gray-600 mb-4">Press SPACE or tap to jump!</p>
            <p className="text-sm text-gray-500 mb-4">↑ Jump | ↓ Duck under birds</p>
            {highScore > 0 && <p className="text-xl font-bold text-gray-700 mb-4">🏆 {highScore}</p>}
            <button onClick={startGame} className="px-8 py-4 bg-gray-700 text-white font-bold rounded-xl text-xl">
              ▶️ Start
            </button>
          </div>
        </div>
      )}

      {phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center border-4 border-red-300">
            <h2 className="text-3xl font-black text-red-500 mb-2">💀 Game Over!</h2>
            <p className="text-2xl font-bold text-gray-700 my-4">Score: {score}</p>
            {score >= highScore && score > 0 && <p className="text-xl font-bold text-yellow-500 mb-4">🏆 New Record!</p>}
            <div className="space-y-2">
              <button onClick={startGame} className="w-full px-6 py-3 bg-gray-700 text-white font-bold rounded-xl">Retry</button>
              <button onClick={() => setPhase("menu")} className="w-full px-6 py-3 bg-gray-400 text-white font-bold rounded-xl">Menu</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
