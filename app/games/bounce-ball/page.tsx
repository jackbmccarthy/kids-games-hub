'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  createdAt: number;
  opacity: number;
}

export default function BounceBallGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [ink, setInk] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [lineDuration, setLineDuration] = useState(5000); // Lines last 5 seconds
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ball: Ball = {
      x: canvas.width / 2,
      y: 100,
      vx: (Math.random() - 0.5) * 4,
      vy: 0,
      radius: 20,
      color: colors[Math.floor(Math.random() * colors.length)],
    };

    setBalls([ball]);
    setLines([]);
    setScore(0);
    setLevel(1);
    setInk(100);
    setGameOver(false);
    setGameStarted(true);
    setLineDuration(5000);
  }, []);

  const addBall = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newBall: Ball = {
      x: Math.random() * (canvas.width - 40) + 20,
      y: 50,
      vx: (Math.random() - 0.5) * 6,
      vy: 0,
      radius: 20,
      color: colors[Math.floor(Math.random() * colors.length)],
    };

    setBalls(prev => [...prev, newBall]);
  }, []);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (ink <= 0 || gameOver || !gameStarted) return;
    const pos = getMousePos(e);
    setIsDrawing(true);
    setCurrentLine({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentLine || ink <= 0) return;
    const pos = getMousePos(e);
    setCurrentLine(prev => prev ? { ...prev, x2: pos.x, y2: pos.y } : null);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentLine) {
      setIsDrawing(false);
      setCurrentLine(null);
      return;
    }

    const length = Math.sqrt(
      Math.pow(currentLine.x2 - currentLine.x1, 2) + Math.pow(currentLine.y2 - currentLine.y1, 2)
    );

    if (length > 10) {
      const inkCost = length / 10;
      if (ink >= inkCost) {
        setLines(prev => [...prev, { ...currentLine, createdAt: Date.now(), opacity: 1 }]);
        setInk(prev => Math.max(0, prev - inkCost));
      }
    }

    setIsDrawing(false);
    setCurrentLine(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (ink <= 0 || gameOver || !gameStarted) return;
    const pos = getTouchPos(e);
    setIsDrawing(true);
    setCurrentLine({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentLine || ink <= 0) return;
    e.preventDefault();
    const pos = getTouchPos(e);
    setCurrentLine(prev => prev ? { ...prev, x2: pos.x, y2: pos.y } : null);
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = (timestamp: number) => {
      const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 16.67 : 1;
      lastTimeRef.current = timestamp;

      // Clear canvas
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      for (let i = 0; i < 50; i++) {
        const x = (i * 73) % canvas.width;
        const y = (i * 97) % canvas.height;
        const size = (i % 3) + 1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Remove old lines
      const now = Date.now();
      setLines(prev => {
        return prev.filter(line => {
          const age = now - line.createdAt;
          return age < lineDuration;
        }).map(line => ({
          ...line,
          opacity: Math.max(0, 1 - (now - line.createdAt) / lineDuration)
        }));
      });

      // Draw lines
      lines.forEach(line => {
        ctx.strokeStyle = `rgba(255, 107, 107, ${line.opacity})`;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(255, 107, 107, ${line.opacity})`;
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Draw current line being drawn
      if (currentLine && isDrawing) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(currentLine.x1, currentLine.y1);
        ctx.lineTo(currentLine.x2, currentLine.y2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Update and draw balls
      const gravity = 0.3 + (level * 0.05);
      const maxSpeed = 8 + (level * 2);
      let allBallsFell = true;

      setBalls(prevBalls => {
        return prevBalls.map(ball => {
          let newBall = { ...ball };

          // Apply gravity
          newBall.vy += gravity * deltaTime;

          // Cap velocity
          newBall.vy = Math.min(newBall.vy, maxSpeed);
          newBall.vx = Math.max(-maxSpeed, Math.min(maxSpeed, newBall.vx));

          // Update position
          newBall.x += newBall.vx * deltaTime;
          newBall.y += newBall.vy * deltaTime;

          // Bounce off walls
          if (newBall.x - newBall.radius < 0) {
            newBall.x = newBall.radius;
            newBall.vx = Math.abs(newBall.vx) * 0.9;
          } else if (newBall.x + newBall.radius > canvas.width) {
            newBall.x = canvas.width - newBall.radius;
            newBall.vx = -Math.abs(newBall.vx) * 0.9;
          }

          // Check line collisions
          lines.forEach(line => {
            const collision = lineCircleCollision(newBall, line);
            if (collision) {
              // Reflect velocity
              const dx = line.x2 - line.x1;
              const dy = line.y2 - line.y1;
              const len = Math.sqrt(dx * dx + dy * dy);
              const nx = -dy / len;
              const ny = dx / len;

              const dot = newBall.vx * nx + newBall.vy * ny;
              newBall.vx = newBall.vx - 2 * dot * nx;
              newBall.vy = newBall.vy - 2 * dot * ny;

              // Add some energy loss
              newBall.vx *= 0.85;
              newBall.vy *= 0.85;

              // Move ball out of collision
              newBall.x += nx * 2;
              newBall.y += ny * 2;

              // Minimum bounce velocity
              if (Math.abs(newBall.vy) < 2) {
                newBall.vy = -2;
              }
            }
          });

          // Check if ball is still on screen
          if (newBall.y + newBall.radius < canvas.height + 50) {
            allBallsFell = false;
          }

          return newBall;
        });
      });

      // Draw balls
      balls.forEach(ball => {
        // Ball shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(ball.x, canvas.height - 10, ball.radius * 0.8, ball.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ball gradient
        const ballGradient = ctx.createRadialGradient(
          ball.x - ball.radius * 0.3,
          ball.y - ball.radius * 0.3,
          0,
          ball.x,
          ball.y,
          ball.radius
        );
        ballGradient.addColorStop(0, '#ffffff');
        ballGradient.addColorStop(0.3, ball.color);
        ballGradient.addColorStop(1, shadeColor(ball.color, -30));

        ctx.fillStyle = ballGradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = ball.color;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Ball highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Check game over
      const activeBalls = balls.filter(ball => ball.y - ball.radius < canvas.height + 50);
      if (activeBalls.length === 0 && balls.length > 0) {
        setGameOver(true);
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, gameOver, lines, currentLine, isDrawing, balls, level, lineDuration]);

  // Score timer
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setScore(prev => prev + 1);
    }, 100);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);

  // Level up
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const levelTimer = setInterval(() => {
      setLevel(prev => {
        const newLevel = prev + 1;
        
        // Add new ball every 3 levels
        if (newLevel % 3 === 0) {
          addBall();
        }

        // Decrease line duration (make it harder)
        setLineDuration(Math.max(2000, 5000 - newLevel * 200));

        // Regenerate some ink
        setInk(prevInk => Math.min(100, prevInk + 20));

        return newLevel;
      });
    }, 15000); // Level up every 15 seconds

    return () => clearInterval(levelTimer);
  }, [gameStarted, gameOver, addBall]);

  // Ink regeneration
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const inkTimer = setInterval(() => {
      setInk(prev => Math.min(100, prev + 0.5));
    }, 500);

    return () => clearInterval(inkTimer);
  }, [gameStarted, gameOver]);

  const shadeColor = (color: string, percent: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)).toString(16).slice(1);
  };

  const lineCircleCollision = (ball: Ball, line: Line) => {
    const dx = line.x2 - line.x1;
    const dy = line.y2 - line.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const dot = ((ball.x - line.x1) * dx + (ball.y - line.y1) * dy) / (len * len);
    const closestX = line.x1 + dot * dx;
    const closestY = line.y1 + dot * dy;

    // Check if closest point is on line segment
    const onSegment = dot >= 0 && dot <= 1;
    if (!onSegment) return false;

    const distance = Math.sqrt(
      Math.pow(ball.x - closestX, 2) + Math.pow(ball.y - closestY, 2)
    );

    return distance <= ball.radius + 4; // 4 is half line width
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 px-4">
          <Link 
            href="/"
            className="bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-full transition-all"
          >
            ← Back
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center drop-shadow-lg">
            🎾 Bounce Ball
          </h1>
          <div className="text-white font-bold text-xl">Level {level}</div>
        </div>

        {/* Stats Bar */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-4xl">⭐</span>
            <span className="text-white font-bold text-2xl">{score}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <div className="w-32 md:w-48 h-6 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-300"
                style={{ width: `${ink}%` }}
              />
            </div>
            <span className="text-white font-bold">{Math.floor(ink)}%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-3xl">🏀</span>
            <span className="text-white font-bold text-xl">×{balls.length}</span>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full bg-gray-900 cursor-crosshair touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">Game Over!</h2>
              <p className="text-2xl md:text-3xl text-white mb-2">Final Score: {score}</p>
              <p className="text-xl text-white/80 mb-8">Level {level} • {balls.length} Ball{balls.length > 1 ? 's' : ''}</p>
              <button
                onClick={initGame}
                className="bg-gradient-to-r from-green-400 to-cyan-400 hover:from-green-500 hover:to-cyan-500 text-white font-bold text-2xl py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
              >
                Play Again
              </button>
            </div>
          )}

          {/* Start Screen */}
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 text-center px-4">
                🎾 Bounce Ball 🎾
              </h2>
              <div className="text-white text-center mb-8 px-8 max-w-md">
                <p className="text-xl mb-4">Draw lines to keep the ball bouncing!</p>
                <div className="text-left space-y-2 text-lg">
                  <p>🎨 Draw platforms with your ink</p>
                  <p>⏱️ Lines fade after a few seconds</p>
                  <p>⭐ Score points by staying alive</p>
                  <p>🏀 More balls appear at higher levels</p>
                  <p>⚡ The ball speeds up over time</p>
                </div>
              </div>
              <button
                onClick={initGame}
                className="bg-gradient-to-r from-green-400 to-cyan-400 hover:from-green-500 hover:to-cyan-500 text-white font-bold text-3xl py-5 px-16 rounded-full shadow-lg transform hover:scale-105 transition-all"
              >
                Start Game
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-white/80 text-sm md:text-base">
          Draw lines with your mouse or finger • Keep the ball from falling • Ink regenerates slowly
        </div>
      </div>
    </div>
  );
}
