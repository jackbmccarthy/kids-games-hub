"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Position {
  x: number;
  y: number;
}

interface DigSpot {
  x: number;
  y: number;
  dug: boolean;
  hasTreasure: boolean;
  hasClue: boolean;
  clueType?: "hot" | "warm" | "cold" | "arrow" | "distance";
  terrain: "sand" | "grass" | "rock" | "water";
}

interface Level {
  name: string;
  gridSize: number;
  maxDigs: number;
  treasureDepth: number; // How many clues to reveal
}

interface Confetti {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
}

const LEVELS: Level[] = [
  { name: "Skull Island", gridSize: 4, maxDigs: 8, treasureDepth: 1 },
  { name: "Parrot Beach", gridSize: 5, maxDigs: 10, treasureDepth: 2 },
  { name: "Cannon Cove", gridSize: 5, maxDigs: 8, treasureDepth: 2 },
  { name: "Skeleton Bay", gridSize: 6, maxDigs: 10, treasureDepth: 3 },
  { name: "Black Pearl Isle", gridSize: 6, maxDigs: 8, treasureDepth: 3 },
  { name: "Treasure Fortress", gridSize: 7, maxDigs: 10, treasureDepth: 4 },
];

type GamePhase = "menu" | "playing" | "digging" | "found" | "gameover";

const TERRAIN_COLORS = {
  sand: { bg: "#F4D35E", dark: "#E8C84A" },
  grass: { bg: "#7CB518", dark: "#6AA014" },
  rock: { bg: "#8D99AE", dark: "#7A8699" },
  water: { bg: "#4ECDC4", dark: "#3DBDB5" },
};

export default function TreasureHuntPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [levelIndex, setLevelIndex] = useState(0);
  const [grid, setGrid] = useState<DigSpot[][]>([]);
  const [treasurePos, setTreasurePos] = useState<Position>({ x: 0, y: 0 });
  const [digsLeft, setDigsLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [diggingPos, setDiggingPos] = useState<Position | null>(null);
  const [digProgress, setDigProgress] = useState(0);
  const [lastClue, setLastClue] = useState<string>("");
  const [showClue, setShowClue] = useState(false);
  
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const currentLevel = LEVELS[levelIndex];

  // Generate grid with treasure
  const generateLevel = useCallback((level: Level) => {
    const newGrid: DigSpot[][] = [];
    const terrains: DigSpot["terrain"][] = ["sand", "grass", "rock", "water"];
    
    // Create grid
    for (let y = 0; y < level.gridSize; y++) {
      const row: DigSpot[] = [];
      for (let x = 0; x < level.gridSize; x++) {
        // Weighted terrain - more sand near edges, more grass in middle
        const distFromCenter = Math.abs(x - level.gridSize / 2) + Math.abs(y - level.gridSize / 2);
        let terrain: DigSpot["terrain"] = "sand";
        
        if (distFromCenter < level.gridSize / 3) {
          terrain = Math.random() < 0.6 ? "grass" : "sand";
        } else if (Math.random() < 0.1) {
          terrain = "water";
        } else if (Math.random() < 0.15) {
          terrain = "rock";
        }
        
        row.push({
          x,
          y,
          dug: false,
          hasTreasure: false,
          hasClue: false,
          terrain,
        });
      }
      newGrid.push(row);
    }
    
    // Place treasure (not on water or rock)
    let tx: number, ty: number;
    do {
      tx = Math.floor(Math.random() * level.gridSize);
      ty = Math.floor(Math.random() * level.gridSize);
    } while (newGrid[ty][tx].terrain === "water" || newGrid[ty][tx].terrain === "rock");
    
    newGrid[ty][tx].hasTreasure = true;
    setTreasurePos({ x: tx, y: ty });
    setGrid(newGrid);
    setDigsLeft(level.maxDigs);
    setScore(0);
    setLastClue("");
    setShowClue(false);
  }, []);

  // Start level
  const startLevel = useCallback((idx: number) => {
    setLevelIndex(idx);
    generateLevel(LEVELS[idx]);
    setPhase("playing");
  }, [generateLevel]);

  // Get distance to treasure
  const getDistance = useCallback((x: number, y: number): number => {
    return Math.abs(x - treasurePos.x) + Math.abs(y - treasurePos.y);
  }, [treasurePos]);

  // Get direction to treasure
  const getDirection = useCallback((x: number, y: number): string => {
    const dx = treasurePos.x - x;
    const dy = treasurePos.y - y;
    
    if (dx === 0 && dy === 0) return "📍 HERE!";
    
    const directions: string[] = [];
    if (dy < 0) directions.push("⬆️ North");
    if (dy > 0) directions.push("⬇️ South");
    if (dx > 0) directions.push("➡️ East");
    if (dx < 0) directions.push("⬅️ West");
    
    return directions.join(" ");
  }, [treasurePos]);

  // Dig at position
  const digAt = useCallback((x: number, y: number) => {
    if (phase !== "playing" || digsLeft <= 0) return;
    
    const spot = grid[y]?.[x];
    if (!spot || spot.dug || spot.terrain === "water") return;
    
    // Start digging animation
    setDiggingPos({ x, y });
    setDigProgress(0);
    setPhase("digging");
    
    // Animate dig
    const digInterval = setInterval(() => {
      setDigProgress(prev => {
        if (prev >= 100) {
          clearInterval(digInterval);
          
          // Complete the dig
          setGrid(prev => {
            const newGrid = [...prev];
            const newSpot = { ...newGrid[y][x], dug: true, hasClue: true };
            newGrid[y] = [...newGrid[y]];
            newGrid[y][x] = newSpot;
            return newGrid;
          });
          
          setDigsLeft(prev => prev - 1);
          setDiggingPos(null);
          
          // Check if treasure found
          if (spot.hasTreasure) {
            // Calculate score based on remaining digs
            const bonus = digsLeft * 100;
            const treasureScore = 500 + bonus;
            setScore(treasureScore);
            setTotalScore(prev => prev + treasureScore);
            setPhase("found");
            spawnConfetti();
          } else {
            // Show clue
            const dist = getDistance(x, y);
            let clue = "";
            if (dist === 1) {
              clue = "🔥 HOT! Right next to treasure!";
            } else if (dist === 2) {
              clue = "☀️ WARM! Very close! " + getDirection(x, y);
            } else if (dist <= 3) {
              clue = "🌤️ Getting warmer... " + getDirection(x, y);
            } else {
              clue = "❄️ Cold... " + getDirection(x, y);
            }
            setLastClue(clue);
            setShowClue(true);
            
            setTimeout(() => {
              if (digsLeft > 1) {
                setPhase("playing");
              } else {
                setPhase("gameover");
              }
            }, 1500);
          }
          
          return 100;
        }
        return prev + 10;
      });
    }, 50);
  }, [phase, grid, digsLeft, getDistance, getDirection]);

  // Spawn confetti
  const spawnConfetti = useCallback(() => {
    const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#FFE66D", "#FF8C42", "#98D8C8"];
    const newConfetti: Confetti[] = [];
    
    for (let i = 0; i < 50; i++) {
      newConfetti.push({
        id: i,
        x: 300 + (Math.random() - 0.5) * 100,
        y: 250,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
        vx: (Math.random() - 0.5) * 10,
        vy: -10 - Math.random() * 10,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 20,
      });
    }
    
    setConfetti(newConfetti);
    
    // Animate confetti
    const animate = () => {
      setConfetti(prev => {
        const updated = prev.map(c => ({
          ...c,
          x: c.x + c.vx,
          y: c.y + c.vy,
          vy: c.vy + 0.5,
          rotation: c.rotation + c.rotationSpeed,
        })).filter(c => c.y < 600);
        
        if (updated.length > 0) {
          animationRef.current = setTimeout(animate, 30);
        }
        return updated;
      });
    };
    animate();
  }, []);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || grid.length === 0) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const cellSize = Math.min(
      Math.floor((canvas.width - 40) / currentLevel.gridSize),
      Math.floor((canvas.height - 60) / currentLevel.gridSize)
    );
    const offsetX = (canvas.width - cellSize * currentLevel.gridSize) / 2;
    const offsetY = 30;
    
    // Clear with ocean background
    ctx.fillStyle = "#1A535C";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw map border (wooden frame)
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(offsetX - 15, offsetY - 15, cellSize * currentLevel.gridSize + 30, cellSize * currentLevel.gridSize + 30);
    ctx.fillStyle = "#A0522D";
    ctx.fillRect(offsetX - 10, offsetY - 10, cellSize * currentLevel.gridSize + 20, cellSize * currentLevel.gridSize + 20);
    
    // Draw grid
    for (let y = 0; y < currentLevel.gridSize; y++) {
      for (let x = 0; x < currentLevel.gridSize; x++) {
        const spot = grid[y][x];
        const px = offsetX + x * cellSize;
        const py = offsetY + y * cellSize;
        
        // Draw terrain
        const colors = TERRAIN_COLORS[spot.terrain];
        ctx.fillStyle = colors.bg;
        ctx.fillRect(px, py, cellSize, cellSize);
        
        // Draw grid lines
        ctx.strokeStyle = colors.dark;
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, cellSize, cellSize);
        
        // Draw terrain details
        if (spot.terrain === "sand" && !spot.dug) {
          // Sand dots
          ctx.fillStyle = colors.dark;
          for (let i = 0; i < 3; i++) {
            const dotX = px + 10 + (i * 15) + Math.random() * 5;
            const dotY = py + cellSize / 2 + Math.random() * 10 - 5;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (spot.terrain === "grass") {
          // Grass blades
          ctx.strokeStyle = colors.dark;
          ctx.lineWidth = 2;
          for (let i = 0; i < 4; i++) {
            const gx = px + 8 + i * 12;
            ctx.beginPath();
            ctx.moveTo(gx, py + cellSize - 5);
            ctx.lineTo(gx + 3, py + cellSize - 15);
            ctx.stroke();
          }
        } else if (spot.terrain === "rock") {
          // Rock pattern
          ctx.fillStyle = colors.dark;
          ctx.beginPath();
          ctx.moveTo(px + 10, py + cellSize - 10);
          ctx.lineTo(px + cellSize / 2, py + 10);
          ctx.lineTo(px + cellSize - 10, py + cellSize - 10);
          ctx.closePath();
          ctx.fill();
        } else if (spot.terrain === "water") {
          // Water waves
          ctx.strokeStyle = "rgba(255,255,255,0.5)";
          ctx.lineWidth = 2;
          for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.moveTo(px + 5, py + 15 + i * 15);
            ctx.quadraticCurveTo(px + cellSize / 2, py + 10 + i * 15, px + cellSize - 5, py + 15 + i * 15);
            ctx.stroke();
          }
        }
        
        // Draw dug spot
        if (spot.dug) {
          // Hole
          ctx.fillStyle = "#3D2914";
          ctx.beginPath();
          ctx.ellipse(px + cellSize / 2, py + cellSize / 2, cellSize / 3, cellSize / 4, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Dirt pile
          ctx.fillStyle = "#8B4513";
          ctx.beginPath();
          ctx.ellipse(px + cellSize / 2 + 8, py + cellSize / 2 - 5, 8, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Draw treasure if found
        if (spot.dug && spot.hasTreasure) {
          // Treasure chest
          ctx.fillStyle = "#8B4513";
          ctx.fillRect(px + cellSize / 4, py + cellSize / 3, cellSize / 2, cellSize / 3);
          ctx.fillStyle = "#FFD700";
          ctx.fillRect(px + cellSize / 3, py + cellSize / 2.5, cellSize / 3, cellSize / 6);
          // Gold coins spilling out
          ctx.fillStyle = "#FFD700";
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(px + cellSize / 2 + i * 6 - 6, py + cellSize / 2 + 10, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        // Draw digging animation
        if (diggingPos && diggingPos.x === x && diggingPos.y === y) {
          const progress = digProgress / 100;
          ctx.fillStyle = `rgba(139, 69, 19, ${0.3 + progress * 0.5})`;
          ctx.beginPath();
          ctx.ellipse(px + cellSize / 2, py + cellSize / 2, cellSize / 3 * progress, cellSize / 4 * progress, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Shovel animation
          const shovelAngle = Math.sin(progress * Math.PI * 4) * 0.3;
          ctx.save();
          ctx.translate(px + cellSize / 2, py + cellSize / 2);
          ctx.rotate(shovelAngle);
          ctx.fillStyle = "#666";
          ctx.fillRect(-3, -25, 6, 30);
          ctx.fillStyle = "#888";
          ctx.beginPath();
          ctx.moveTo(-8, -25);
          ctx.lineTo(8, -25);
          ctx.lineTo(5, -35);
          ctx.lineTo(-5, -35);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
    }
    
    // Draw X marks for nearby hint
    if (showClue && lastClue.includes("HOT")) {
      // Draw X over treasure spot
      const tx = offsetX + treasurePos.x * cellSize + cellSize / 2;
      const ty = offsetY + treasurePos.y * cellSize + cellSize / 2;
      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(tx - 15, ty - 15);
      ctx.lineTo(tx + 15, ty + 15);
      ctx.moveTo(tx + 15, ty - 15);
      ctx.lineTo(tx - 15, ty + 15);
      ctx.stroke();
    }
    
    // Draw compass in corner
    const compassX = canvas.width - 50;
    const compassY = canvas.height - 50;
    ctx.fillStyle = "#FFF8DC";
    ctx.beginPath();
    ctx.arc(compassX, compassY, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8B4513";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Compass needle
    ctx.fillStyle = "#FF0000";
    ctx.beginPath();
    ctx.moveTo(compassX, compassY - 20);
    ctx.lineTo(compassX + 5, compassY);
    ctx.lineTo(compassX - 5, compassY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.moveTo(compassX, compassY + 20);
    ctx.lineTo(compassX + 5, compassY);
    ctx.lineTo(compassX - 5, compassY);
    ctx.closePath();
    ctx.fill();
    
    // N label
    ctx.fillStyle = "#000";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("N", compassX, compassY - 35);
    
  }, [grid, currentLevel, diggingPos, digProgress, showClue, lastClue, treasurePos]);

  // Next level
  const nextLevel = useCallback(() => {
    if (levelIndex < LEVELS.length - 1) {
      startLevel(levelIndex + 1);
    } else {
      // Game complete - restart
      setTotalScore(0);
      setPhase("menu");
    }
  }, [levelIndex, startLevel]);

  // Retry level
  const retryLevel = useCallback(() => {
    generateLevel(currentLevel);
    setPhase("playing");
  }, [currentLevel, generateLevel]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1A535C] to-[#0D2B33] p-4 flex flex-col items-center">
      {/* Header */}
      <header className="text-center mb-2">
        <h1 className="text-3xl font-black text-white drop-shadow-lg">
          🏴‍☠️ Treasure Hunt 💰
        </h1>
        {phase === "playing" && (
          <div className="flex justify-center gap-4 mt-2 text-lg font-bold">
            <span className="text-[#FFD700]">
              ⛏️ Digs: {digsLeft}
            </span>
            <span className="text-white">
              🗺️ {currentLevel.name}
            </span>
            <span className="text-[#FFE66D]">
              🏆 {totalScore + score}
            </span>
          </div>
        )}
      </header>

      {/* Game Canvas */}
      {(phase === "playing" || phase === "digging") && (
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={500}
            height={450}
            className="rounded-xl cursor-pointer"
            onClick={(e) => {
              if (phase !== "playing") return;
              const canvas = canvasRef.current;
              if (!canvas) return;
              
              const rect = canvas.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              
              const cellSize = Math.min(
                Math.floor((canvas.width - 40) / currentLevel.gridSize),
                Math.floor((canvas.height - 60) / currentLevel.gridSize)
              );
              const offsetX = (canvas.width - cellSize * currentLevel.gridSize) / 2;
              const offsetY = 30;
              
              const gridX = Math.floor((x - offsetX) / cellSize);
              const gridY = Math.floor((y - offsetY) / cellSize);
              
              if (gridX >= 0 && gridX < currentLevel.gridSize && gridY >= 0 && gridY < currentLevel.gridSize) {
                digAt(gridX, gridY);
              }
            }}
          />
          
          {/* Clue popup */}
          {showClue && lastClue && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                          bg-[#8B4513] border-4 border-[#FFD700] rounded-xl p-4 text-center
                          shadow-xl animate-bounce">
              <p className="text-white font-bold text-lg">{lastClue}</p>
            </div>
          )}
        </div>
      )}

      {/* Menu */}
      {phase === "menu" && (
        <div className="bg-[#8B4513] border-4 border-[#FFD700] rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
          <div className="text-6xl mb-4">🏴‍☠️</div>
          <h2 className="text-2xl font-black text-white mb-2">Ahoy, Matey!</h2>
          <p className="text-[#FFE4B5] mb-6">
            Find the hidden treasure before ye run out of digs!
          </p>
          
          <div className="bg-[#A0522D] rounded-xl p-4 mb-6 text-left text-[#FFE4B5] text-sm">
            <p className="font-bold text-white mb-2">📜 How to Play:</p>
            <ul className="space-y-1">
              <li>• Tap spots on the map to dig</li>
              <li>• Follow the clues to find treasure</li>
              <li>• 🔥 Hot = very close!</li>
              <li>• ❄️ Cold = far away</li>
              <li>• ❌ Can&apos;t dig water or rocks</li>
            </ul>
          </div>

          <button
            onClick={() => startLevel(0)}
            className="w-full px-6 py-4 bg-[#FFD700] hover:bg-[#FFC000] text-[#8B4513] 
                       font-black text-xl rounded-xl transition-all transform hover:scale-105
                       shadow-lg"
          >
            ⚓ Start Adventure!
          </button>
          
          {totalScore > 0 && (
            <p className="text-[#FFE4B5] mt-4">Total Score: {totalScore}</p>
          )}
        </div>
      )}

      {/* Found Treasure */}
      {phase === "found" && (
        <div className="bg-[#8B4513] border-4 border-[#FFD700] rounded-3xl p-8 max-w-md w-full shadow-xl text-center relative overflow-hidden">
          {/* Confetti */}
          {confetti.map(c => (
            <div
              key={c.id}
              className="absolute"
              style={{
                left: c.x,
                top: c.y,
                width: c.size,
                height: c.size,
                backgroundColor: c.color,
                transform: `rotate(${c.rotation}deg)`,
              }}
            />
          ))}
          
          <div className="text-6xl mb-4 animate-bounce">💰</div>
          <h2 className="text-3xl font-black text-[#FFD700] mb-2">
            🎉 TREASURE FOUND! 🎉
          </h2>
          <p className="text-white text-xl mb-2">Ye found me booty!</p>
          <div className="text-[#FFE4B5] space-y-1 mb-6">
            <p className="text-2xl font-bold text-[#FFD700]">+{score} points!</p>
            <p>Digs remaining: {digsLeft}</p>
          </div>
          
          <div className="space-y-3">
            {levelIndex < LEVELS.length - 1 ? (
              <button
                onClick={nextLevel}
                className="w-full px-6 py-4 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white 
                           font-bold text-lg rounded-xl transition-all"
              >
                ➡️ Next Level: {LEVELS[levelIndex + 1].name}
              </button>
            ) : (
              <button
                onClick={() => { setTotalScore(0); setPhase("menu"); }}
                className="w-full px-6 py-4 bg-[#FFD700] hover:bg-[#FFC000] text-[#8B4513] 
                           font-bold text-lg rounded-xl transition-all"
              >
                🏆 You Win! Play Again
              </button>
            )}
            <button
              onClick={() => setPhase("menu")}
              className="w-full px-6 py-3 bg-[#A0522D] hover:bg-[#8B4513] text-white 
                         font-bold rounded-xl transition-all"
            >
              🏠 Menu
            </button>
          </div>
        </div>
      )}

      {/* Game Over */}
      {phase === "gameover" && (
        <div className="bg-[#2C1810] border-4 border-gray-600 rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
          <div className="text-6xl mb-4">💀</div>
          <h2 className="text-2xl font-black text-gray-300 mb-2">
            Out of Digs!
          </h2>
          <p className="text-gray-400 mb-2">
            The treasure was hidden at the X!
          </p>
          <p className="text-[#FFD700] mb-6">
            Level: {currentLevel.name}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={retryLevel}
              className="w-full px-6 py-4 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white 
                         font-bold text-lg rounded-xl transition-all"
            >
              🔄 Try Again
            </button>
            <button
              onClick={() => { setTotalScore(0); setPhase("menu"); }}
              className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white 
                         font-bold rounded-xl transition-all"
            >
              🏠 Menu
            </button>
          </div>
        </div>
      )}

      {/* Level Select */}
      <div className="mt-4 flex gap-2">
        {LEVELS.map((level, idx) => (
          <button
            key={level.name}
            onClick={() => {
              if (phase === "menu" || phase === "gameover") {
                startLevel(idx);
              }
            }}
            disabled={phase === "playing" || phase === "digging" || phase === "found"}
            className={`w-10 h-10 rounded-full font-bold text-sm transition-all
                       ${idx === levelIndex 
                         ? "bg-[#FFD700] text-[#8B4513]" 
                         : "bg-[#A0522D] text-white hover:bg-[#8B4513]"}
                       ${(phase === "playing" || phase === "digging" || phase === "found") 
                         ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </main>
  );
}
