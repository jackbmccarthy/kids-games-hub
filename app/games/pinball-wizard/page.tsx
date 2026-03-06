"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type Phase = "menu" | "playing" | "gameOver";

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const PADDLE_WIDTH = 80;
const BALL_RADIUS = 10;
const GRAVITY = 0.3;

export default function PinballWizardPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const ballRef = useRef<Ball>({ x: 200, y: 100, vx: 2, vy: 0 });
  const paddleRef = useRef({ x: 160 });
  const bumpersRef = useRef([
    { x: 100, y: 200, r: 30, points: 50 },
    { x: 300, y: 200, r: 30, points: 50 },
    { x: 200, y: 300, r: 40, points: 100 },
  ]);
  const animationRef = useRef<number>(0);

  const reset = useCallback(() => {
    ballRef.current = { x: 200, y: 100, vx: (Math.random() - 0.5) * 4, vy: 0 };
    setScore(0);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Bumpers
    bumpersRef.current.forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = "#FF6B6B";
      ctx.fill();
      ctx.strokeStyle = "#FFD93D";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = "#FFF";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${b.points}`, b.x, b.y + 5);
    });

    // Paddle
    const paddle = paddleRef.current;
    ctx.fillStyle = "#4ECDC4";
    ctx.fillRect(paddle.x, GAME_HEIGHT - 40, PADDLE_WIDTH, 15);
    ctx.strokeStyle = "#2ECC71";
    ctx.lineWidth = 3;
    ctx.strokeRect(paddle.x, GAME_HEIGHT - 40, PADDLE_WIDTH, 15);

    // Ball
    const ball = ballRef.current;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#F1C40F";
    ctx.fill();
    ctx.strokeStyle = "#F39C12";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Score
    ctx.fillStyle = "#FFF";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.textAlign = "right";
    ctx.fillText(`Best: ${highScore}`, GAME_WIDTH - 10, 30);
  }, [score, highScore]);

  const update = useCallback(() => {
    const ball = ballRef.current;

    // Gravity
    ball.vy += GRAVITY;
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall bounce
    if (ball.x < BALL_RADIUS || ball.x > GAME_WIDTH - BALL_RADIUS) {
      ball.vx *= -0.9;
      ball.x = Math.max(BALL_RADIUS, Math.min(GAME_WIDTH - BALL_RADIUS, ball.x));
    }
    if (ball.y < BALL_RADIUS) {
      ball.vy *= -0.9;
      ball.y = BALL_RADIUS;
    }

    // Paddle bounce
    const paddle = paddleRef.current;
    if (
      ball.y > GAME_HEIGHT - 55 &&
      ball.y < GAME_HEIGHT - 35 &&
      ball.x > paddle.x &&
      ball.x < paddle.x + PADDLE_WIDTH
    ) {
      ball.vy = -Math.abs(ball.vy) * 1.1;
      ball.vx += (ball.x - (paddle.x + PADDLE_WIDTH / 2)) * 0.1;
    }

    // Bumper collision
    bumpersRef.current.forEach((b) => {
      const dx = ball.x - b.x;
      const dy = ball.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < b.r + BALL_RADIUS) {
        const angle = Math.atan2(dy, dx);
        ball.vx = Math.cos(angle) * 8;
        ball.vy = Math.sin(angle) * 8;
        setScore((s) => s + b.points);
      }
    });

    // Game over
    if (ball.y > GAME_HEIGHT + 50) {
      setPhase("gameOver");
    }
  }, []);

  const gameLoop = useCallback(() => {
    if (phase === "playing") {
      update();
      draw();
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [phase, update, draw]);

  useEffect(() => {
    if (phase === "playing") {
      reset();
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [phase, reset, gameLoop]);

  useEffect(() => {
    const saved = localStorage.getItem("pinball-wizard-high");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("pinball-wizard-high", score.toString());
    }
  }, [score, highScore]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - PADDLE_WIDTH / 2;
    paddleRef.current.x = Math.max(0, Math.min(GAME_WIDTH - PADDLE_WIDTH, x));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-yellow-400 mb-4">🎱 Pinball Wizard</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-gray-300 mb-4">Bounce the ball off bumpers for points!</p>
          <p className="text-gray-400 mb-4 text-sm">High Score: {highScore}</p>
          <button onClick={() => setPhase("playing")} className="px-8 py-4 bg-yellow-500 text-gray-900 font-bold rounded-xl text-xl">
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
          className="rounded-2xl shadow-2xl"
        />
      )}

      {phase === "gameOver" && (
        <div className="text-center">
          <p className="text-2xl text-red-400 mb-2">Game Over!</p>
          <p className="text-xl text-white mb-4">Score: {score}</p>
          <button onClick={() => setPhase("playing")} className="px-8 py-4 bg-yellow-500 text-gray-900 font-bold rounded-xl">
            Play Again
          </button>
        </div>
      )}

      {phase === "playing" && (
        <button onClick={() => setPhase("menu")} className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg">
          Menu
        </button>
      )}
    </div>
  );
}
