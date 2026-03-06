"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type GamePhase = "menu" | "playing" | "gameOver";

interface Block {
  id: number;
  x: number;
  width: number;
  height: number;
  color: string;
  pattern: string;
  y: number;
  vy: number;
  falling: boolean;
  cutLeft?: number;
  cutRight?: number;
}

interface FallingPiece {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  pattern: string;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
}

// Fun colors for kids
const BLOCK_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#FFE66D", // Yellow
  "#95E1D3", // Mint
  "#F38181", // Coral
  "#AA96DA", // Purple
  "#FF9F43", // Orange
  "#6BCB77", // Green
  "#5DADE2", // Blue
  "#FF85A1", // Pink
];

const PATTERNS = ["solid", "stripes", "dots", "zigzag", "stars"];

export default function BuildATowerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [height, setHeight] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const craneRef = useRef({ x: 0, direction: 1, speed: 3 });
  const currentBlockRef = useRef<Block | null>(null);
  const stackRef = useRef<Block[]>([]);
  const fallingPiecesRef = useRef<FallingPiece[]>([]);
  const animationRef = useRef<number>(0);
  const towerOffsetRef = useRef(0);
  const wobbleRef = useRef(0);

  const BLOCK_HEIGHT = 30;
  const INITIAL_BLOCK_WIDTH = 120;
  const CANVAS_HEIGHT = 600;
  const BASE_Y = 550;
  const CRANE_Y = 50;

  const getRandomColor = () => BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
  const getRandomPattern = () => PATTERNS[Math.floor(Math.random() * PATTERNS.length)];

  const createNewBlock = useCallback((): Block => {
    return {
      id: Date.now(),
      x: craneRef.current.x,
      width: currentBlockRef.current?.width || INITIAL_BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
      color: getRandomColor(),
      pattern: getRandomPattern(),
      y: CRANE_Y + 30,
      vy: 0,
      falling: false,
    };
  }, []);

  const drawPattern = useCallback((ctx: CanvasRenderingContext2D, block: Block | FallingPiece, offsetY = 0) => {
    const { x, width, height, color, pattern } = block;
    const y = 'y' in block ? block.y : 0;

    ctx.fillStyle = color;
    ctx.fillRect(x, y + offsetY, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y + offsetY, width, height);
    ctx.clip();

    switch (pattern) {
      case "stripes":
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 3;
        for (let i = -height; i < width + height; i += 10) {
          ctx.beginPath();
          ctx.moveTo(x + i, y + offsetY);
          ctx.lineTo(x + i + height, y + offsetY + height);
          ctx.stroke();
        }
        break;
      case "dots":
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        for (let dx = 8; dx < width - 5; dx += 15) {
          for (let dy = 8; dy < height - 5; dy += 12) {
            ctx.beginPath();
            ctx.arc(x + dx, y + offsetY + dy, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      case "zigzag":
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let dx = 0; dx < width; dx += 15) {
          const yOffset = (dx / 15) % 2 === 0 ? 0 : height * 0.6;
          if (dx === 0) ctx.moveTo(x + dx, y + offsetY + height / 2 + yOffset - height * 0.3);
          else ctx.lineTo(x + dx, y + offsetY + height / 2 + yOffset - height * 0.3);
        }
        ctx.stroke();
        break;
      case "stars":
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        const drawStar = (cx: number, cy: number, r: number) => {
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const px = cx + r * Math.cos(angle);
            const py = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        };
        for (let dx = 12; dx < width - 8; dx += 20) {
          drawStar(x + dx, y + offsetY + height / 2, 5);
        }
        break;
    }

    ctx.restore();

    // Border
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y + offsetY, width, height);
  }, []);

  const dropBlock = useCallback(() => {
    const block = currentBlockRef.current;
    if (block && !block.falling) {
      block.falling = true;
      block.vy = 0;
    }
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || phase !== "playing") return;

    // Clear with sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#E0F6FF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clouds
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    const cloudOffset = (timestamp / 50) % (canvas.width + 200);
    [[100, 80], [300, 40], [500, 100]].forEach(([baseX, baseY]) => {
      const cx = (baseX + cloudOffset) % (canvas.width + 200) - 100;
      ctx.beginPath();
      ctx.arc(cx, baseY, 25, 0, Math.PI * 2);
      ctx.arc(cx + 30, baseY - 10, 30, 0, Math.PI * 2);
      ctx.arc(cx + 60, baseY, 25, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw crane
    const craneX = craneRef.current.x;
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, CRANE_Y);
    ctx.lineTo(craneX + 30, CRANE_Y);
    ctx.stroke();

    // Crane hook
    ctx.fillStyle = "#555";
    ctx.fillRect(craneX + 25, CRANE_Y, 10, 10);
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(craneX + 30, CRANE_Y + 10);
    ctx.lineTo(craneX + 30, CRANE_Y + 25);
    ctx.stroke();

    // Draw ground
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, BASE_Y + towerOffsetRef.current, canvas.width, canvas.height - BASE_Y);
    ctx.fillStyle = "#228B22";
    ctx.fillRect(0, BASE_Y + towerOffsetRef.current - 10, canvas.width, 15);

    // Draw tower wobble
    const wobbleX = Math.sin(timestamp / 200) * wobbleRef.current;
    wobbleRef.current *= 0.98; // Decay wobble

    ctx.save();
    ctx.translate(wobbleX, 0);

    // Draw stacked blocks
    stackRef.current.forEach((block, index) => {
      const drawY = BASE_Y + towerOffsetRef.current - (index + 1) * BLOCK_HEIGHT;
      const tempY = block.y;
      block.y = drawY;
      drawPattern(ctx, block);
      block.y = tempY;
    });

    ctx.restore();

    // Update and draw falling pieces
    fallingPiecesRef.current = fallingPiecesRef.current.filter(piece => {
      piece.vy += 0.5; // Gravity
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rotation += piece.rotationSpeed;

      if (piece.y > canvas.height + 50) return false;

      ctx.save();
      ctx.translate(piece.x + piece.width / 2, piece.y + piece.height / 2);
      ctx.rotate(piece.rotation);
      ctx.translate(-piece.width / 2, -piece.height / 2);
      drawPattern(ctx, { ...piece, y: 0 });
      ctx.restore();

      return true;
    });

    // Update current block
    if (currentBlockRef.current) {
      const block = currentBlockRef.current;

      if (!block.falling) {
        // Swing on crane
        craneRef.current.x += craneRef.current.speed * craneRef.current.direction;
        if (craneRef.current.x > canvas.width - 50 || craneRef.current.x < 50) {
          craneRef.current.direction *= -1;
        }
        block.x = craneRef.current.x - block.width / 2;
        block.y = CRANE_Y + 30;
      } else {
        // Falling
        block.vy += 0.8;
        block.y += block.vy;

        // Check if block reached stack
        const targetY = BASE_Y + towerOffsetRef.current - (stackRef.current.length + 1) * BLOCK_HEIGHT;
        
        if (block.y >= targetY) {
          block.y = targetY;
          
          // Check alignment with previous block
          const prevBlock = stackRef.current[stackRef.current.length - 1];
          
          if (prevBlock) {
            const leftOverhang = block.x - prevBlock.x;
            const rightOverhang = (block.x + block.width) - (prevBlock.x + prevBlock.width);

            if (leftOverhang > 0 || rightOverhang < 0) {
              // Calculate overlap
              const overlapLeft = Math.max(block.x, prevBlock.x);
              const overlapRight = Math.min(block.x + block.width, prevBlock.x + prevBlock.width);
              const overlapWidth = overlapRight - overlapLeft;

              if (overlapWidth <= 0) {
                // Complete miss - game over
                fallingPiecesRef.current.push({
                  id: Date.now(),
                  x: block.x,
                  y: block.y,
                  width: block.width,
                  height: block.height,
                  color: block.color,
                  pattern: block.pattern,
                  vx: craneRef.current.direction * 2,
                  vy: -2,
                  rotation: 0,
                  rotationSpeed: craneRef.current.direction * 0.1,
                });

                if (height > highScore) {
                  setHighScore(height);
                  localStorage.setItem("tower-high-score", String(height));
                }
                setPhase("gameOver");
                return;
              }

              // Cut off the overhang
              if (leftOverhang > 0) {
                // Cut left side
                fallingPiecesRef.current.push({
                  id: Date.now() + 1,
                  x: block.x,
                  y: block.y,
                  width: leftOverhang,
                  height: block.height,
                  color: block.color,
                  pattern: block.pattern,
                  vx: -2,
                  vy: -3,
                  rotation: 0,
                  rotationSpeed: -0.15,
                });
              }

              if (rightOverhang < 0) {
                // Cut right side
                fallingPiecesRef.current.push({
                  id: Date.now() + 2,
                  x: overlapRight,
                  y: block.y,
                  width: -rightOverhang,
                  height: block.height,
                  color: block.color,
                  pattern: block.pattern,
                  vx: 2,
                  vy: -3,
                  rotation: 0,
                  rotationSpeed: 0.15,
                });
              }

              // Add wobble based on how off-center
              const centerDiff = (leftOverhang - (-rightOverhang)) / 2;
              wobbleRef.current = Math.min(Math.abs(centerDiff) / 5, 10);

              // Update block to only the overlapping portion
              block.x = overlapLeft;
              block.width = overlapWidth;
            }
          }

          // Add to stack
          stackRef.current.push({ ...block });
          setHeight(h => h + 1);

          // Speed up crane slightly
          craneRef.current.speed = Math.min(craneRef.current.speed + 0.1, 8);

          // Scroll tower if it gets tall
          if (stackRef.current.length > 10) {
            towerOffsetRef.current += BLOCK_HEIGHT;
          }

          // Create new block
          currentBlockRef.current = createNewBlock();
        }
      }

      // Draw current block
      if (!block.falling) {
        // Draw rope
        ctx.strokeStyle = "#888";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(craneX, CRANE_Y + 15);
        ctx.lineTo(block.x + block.width / 2, block.y);
        ctx.stroke();
      }
      drawPattern(ctx, block);
    }

    // Draw height counter
    ctx.font = "bold 32px 'Comic Sans MS', cursive, sans-serif";
    ctx.fillStyle = "#333";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.strokeText(`🏠 ${height}`, 20, 45);
    ctx.fillText(`🏠 ${height}`, 20, 45);

    // Draw high score
    if (highScore > 0) {
      ctx.font = "bold 20px 'Comic Sans MS', cursive, sans-serif";
      ctx.strokeText(`🏆 Best: ${highScore}`, canvas.width - 140, 40);
      ctx.fillText(`🏆 Best: ${highScore}`, canvas.width - 140, 40);
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [phase, height, highScore, createNewBlock, drawPattern]);

  const startGame = useCallback(() => {
    craneRef.current = { x: 200, direction: 1, speed: 3 };
    stackRef.current = [];
    fallingPiecesRef.current = [];
    towerOffsetRef.current = 0;
    wobbleRef.current = 0;
    setHeight(0);
    
    // Create first block
    currentBlockRef.current = {
      id: Date.now(),
      x: 200,
      width: INITIAL_BLOCK_WIDTH,
      height: BLOCK_HEIGHT,
      color: getRandomColor(),
      pattern: getRandomPattern(),
      y: CRANE_Y + 30,
      vy: 0,
      falling: false,
    };
    
    setPhase("playing");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = Math.min(500, window.innerWidth - 20);
    canvas.height = CANVAS_HEIGHT;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("tower-high-score");
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
    <main className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-100 flex flex-col items-center justify-center p-4">
      <canvas
        ref={canvasRef}
        className="rounded-3xl shadow-2xl border-4 border-white cursor-pointer"
        onClick={phase === "playing" ? dropBlock : undefined}
        onTouchStart={phase === "playing" ? dropBlock : undefined}
      />

      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-200/70">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center border-4 border-sky-300 max-w-sm mx-4">
            <h1 className="text-4xl font-black text-sky-600 mb-2">🏗️ Build a Tower!</h1>
            <p className="text-gray-600 mb-2 text-lg">Stack the blocks to build the tallest tower!</p>
            <p className="text-gray-500 mb-4 text-sm">Tap or press SPACE to drop the swinging block</p>
            <div className="bg-sky-100 rounded-xl p-4 mb-4">
              <p className="text-sky-700 text-sm">
                💡 <strong>Perfect drops</strong> = bigger blocks!<br/>
                💀 <strong>Miss completely</strong> = game over!
              </p>
            </div>
            {highScore > 0 && (
              <p className="text-2xl font-bold text-yellow-500 mb-4">
                🏆 Your Best: {highScore}
              </p>
            )}
            <button
              onClick={startGame}
              className="px-10 py-4 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl text-2xl shadow-lg transform hover:scale-105 transition-all"
            >
              ▶️ Play!
            </button>
          </div>
        </div>
      )}

      {phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-200/70">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center border-4 border-red-300 max-w-sm mx-4">
            <h2 className="text-4xl font-black text-red-500 mb-2">💥 Oh no!</h2>
            <p className="text-3xl font-bold text-gray-700 my-4">
              🏠 {height} blocks tall!
            </p>
            {height >= highScore && height > 0 && (
              <p className="text-xl font-bold text-yellow-500 mb-4 animate-bounce">
                🎉 New Record! 🎉
              </p>
            )}
            <div className="space-y-3">
              <button
                onClick={startGame}
                className="w-full px-6 py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xl shadow-lg"
              >
                🔄 Try Again
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl"
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
