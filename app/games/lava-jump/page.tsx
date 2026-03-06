"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type Phase = "menu" | "playing" | "gameOver";

interface Platform {
  x: number;
  y: number;
  width: number;
}

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const PLAYER_SIZE = 30;

export default function LavaJumpPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const playerRef = useRef({ x: 180, y: 500, vy: 0, onGround: true });
  const platformsRef = useRef<Platform[]>([]);
  const lavaRef = useRef(0);
  const animationRef = useRef<number>(0);

  const initGame = useCallback(() => {
    playerRef.current = { x: 180, y: 500, vy: 0, onGround: true };
    platformsRef.current = [
      { x: 150, y: 550, width: 100 },
      { x: 50, y: 450, width: 80 },
      { x: 250, y: 350, width: 80 },
      { x: 100, y: 250, width: 100 },
      { x: 200, y: 150, width: 80 },
    ];
    lavaRef.current = 0;
    setScore(0);
  }, []);

  const jump = useCallback(() => {
    if (playerRef.current.onGround) {
      playerRef.current.vy = -12;
      playerRef.current.onGround = false;
    }
  }, []);

  const moveLeft = () => { playerRef.current.x = Math.max(0, playerRef.current.x - 10); };
  const moveRight = () => { playerRef.current.x = Math.min(GAME_WIDTH - PLAYER_SIZE, playerRef.current.x + 10); };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#1a0a0a";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Lava
    const gradient = ctx.createLinearGradient(0, GAME_HEIGHT - lavaRef.current, 0, GAME_HEIGHT);
    gradient.addColorStop(0, "#FF4500");
    gradient.addColorStop(1, "#FF0000");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, GAME_HEIGHT - lavaRef.current, GAME_WIDTH, lavaRef.current);

    // Platforms
    platformsRef.current.forEach((p) => {
      ctx.fillStyle = "#666";
      ctx.fillRect(p.x, p.y, p.width, 15);
      ctx.fillStyle = "#888";
      ctx.fillRect(p.x, p.y, p.width, 5);
    });

    // Player
    const p = playerRef.current;
    ctx.fillStyle = "#4ECDC4";
    ctx.fillRect(p.x, p.y, PLAYER_SIZE, PLAYER_SIZE);
    ctx.fillStyle = "#FFF";
    ctx.fillRect(p.x + 5, p.y + 8, 8, 8);
    ctx.fillRect(p.x + 17, p.y + 8, 8, 8);

    // Score
    ctx.fillStyle = "#FFF";
    ctx.font = "bold 24px Arial";
    ctx.fillText(`Height: ${score}m`, 10, 30);
  }, [score]);

  const update = useCallback(() => {
    const p = playerRef.current;
    const platforms = platformsRef.current;

    // Gravity
    p.vy += 0.5;
    p.y += p.vy;

    // Platform collision
    p.onGround = false;
    platforms.forEach((plat) => {
      if (p.vy > 0 && p.y + PLAYER_SIZE > plat.y && p.y + PLAYER_SIZE < plat.y + 20 &&
          p.x + PLAYER_SIZE > plat.x && p.x < plat.x + plat.width) {
        p.y = plat.y - PLAYER_SIZE;
        p.vy = 0;
        p.onGround = true;
      }
    });

    // Lava rising
    lavaRef.current += 0.5;
    if (p.y + PLAYER_SIZE > GAME_HEIGHT - lavaRef.current) {
      setPhase("gameOver");
    }

    // Score based on height
    const heightScore = Math.floor((GAME_HEIGHT - p.y) / 50);
    setScore(Math.max(score, heightScore));
  }, [score]);

  const gameLoop = useCallback(() => {
    if (phase === "playing") {
      update();
      draw();
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [phase, update, draw]);

  useEffect(() => {
    if (phase === "playing") {
      initGame();
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [phase, initGame, gameLoop]);

  useEffect(() => {
    const saved = localStorage.getItem("lava-jump-high");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("lava-jump-high", score.toString());
    }
  }, [score, highScore]);

  return (
    <div className="min-h-screen bg-red-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-orange-400 mb-4">🌋 Lava Jump</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-red-200 mb-4">Jump between platforms! Don't fall in the lava!</p>
          <p className="text-red-300 mb-4 text-sm">High Score: {highScore}m</p>
          <button onClick={() => setPhase("playing")} className="px-8 py-4 bg-orange-500 text-white font-bold rounded-xl text-xl">Play!</button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="rounded-2xl shadow-xl" />
          <div className="flex gap-4 mt-4 justify-center">
            <button onClick={moveLeft} className="px-6 py-4 bg-gray-700 text-white text-2xl rounded-xl">←</button>
            <button onClick={jump} className="px-8 py-4 bg-red-600 text-white text-2xl rounded-xl">JUMP</button>
            <button onClick={moveRight} className="px-6 py-4 bg-gray-700 text-white text-2xl rounded-xl">→</button>
          </div>
        </div>
      )}

      {phase === "gameOver" && (
        <div className="text-center">
          <p className="text-2xl text-red-400 mb-2">Burned by lava!</p>
          <p className="text-xl text-orange-300 mb-4">Height: {score}m</p>
          <button onClick={() => setPhase("playing")} className="px-8 py-4 bg-orange-500 text-white font-bold rounded-xl">Play Again</button>
        </div>
      )}
    </div>
  );
}
