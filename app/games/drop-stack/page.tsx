"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type GamePhase = "menu" | "playing" | "gameOver";

interface Block {
  x: number;
  width: number;
  y: number;
  color: string;
  perfect: boolean;
}

const COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#FFE66D", // Yellow
  "#95E1D3", // Mint
  "#F38181", // Coral
  "#AA96DA", // Purple
  "#FCBAD3", // Pink
  "#A8D8EA", // Light Blue
  "#FF9F43", // Orange
  "#5F27CD", // Violet
];

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const BLOCK_HEIGHT = 25;
const INITIAL_BLOCK_WIDTH = 200;
const MIN_BLOCK_WIDTH = 20;
const MOVE_SPEED_INITIAL = 3;
const DROP_SPEED = 15;
const PERFECT_THRESHOLD = 5; // pixels of tolerance for "perfect" drop

export default function DropStackPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [height, setHeight] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [perfectStreak, setPerfectStreak] = useState(0);
  const [showPerfect, setShowPerfect] = useState(false);

  const currentBlockRef = useRef({
    x: 0,
    width: INITIAL_BLOCK_WIDTH,
    direction: 1,
    y: 0,
    isDropping: false,
    color: COLORS[0],
  });
  const stackRef = useRef<Block[]>([]);
  const speedRef = useRef(MOVE_SPEED_INITIAL);
  const animationRef = useRef<number>(0);
  const colorIndexRef = useRef(0);

  // Initialize base block
  const initGame = useCallback(() => {
    stackRef.current = [{
      x: (GAME_WIDTH - INITIAL_BLOCK_WIDTH) / 2,
      width: INITIAL_BLOCK_WIDTH,
      y: GAME_HEIGHT - BLOCK_HEIGHT,
      color: COLORS[0],
      perfect: false,
    }];
    colorIndexRef.current = 1;
    currentBlockRef.current = {
      x: 0,
      width: INITIAL_BLOCK_WIDTH,
      direction: 1,
      y: GAME_HEIGHT - BLOCK_HEIGHT * 2,
      isDropping: false,
      color: COLORS[1 % COLORS.length],
    };
    speedRef.current = MOVE_SPEED_INITIAL;
    setHeight(0);
    setPerfectStreak(0);
  }, []);

  const dropBlock = useCallback(() => {
    if (currentBlockRef.current.isDropping || phase !== "playing") return;
    currentBlockRef.current.isDropping = true;
  }, [phase]);

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || phase !== "playing") return;

    // Clear with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(1, "#16213e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw stars background
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    for (let i = 0; i < 30; i++) {
      const x = (i * 47 + timestamp / 50) % GAME_WIDTH;
      const y = (i * 31) % GAME_HEIGHT;
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    const current = currentBlockRef.current;
    const stack = stackRef.current;

    // If not dropping, move the block
    if (!current.isDropping) {
      current.x += speedRef.current * current.direction;
      
      // Bounce off walls
      if (current.x + current.width > GAME_WIDTH) {
        current.x = GAME_WIDTH - current.width;
        current.direction = -1;
      } else if (current.x < 0) {
        current.x = 0;
        current.direction = 1;
      }
    } else {
      // Dropping animation
      current.y += DROP_SPEED;
      
      const targetY = stack.length > 0 
        ? stack[stack.length - 1].y - BLOCK_HEIGHT 
        : GAME_HEIGHT - BLOCK_HEIGHT;
      
      if (current.y >= targetY) {
        current.y = targetY;
        current.isDropping = false;
        
        // Calculate landing
        const lastBlock = stack[stack.length - 1];
        const overlapStart = Math.max(current.x, lastBlock.x);
        const overlapEnd = Math.min(current.x + current.width, lastBlock.x + lastBlock.width);
        const overlapWidth = overlapEnd - overlapStart;
        
        if (overlapWidth <= 0) {
          // Missed completely - game over
          if (height > highScore) {
            setHighScore(height);
            localStorage.setItem("dropstack-high-score", String(height));
          }
          setPhase("gameOver");
          return;
        }
        
        // Check for perfect drop
        const isPerfect = Math.abs(current.x - lastBlock.x) < PERFECT_THRESHOLD &&
                          Math.abs(current.width - lastBlock.width) < PERFECT_THRESHOLD;
        
        if (isPerfect) {
          // Perfect drop - keep full width, align perfectly
          current.x = lastBlock.x;
          current.width = lastBlock.width;
          setPerfectStreak(s => s + 1);
          setShowPerfect(true);
          setTimeout(() => setShowPerfect(false), 500);
        } else {
          setPerfectStreak(0);
          
          // Add cut-off piece animation (falling off)
          const leftCut = overlapStart - current.x;
          const rightCut = (current.x + current.width) - overlapEnd;
          
          if (leftCut > 0) {
            // Draw falling left piece
            ctx.fillStyle = current.color;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(current.x, current.y, leftCut, BLOCK_HEIGHT);
            ctx.globalAlpha = 1;
          }
          if (rightCut > 0) {
            // Draw falling right piece
            ctx.fillStyle = current.color;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(overlapEnd, current.y, rightCut, BLOCK_HEIGHT);
            ctx.globalAlpha = 1;
          }
        }
        
        // Add to stack with overlap
        const newBlock: Block = {
          x: overlapStart,
          width: overlapWidth,
          y: current.y,
          color: current.color,
          perfect: isPerfect,
        };
        stack.push(newBlock);
        
        // Check if too small
        if (overlapWidth < MIN_BLOCK_WIDTH) {
          if (height > highScore) {
            setHighScore(height);
            localStorage.setItem("dropstack-high-score", String(height));
          }
          setPhase("gameOver");
          return;
        }
        
        // Update score
        setHeight(h => h + 1);
        
        // Prepare next block
        colorIndexRef.current = (colorIndexRef.current + 1) % COLORS.length;
        current.x = 0;
        current.width = overlapWidth;
        current.direction = 1;
        current.y = current.y - BLOCK_HEIGHT;
        current.color = COLORS[colorIndexRef.current];
        
        // Increase speed
        speedRef.current = Math.min(MOVE_SPEED_INITIAL + stack.length * 0.2, 8);
        
        // Scroll view if needed
        if (current.y < 100) {
          const scrollAmount = 100 - current.y;
          stack.forEach(block => {
            block.y += scrollAmount;
          });
          current.y = 100;
        }
      }
    }

    // Draw stack
    stack.forEach((block, index) => {
      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(block.x + 3, block.y + 3, block.width, BLOCK_HEIGHT);
      
      // Block
      ctx.fillStyle = block.color;
      ctx.fillRect(block.x, block.y, block.width, BLOCK_HEIGHT);
      
      // Highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fillRect(block.x, block.y, block.width, 5);
      
      // Perfect indicator
      if (block.perfect) {
        ctx.fillStyle = "rgba(255, 255, 0, 0.5)";
        ctx.fillRect(block.x, block.y, block.width, BLOCK_HEIGHT);
      }
    });

    // Draw current block
    if (!current.isDropping || current.y < GAME_HEIGHT) {
      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(current.x + 3, current.y + 3, current.width, BLOCK_HEIGHT);
      
      // Block
      ctx.fillStyle = current.color;
      ctx.fillRect(current.x, current.y, current.width, BLOCK_HEIGHT);
      
      // Highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillRect(current.x, current.y, current.width, 5);
      
      // Glow effect when moving
      if (!current.isDropping) {
        ctx.strokeStyle = current.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = current.color;
        ctx.shadowBlur = 10;
        ctx.strokeRect(current.x, current.y, current.width, BLOCK_HEIGHT);
        ctx.shadowBlur = 0;
      }
    }

    // Draw UI
    ctx.font = "bold 28px 'Fredoka One', cursive, sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.fillText(`Height: ${height}`, 20, 40);
    
    if (perfectStreak > 0) {
      ctx.fillStyle = "#FFD700";
      ctx.fillText(`${perfectStreak}`, GAME_WIDTH - 60, 40);
      ctx.font = "20px 'Fredoka One', cursive, sans-serif";
      ctx.fillText("STREAK!", GAME_WIDTH - 55, 40);
    }

    // Perfect popup
    if (showPerfect) {
      ctx.font = "bold 40px 'Fredoka One', cursive, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFD700";
      ctx.shadowColor = "#FF6B6B";
      ctx.shadowBlur = 20;
      ctx.fillText("PERFECT!", GAME_WIDTH / 2, GAME_HEIGHT / 2);
      ctx.shadowBlur = 0;
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [phase, height, highScore, perfectStreak, showPerfect]);

  const startGame = useCallback(() => {
    initGame();
    setPhase("playing");
  }, [initGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleResize = () => {
      const scale = Math.min(window.innerWidth / GAME_WIDTH, (window.innerHeight - 100) / GAME_HEIGHT);
      canvas.style.width = `${GAME_WIDTH * scale}px`;
      canvas.style.height = `${GAME_HEIGHT * scale}px`;
    };
    
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("dropstack-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [phase, gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (phase === "playing") dropBlock();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, dropBlock]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col items-center justify-center p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="rounded-2xl shadow-2xl cursor-pointer"
          onClick={dropBlock}
          onTouchStart={(e) => {
            e.preventDefault();
            dropBlock();
          }}
        />

        {phase === "menu" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
            <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm">
              <h1 className="text-4xl font-black text-gray-700 mb-2">🧱 Drop Stack</h1>
              <p className="text-gray-600 mb-4 text-lg">Stack the blocks perfectly!</p>
              <div className="bg-gray-100 rounded-xl p-4 mb-4 text-left text-sm">
                <p className="text-gray-600 mb-2">🎯 <strong>How to play:</strong></p>
                <ul className="text-gray-500 space-y-1">
                  <li>• Tap to drop the moving block</li>
                  <li>• Line it up with the stack below</li>
                  <li>• Perfect drops = bonus points!</li>
                  <li>• Don't let the stack get too small!</li>
                </ul>
              </div>
              {highScore > 0 && (
                <p className="text-xl font-bold text-yellow-500 mb-4">
                  🏆 Best: {highScore}
                </p>
              )}
              <button
                onClick={startGame}
                className="px-8 py-4 bg-gradient-to-r from-[#4ECDC4] to-[#44A08D] text-white font-bold rounded-xl text-xl shadow-lg hover:scale-105 transition-transform"
              >
                ▶️ Play
              </button>
            </div>
          </div>
        )}

        {phase === "gameOver" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
            <div className="bg-white rounded-3xl p-8 shadow-2xl text-center">
              <h2 className="text-3xl font-black text-red-500 mb-2">💥 Too Small!</h2>
              <p className="text-5xl font-black text-gray-700 my-4">{height}</p>
              <p className="text-gray-500 mb-4">blocks stacked</p>
              {height >= highScore && height > 0 && (
                <p className="text-xl font-bold text-yellow-500 mb-4">🏆 New Record!</p>
              )}
              {perfectStreak > 2 && (
                <p className="text-lg font-bold text-[#4ECDC4] mb-4">
                  🔥 {perfectStreak} Perfect Streak!
                </p>
              )}
              <div className="space-y-2">
                <button
                  onClick={startGame}
                  className="w-full px-6 py-3 bg-gradient-to-r from-[#4ECDC4] to-[#44A08D] text-white font-bold rounded-xl shadow-lg"
                >
                  Try Again
                </button>
                <button
                  onClick={() => setPhase("menu")}
                  className="w-full px-6 py-3 bg-gray-200 text-gray-600 font-bold rounded-xl"
                >
                  Menu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {phase === "playing" && (
        <p className="mt-4 text-white/60 text-sm">Tap or press SPACE to drop!</p>
      )}
    </main>
  );
}
