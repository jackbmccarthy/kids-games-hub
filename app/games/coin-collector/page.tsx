"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Phase = "menu" | "playing" | "gameOver";

interface Coin {
  id: number;
  x: number;
  y: number;
  type: "penny" | "nickel" | "dime" | "quarter" | "golden";
  rotation: number;
  speed: number;
}

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const BANK_WIDTH = 80;
const COIN_SIZE = 30;

const COIN_VALUES: Record<string, number> = {
  penny: 1,
  nickel: 5,
  dime: 10,
  quarter: 25,
  golden: 100,
};

const COIN_COLORS: Record<string, string> = {
  penny: "#B87333",
  nickel: "#C0C0C0",
  dime: "#A8A8A8",
  quarter: "#D4D4D4",
  golden: "#FFD700",
};

export default function CoinCollectorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);

  const bankRef = useRef({ x: GAME_WIDTH / 2 - BANK_WIDTH / 2 });
  const coinsRef = useRef<Coin[]>([]);
  const animationRef = useRef<number>(0);

  const spawnCoin = useCallback(() => {
    const types: ("penny" | "nickel" | "dime" | "quarter" | "golden")[] = 
      ["penny", "penny", "nickel", "nickel", "dime", "quarter"];
    if (Math.random() < 0.05) types.push("golden");

    const coin: Coin = {
      id: Date.now() + Math.random(),
      x: Math.random() * (GAME_WIDTH - COIN_SIZE),
      y: -COIN_SIZE,
      type: types[Math.floor(Math.random() * types.length)],
      rotation: 0,
      speed: 2 + Math.random() * 2,
    };
    coinsRef.current.push(coin);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background - bank vault
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, "#1a1a3e");
    gradient.addColorStop(1, "#2d2d5a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw coins
    coinsRef.current.forEach((coin) => {
      ctx.save();
      ctx.translate(coin.x + COIN_SIZE / 2, coin.y + COIN_SIZE / 2);
      ctx.rotate((coin.rotation * Math.PI) / 180);
      
      ctx.beginPath();
      ctx.arc(0, 0, COIN_SIZE / 2, 0, Math.PI * 2);
      ctx.fillStyle = COIN_COLORS[coin.type];
      ctx.fill();
      ctx.strokeStyle = coin.type === "golden" ? "#FFA500" : "#888";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Coin shine
      ctx.beginPath();
      ctx.arc(-5, -5, 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fill();

      ctx.restore();
    });

    // Draw piggy bank
    const bank = bankRef.current;
    ctx.fillStyle = "#FFB6C1";
    ctx.beginPath();
    ctx.ellipse(bank.x + BANK_WIDTH / 2, GAME_HEIGHT - 60, BANK_WIDTH / 2, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FF69B4";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Snout
    ctx.fillStyle = "#FF69B4";
    ctx.beginPath();
    ctx.ellipse(bank.x + BANK_WIDTH - 10, GAME_HEIGHT - 60, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Nostrils
    ctx.fillStyle = "#FF1493";
    ctx.beginPath();
    ctx.ellipse(bank.x + BANK_WIDTH - 15, GAME_HEIGHT - 62, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(bank.x + BANK_WIDTH - 8, GAME_HEIGHT - 62, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Slot
    ctx.fillStyle = "#333";
    ctx.fillRect(bank.x + BANK_WIDTH / 2 - 20, GAME_HEIGHT - 100, 40, 8);

    // UI
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`$${score}`, 10, 30);
    ctx.fillText(`${combo}x`, 10, 60);

    ctx.textAlign = "right";
    ctx.fillStyle = "#FFF";
    ctx.fillText(`Best: $${highScore}`, GAME_WIDTH - 10, 30);
  }, [score, combo, highScore]);

  const update = useCallback(() => {
    const coins = coinsRef.current;
    const bank = bankRef.current;

    for (let i = coins.length - 1; i >= 0; i--) {
      const coin = coins[i];
      coin.y += coin.speed;
      coin.rotation += 2;

      // Check bank collision
      if (
        coin.y + COIN_SIZE > GAME_HEIGHT - 100 &&
        coin.y < GAME_HEIGHT - 50 &&
        coin.x + COIN_SIZE > bank.x &&
        coin.x < bank.x + BANK_WIDTH
      ) {
        const value = COIN_VALUES[coin.type] * (combo + 1);
        setScore((s) => s + value);
        setCombo((c) => c + 1);
        coins.splice(i, 1);
        continue;
      }

      if (coin.y > GAME_HEIGHT) {
        coins.splice(i, 1);
        setCombo(0);
      }
    }

    if (Math.random() < 0.03) spawnCoin();
  }, [spawnCoin, combo]);

  const gameLoop = useCallback(() => {
    if (phase === "playing") {
      update();
      draw();
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [phase, update, draw]);

  useEffect(() => {
    if (phase === "playing") {
      coinsRef.current = [];
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [phase, gameLoop]);

  useEffect(() => {
    const saved = localStorage.getItem("coin-collector-high");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("coin-collector-high", score.toString());
    }
  }, [score, highScore]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - BANK_WIDTH / 2;
    bankRef.current.x = Math.max(0, Math.min(GAME_WIDTH - BANK_WIDTH, x));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-yellow-400 mb-4">🪙 Coin Collector</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-purple-200 mb-2">Catch falling coins in your piggy bank!</p>
          <p className="text-purple-300 mb-4 text-sm">High Score: ${highScore}</p>
          <button
            onClick={() => {
              setScore(0);
              setCombo(0);
              setPhase("playing");
            }}
            className="px-8 py-4 bg-yellow-500 text-purple-900 font-bold rounded-xl text-xl"
          >
            Play!
          </button>
        </div>
      )}

      {phase === "playing" && (
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          onMouseMove={handleMouseMove}
          className="rounded-2xl shadow-2xl cursor-none"
        />
      )}

      {phase === "playing" && (
        <button
          onClick={() => setPhase("menu")}
          className="mt-4 px-4 py-2 bg-purple-700 text-white rounded-lg"
        >
          Back to Menu
        </button>
      )}
    </div>
  );
}
