"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
}

interface MazeCell {
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
}

type GamePhase = "menu" | "playing" | "paused" | "complete";

const MAZE_SIZES = {
  easy: { cols: 11, rows: 11 },
  medium: { cols: 15, rows: 15 },
  hard: { cols: 21, rows: 21 },
};

type Difficulty = keyof typeof MAZE_SIZES;

export default function MazeRunnerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [maze, setMaze] = useState<MazeCell[][]>([]);
  const [playerPos, setPlayerPos] = useState<Point>({ x: 0, y: 0 });
  const [trail, setTrail] = useState<Point[]>([]);
  const [timer, setTimer] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [level, setLevel] = useState(1);
  const [coins, setCoins] = useState<Point[]>([]);
  const [collectedCoins, setCollectedCoins] = useState(0);

  const playerRef = useRef<Point>({ x: 0, y: 0 });
  const mazeRef = useRef<MazeCell[][]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate maze using recursive backtracking
  const generateMaze = useCallback((cols: number, rows: number): MazeCell[][] => {
    const newMaze: MazeCell[][] = [];
    
    // Initialize all cells with all walls
    for (let y = 0; y < rows; y++) {
      const row: MazeCell[] = [];
      for (let x = 0; x < cols; x++) {
        row.push({
          walls: { top: true, right: true, bottom: true, left: true },
          visited: false,
        });
      }
      newMaze.push(row);
    }

    // Recursive backtracking
    const stack: Point[] = [];
    const startX = 0;
    const startY = 0;
    
    newMaze[startY][startX].visited = true;
    stack.push({ x: startX, y: startY });

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors: { dir: string; x: number; y: number }[] = [];

      // Check all neighbors
      const directions = [
        { dir: "top", dx: 0, dy: -1 },
        { dir: "right", dx: 1, dy: 0 },
        { dir: "bottom", dx: 0, dy: 1 },
        { dir: "left", dx: -1, dy: 0 },
      ];

      for (const { dir, dx, dy } of directions) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !newMaze[ny][nx].visited) {
          neighbors.push({ dir, x: nx, y: ny });
        }
      }

      if (neighbors.length > 0) {
        // Choose random neighbor
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        // Remove walls between current and next
        if (next.dir === "top") {
          newMaze[current.y][current.x].walls.top = false;
          newMaze[next.y][next.x].walls.bottom = false;
        } else if (next.dir === "right") {
          newMaze[current.y][current.x].walls.right = false;
          newMaze[next.y][next.x].walls.left = false;
        } else if (next.dir === "bottom") {
          newMaze[current.y][current.x].walls.bottom = false;
          newMaze[next.y][next.x].walls.top = false;
        } else if (next.dir === "left") {
          newMaze[current.y][current.x].walls.left = false;
          newMaze[next.y][next.x].walls.right = false;
        }

        newMaze[next.y][next.x].visited = true;
        stack.push({ x: next.x, y: next.y });
      } else {
        stack.pop();
      }
    }

    return newMaze;
  }, []);

  // Generate coins
  const generateCoins = useCallback((cols: number, rows: number, count: number): Point[] => {
    const coinList: Point[] = [];
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * (cols - 2)) + 1;
      const y = Math.floor(Math.random() * (rows - 2)) + 1;
      // Don't place on start or end
      if (!(x === 0 && y === 0) && !(x === cols - 1 && y === rows - 1)) {
        coinList.push({ x, y });
      }
    }
    return coinList;
  }, []);

  // Start game
  const startGame = useCallback((diff: Difficulty) => {
    const size = MAZE_SIZES[diff];
    const newMaze = generateMaze(size.cols, size.rows);
    
    setDifficulty(diff);
    setMaze(newMaze);
    mazeRef.current = newMaze;
    
    setPlayerPos({ x: 0, y: 0 });
    playerRef.current = { x: 0, y: 0 };
    
    setTrail([]);
    setTimer(0);
    setLevel(1);
    setCollectedCoins(0);
    setCoins(generateCoins(size.cols, size.rows, 3));
    setPhase("playing");
  }, [generateMaze, generateCoins]);

  // Move player
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (phase !== "playing") return;

    const current = playerRef.current;
    const cell = mazeRef.current[current.y]?.[current.x];
    if (!cell) return;

    // Check walls
    if (dy === -1 && cell.walls.top) return;
    if (dx === 1 && cell.walls.right) return;
    if (dy === 1 && cell.walls.bottom) return;
    if (dx === -1 && cell.walls.left) return;

    const newX = current.x + dx;
    const newY = current.y + dy;
    const size = MAZE_SIZES[difficulty];

    if (newX >= 0 && newX < size.cols && newY >= 0 && newY < size.rows) {
      // Add to trail
      setTrail(prev => [...prev, { ...current }]);

      // Update position
      playerRef.current = { x: newX, y: newY };
      setPlayerPos({ x: newX, y: newY });

      // Check coin collection
      const coinIndex = coins.findIndex(c => c.x === newX && c.y === newY);
      if (coinIndex !== -1) {
        setCoins(prev => prev.filter((_, i) => i !== coinIndex));
        setCollectedCoins(prev => prev + 1);
      }

      // Check goal
      if (newX === size.cols - 1 && newY === size.rows - 1) {
        setPhase("complete");
        
        const timeKey = `maze-runner-best-${difficulty}`;
        const currentBest = localStorage.getItem(timeKey);
        if (!currentBest || timer < parseInt(currentBest)) {
          localStorage.setItem(timeKey, String(timer));
          setBestTime(timer);
        }
      }
    }
  }, [phase, difficulty, coins, timer]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "p") {
        if (phase === "playing") setPhase("paused");
        else if (phase === "paused") setPhase("playing");
        return;
      }

      if (phase !== "playing") return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          movePlayer(0, -1);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          movePlayer(1, 0);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          movePlayer(0, 1);
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          movePlayer(-1, 0);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, movePlayer]);

  // Timer
  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Render maze
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || maze.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = MAZE_SIZES[difficulty];
    const cellSize = Math.min(
      Math.floor((canvas.width - 20) / size.cols),
      Math.floor((canvas.height - 20) / size.rows)
    );
    const offsetX = (canvas.width - cellSize * size.cols) / 2;
    const offsetY = (canvas.height - cellSize * size.rows) / 2;

    // Clear
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw trail
    ctx.strokeStyle = "rgba(78, 205, 196, 0.3)";
    ctx.lineWidth = 3;
    for (let i = 1; i < trail.length; i++) {
      const prev = trail[i - 1];
      const curr = trail[i];
      ctx.beginPath();
      ctx.moveTo(
        offsetX + prev.x * cellSize + cellSize / 2,
        offsetY + prev.y * cellSize + cellSize / 2
      );
      ctx.lineTo(
        offsetX + curr.x * cellSize + cellSize / 2,
        offsetY + curr.y * cellSize + cellSize / 2
      );
      ctx.stroke();
    }

    // Draw maze walls
    ctx.strokeStyle = "#4ECDC4";
    ctx.lineWidth = 2;

    for (let y = 0; y < size.rows; y++) {
      for (let x = 0; x < size.cols; x++) {
        const cell = maze[y][x];
        const px = offsetX + x * cellSize;
        const py = offsetY + y * cellSize;

        if (cell.walls.top) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + cellSize, py);
          ctx.stroke();
        }
        if (cell.walls.right) {
          ctx.beginPath();
          ctx.moveTo(px + cellSize, py);
          ctx.lineTo(px + cellSize, py + cellSize);
          ctx.stroke();
        }
        if (cell.walls.bottom) {
          ctx.beginPath();
          ctx.moveTo(px, py + cellSize);
          ctx.lineTo(px + cellSize, py + cellSize);
          ctx.stroke();
        }
        if (cell.walls.left) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, py + cellSize);
          ctx.stroke();
        }
      }
    }

    // Draw coins
    ctx.fillStyle = "#FFE66D";
    for (const coin of coins) {
      const cx = offsetX + coin.x * cellSize + cellSize / 2;
      const cy = offsetY + coin.y * cellSize + cellSize / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, cellSize / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw goal
    ctx.fillStyle = "#4ECDC4";
    const goalX = offsetX + (size.cols - 1) * cellSize;
    const goalY = offsetY + (size.rows - 1) * cellSize;
    ctx.fillRect(goalX + 5, goalY + 5, cellSize - 10, cellSize - 10);
    ctx.fillStyle = "white";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GOAL", goalX + cellSize / 2, goalY + cellSize / 2);

    // Draw player
    const playerX = offsetX + playerPos.x * cellSize + cellSize / 2;
    const playerY = offsetY + playerPos.y * cellSize + cellSize / 2;
    
    ctx.beginPath();
    ctx.arc(playerX, playerY, cellSize / 3, 0, Math.PI * 2);
    ctx.fillStyle = "#FF6B6B";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [maze, playerPos, trail, difficulty, coins]);

  // Load best time
  useEffect(() => {
    const timeKey = `maze-runner-best-${difficulty}`;
    const saved = localStorage.getItem(timeKey);
    if (saved) setBestTime(parseInt(saved));
  }, [difficulty]);

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <main className="min-h-screen bg-[#1a1a2e] p-4 flex flex-col items-center">
      <header className="text-center mb-4">
        <h1 className="text-3xl font-black text-white mb-2">🏃 Maze Runner 🏃</h1>
        {phase === "playing" && (
          <div className="flex justify-center gap-6 text-lg font-bold">
            <span className="text-[#4ECDC4]">⏱️ {formatTime(timer)}</span>
            <span className="text-[#FFE66D]">🪙 {collectedCoins}/{collectedCoins + coins.length}</span>
            {bestTime && <span className="text-gray-400">Best: {formatTime(bestTime)}</span>}
          </div>
        )}
      </header>

      {/* Game Canvas */}
      {phase !== "menu" && phase !== "complete" && (
        <canvas
          ref={canvasRef}
          width={600}
          height={450}
          className="rounded-xl border-4 border-[#2a2a4a]"
        />
      )}

      {/* Touch Controls */}
      {phase === "playing" && (
        <div className="mt-4 grid grid-cols-3 gap-2 w-40">
          <div />
          <button
            onClick={() => movePlayer(0, -1)}
            className="p-4 bg-[#4ECDC4] rounded-xl text-white font-bold active:bg-[#3DBDB5]"
          >
            ↑
          </button>
          <div />
          <button
            onClick={() => movePlayer(-1, 0)}
            className="p-4 bg-[#4ECDC4] rounded-xl text-white font-bold active:bg-[#3DBDB5]"
          >
            ←
          </button>
          <button
            onClick={() => setPhase("paused")}
            className="p-4 bg-gray-600 rounded-xl text-white font-bold active:bg-gray-700"
          >
            ⏸
          </button>
          <button
            onClick={() => movePlayer(1, 0)}
            className="p-4 bg-[#4ECDC4] rounded-xl text-white font-bold active:bg-[#3DBDB5]"
          >
            →
          </button>
          <div />
          <button
            onClick={() => movePlayer(0, 1)}
            className="p-4 bg-[#4ECDC4] rounded-xl text-white font-bold active:bg-[#3DBDB5]"
          >
            ↓
          </button>
          <div />
        </div>
      )}

      {/* Menu */}
      {phase === "menu" && (
        <div className="bg-[#16213e] rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
          <p className="text-gray-300 mb-6">Navigate the maze to reach the goal!</p>

          {bestTime && (
            <p className="text-[#FFE66D] font-bold mb-4">🏆 Best Time: {formatTime(bestTime)}</p>
          )}

          <div className="space-y-3 mb-6">
            <p className="font-bold text-white">Select Difficulty:</p>
            <button
              onClick={() => startGame("easy")}
              className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all"
            >
              Easy (11×11) 🌱
            </button>
            <button
              onClick={() => startGame("medium")}
              className="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition-all"
            >
              Medium (15×15) ⭐
            </button>
            <button
              onClick={() => startGame("hard")}
              className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all"
            >
              Hard (21×21) 🔥
            </button>
          </div>

          <div className="text-sm text-gray-400">
            <p>Controls: Arrow keys or WASD</p>
            <p>Collect coins for bonus points!</p>
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      {phase === "paused" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70">
          <div className="bg-[#16213e] rounded-3xl p-8 max-w-md w-full mx-4 shadow-xl text-center">
            <h2 className="text-3xl font-black text-white mb-6">⏸️ Paused</h2>
            <div className="space-y-3">
              <button
                onClick={() => setPhase("playing")}
                className="w-full px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
              >
                ▶️ Resume
              </button>
              <button
                onClick={() => startGame(difficulty)}
                className="w-full px-6 py-3 bg-[#FF6B6B] hover:bg-[#FF5A5A] text-white font-bold rounded-xl transition-all"
              >
                🔄 Restart
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition-all"
              >
                🏠 Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete */}
      {phase === "complete" && (
        <div className="bg-[#16213e] rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
          <h2 className="text-3xl font-black text-[#4ECDC4] mb-4">🎉 Maze Complete!</h2>
          
          <div className="my-6 space-y-2 text-white">
            <p className="text-2xl">Time: {formatTime(timer)}</p>
            <p className="text-lg">Coins: {collectedCoins}</p>
            {timer === bestTime && (
              <p className="text-[#FFE66D] font-bold">🏆 New Best Time!</p>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => startGame(difficulty)}
              className="w-full px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
            >
              🔄 New Maze
            </button>
            <button
              onClick={() => setPhase("menu")}
              className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition-all"
            >
              🏠 Menu
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
