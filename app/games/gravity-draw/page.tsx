"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Point {
  x: number;
  y: number;
}

interface Platform {
  id: number;
  points: Point[];
  type: "normal" | "bouncy" | "sticky";
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

type GamePhase = "menu" | "preview" | "drawing" | "running" | "levelComplete" | "gameOver";
type Tool = "draw" | "bouncy" | "sticky" | "eraser";

interface Level {
  id: number;
  name: string;
  ballStart: Point;
  goal: Point;
  obstacles: { x: number; y: number; w: number; h: number }[];
  inkLimit: number;
}

const LEVELS: Level[] = [
  {
    id: 1,
    name: "Easy Start",
    ballStart: { x: 100, y: 100 },
    goal: { x: 500, y: 400 },
    obstacles: [],
    inkLimit: 400,
  },
  {
    id: 2,
    name: "Gap Jump",
    ballStart: { x: 100, y: 150 },
    goal: { x: 500, y: 350 },
    obstacles: [{ x: 200, y: 300, w: 200, h: 200 }],
    inkLimit: 350,
  },
  {
    id: 3,
    name: "The Wall",
    ballStart: { x: 100, y: 100 },
    goal: { x: 500, y: 400 },
    obstacles: [{ x: 300, y: 100, w: 20, h: 300 }],
    inkLimit: 500,
  },
];

const GRAVITY = 0.5;
const FRICTION = 0.99;
const BOUNCE = 0.7;

export default function GravityDrawPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [currentTool, setCurrentTool] = useState<Tool>("draw");
  const [inkUsed, setInkUsed] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [ball, setBall] = useState<Ball | null>(null);
  const [trail, setTrail] = useState<Point[]>([]);
  const [levelComplete, setLevelComplete] = useState(false);

  const ballRef = useRef<Ball | null>(null);
  const platformsRef = useRef<Platform[]>([]);
  const animationRef = useRef<number>(0);
  const platformIdRef = useRef(0);

  // Calculate platform length
  const calculateLength = (points: Point[]): number => {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  };

  // Start level
  const startLevel = useCallback((levelIndex: number) => {
    const level = LEVELS[levelIndex];
    setPlatforms([]);
    platformsRef.current = [];
    setInkUsed(0);
    setTrail([]);
    setLevelComplete(false);
    setBall({
      x: level.ballStart.x,
      y: level.ballStart.y,
      vx: 0,
      vy: 0,
      radius: 15,
    });
    ballRef.current = null;
    setCurrentLevel(levelIndex);
    setPhase("preview");
  }, []);

  // Handle drawing
  const handleDrawStart = useCallback((clientX: number, clientY: number) => {
    if (phase !== "drawing") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setIsDrawing(true);
    setCurrentPoints([{ x, y }]);
  }, [phase]);

  const handleDrawMove = useCallback((clientX: number, clientY: number) => {
    if (!isDrawing || phase !== "drawing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const newPoints = [...currentPoints, { x, y }];
    const newLength = calculateLength(newPoints);
    const level = LEVELS[currentLevel];

    if (newLength + inkUsed <= level.inkLimit) {
      setCurrentPoints(newPoints);
    }
  }, [isDrawing, phase, currentPoints, inkUsed, currentLevel]);

  const handleDrawEnd = useCallback(() => {
    if (!isDrawing || currentPoints.length < 2) {
      setIsDrawing(false);
      setCurrentPoints([]);
      return;
    }

    const length = calculateLength(currentPoints);
    const platformType = currentTool === "eraser" ? "normal" : 
                         currentTool === "bouncy" ? "bouncy" : 
                         currentTool === "sticky" ? "sticky" : "normal";

    if (currentTool !== "eraser") {
      const newPlatform: Platform = {
        id: platformIdRef.current++,
        points: currentPoints,
        type: platformType,
      };
      setPlatforms(prev => [...prev, newPlatform]);
      platformsRef.current = [...platformsRef.current, newPlatform];
      setInkUsed(prev => prev + length);
    }

    setIsDrawing(false);
    setCurrentPoints([]);
  }, [isDrawing, currentPoints, currentTool]);

  // Run simulation
  const runSimulation = useCallback(() => {
    const level = LEVELS[currentLevel];
    const canvas = canvasRef.current;
    if (!canvas) return;

    setPhase("running");
    
    // Initialize ball
    const initialBall: Ball = {
      x: level.ballStart.x,
      y: level.ballStart.y,
      vx: 0,
      vy: 0,
      radius: 15,
    };
    ballRef.current = initialBall;
    setBall(initialBall);
    setTrail([]);
  }, [currentLevel]);

  // Physics simulation
  const simulate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !ballRef.current) {
      animationRef.current = requestAnimationFrame(simulate);
      return;
    }

    const level = LEVELS[currentLevel];
    const ball = ballRef.current;

    // Apply gravity
    ball.vy += GRAVITY;

    // Apply friction
    ball.vx *= FRICTION;
    ball.vy *= FRICTION;

    // Update position
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Check obstacle collisions
    for (const obs of level.obstacles) {
      if (
        ball.x + ball.radius > obs.x &&
        ball.x - ball.radius < obs.x + obs.w &&
        ball.y + ball.radius > obs.y &&
        ball.y - ball.radius < obs.y + obs.h
      ) {
        // Simple collision response
        const overlapLeft = (ball.x + ball.radius) - obs.x;
        const overlapRight = (obs.x + obs.w) - (ball.x - ball.radius);
        const overlapTop = (ball.y + ball.radius) - obs.y;
        const overlapBottom = (obs.y + obs.h) - (ball.y - ball.radius);

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop) {
          ball.y = obs.y - ball.radius;
          ball.vy = -ball.vy * BOUNCE;
        } else if (minOverlap === overlapBottom) {
          ball.y = obs.y + obs.h + ball.radius;
          ball.vy = -ball.vy * BOUNCE;
        } else if (minOverlap === overlapLeft) {
          ball.x = obs.x - ball.radius;
          ball.vx = -ball.vx * BOUNCE;
        } else {
          ball.x = obs.x + obs.w + ball.radius;
          ball.vx = -ball.vx * BOUNCE;
        }
      }
    }

    // Check platform collisions
    for (const platform of platformsRef.current) {
      for (let i = 1; i < platform.points.length; i++) {
        const p1 = platform.points[i - 1];
        const p2 = platform.points[i];

        // Line segment collision
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        
        if (len === 0) continue;

        const nx = -dy / len;
        const ny = dx / len;

        // Distance from ball to line
        const dist = (ball.x - p1.x) * nx + (ball.y - p1.y) * ny;

        if (Math.abs(dist) < ball.radius) {
          // Check if on segment
          const t = ((ball.x - p1.x) * dx + (ball.y - p1.y) * dy) / (len * len);
          
          if (t >= 0 && t <= 1) {
            // Collision response
            const bounceAmount = platform.type === "bouncy" ? 1.3 : 
                                platform.type === "sticky" ? 0.1 : BOUNCE;

            ball.x += nx * (ball.radius - dist);
            ball.y += ny * (ball.radius - dist);

            const dot = ball.vx * nx + ball.vy * ny;
            ball.vx -= 2 * dot * nx * bounceAmount;
            ball.vy -= 2 * dot * ny * bounceAmount;
          }
        }
      }
    }

    // Wall collisions
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.vx = -ball.vx * BOUNCE;
    }
    if (ball.x + ball.radius > canvas.width) {
      ball.x = canvas.width - ball.radius;
      ball.vx = -ball.vx * BOUNCE;
    }

    // Check goal
    const dx = ball.x - level.goal.x;
    const dy = ball.y - level.goal.y;
    const distToGoal = Math.sqrt(dx * dx + dy * dy);

    if (distToGoal < 30) {
      setLevelComplete(true);
      setPhase("levelComplete");
      return;
    }

    // Check if ball fell off screen
    if (ball.y > canvas.height + 50) {
      setPhase("gameOver");
      return;
    }

    // Update trail
    setTrail(prev => [...prev.slice(-50), { x: ball.x, y: ball.y }]);

    setBall({ ...ball });
    animationRef.current = requestAnimationFrame(simulate);
  }, [currentLevel]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 600;
    canvas.height = 450;

    const render = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const level = LEVELS[currentLevel];

      // Clear
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw obstacles
      ctx.fillStyle = "#2a2a4a";
      for (const obs of level.obstacles) {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      }

      // Draw goal
      ctx.beginPath();
      ctx.arc(level.goal.x, level.goal.y, 30, 0, Math.PI * 2);
      ctx.fillStyle = "#4ECDC4";
      ctx.fill();
      ctx.strokeStyle = "#2C3E50";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw ball start
      ctx.beginPath();
      ctx.arc(level.ballStart.x, level.ballStart.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = "#FF6B6B";
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("START", level.ballStart.x, level.ballStart.y + 4);

      // Draw platforms
      for (const platform of platforms) {
        ctx.beginPath();
        ctx.moveTo(platform.points[0].x, platform.points[0].y);
        for (let i = 1; i < platform.points.length; i++) {
          ctx.lineTo(platform.points[i].x, platform.points[i].y);
        }
        ctx.strokeStyle = platform.type === "bouncy" ? "#4ECDC4" : 
                         platform.type === "sticky" ? "#FF9800" : "#FFF";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      }

      // Draw current drawing
      if (currentPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        for (let i = 1; i < currentPoints.length; i++) {
          ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
        }
        ctx.strokeStyle = currentTool === "bouncy" ? "#4ECDC4" : 
                         currentTool === "sticky" ? "#FF9800" : "#FFF";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      // Draw trail
      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.strokeStyle = "rgba(255, 107, 107, 0.3)";
        ctx.lineWidth = 6;
        ctx.stroke();
      }

      // Draw ball
      if (ball) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(
          ball.x - 5, ball.y - 5, 0,
          ball.x, ball.y, ball.radius
        );
        grad.addColorStop(0, "#FF8A8A");
        grad.addColorStop(1, "#FF6B6B");
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Draw ink meter
      const inkPercent = inkUsed / level.inkLimit;
      ctx.fillStyle = "#333";
      ctx.fillRect(10, 10, 150, 20);
      ctx.fillStyle = inkPercent > 0.8 ? "#FF6B6B" : "#4ECDC4";
      ctx.fillRect(10, 10, 150 * inkPercent, 20);
      ctx.strokeStyle = "#FFF";
      ctx.strokeRect(10, 10, 150, 20);
      ctx.fillStyle = "#FFF";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "left";
      ctx.fillText("Ink", 15, 24);
    };

    const interval = setInterval(render, 16);
    return () => clearInterval(interval);
  }, [platforms, currentPoints, ball, trail, currentLevel, inkUsed, currentTool]);

  // Start simulation
  useEffect(() => {
    if (phase === "running") {
      animationRef.current = requestAnimationFrame(simulate);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [phase, simulate]);

  return (
    <main className="min-h-screen bg-[#1a1a2e] p-4 flex flex-col items-center">
      <header className="text-center mb-4">
        <h1 className="text-3xl font-black text-white mb-2">🎨 Gravity Draw 🎨</h1>
        {phase !== "menu" && (
          <p className="text-gray-400">
            Level {currentLevel + 1}: {LEVELS[currentLevel].name}
          </p>
        )}
      </header>

      {/* Game Area */}
      {phase !== "menu" && (
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="rounded-xl border-4 border-[#2a2a4a] cursor-crosshair"
            onMouseDown={(e) => handleDrawStart(e.clientX, e.clientY)}
            onMouseMove={(e) => handleDrawMove(e.clientX, e.clientY)}
            onMouseUp={handleDrawEnd}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              handleDrawStart(touch.clientX, touch.clientY);
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              handleDrawMove(touch.clientX, touch.clientY);
            }}
            onTouchEnd={handleDrawEnd}
          />
        </div>
      )}

      {/* Tools */}
      {phase === "drawing" && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setCurrentTool("draw")}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              currentTool === "draw" ? "bg-white text-[#1a1a2e]" : "bg-[#2a2a4a] text-white"
            }`}
          >
            ✏️ Draw
          </button>
          <button
            onClick={() => setCurrentTool("bouncy")}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              currentTool === "bouncy" ? "bg-[#4ECDC4] text-white" : "bg-[#2a2a4a] text-white"
            }`}
          >
            🟢 Bouncy
          </button>
          <button
            onClick={() => setCurrentTool("sticky")}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              currentTool === "sticky" ? "bg-[#FF9800] text-white" : "bg-[#2a2a4a] text-white"
            }`}
          >
            🟠 Sticky
          </button>
          <button
            onClick={runSimulation}
            className="px-4 py-2 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
          >
            ▶️ Run!
          </button>
          <button
            onClick={() => startLevel(currentLevel)}
            className="px-4 py-2 bg-[#FF6B6B] hover:bg-[#FF5A5A] text-white font-bold rounded-xl transition-all"
          >
            🔄 Reset
          </button>
        </div>
      )}

      {/* Preview Phase */}
      {phase === "preview" && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setPhase("drawing")}
            className="px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
          >
            ✏️ Start Drawing
          </button>
          <button
            onClick={() => setPhase("menu")}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition-all"
          >
            🏠 Menu
          </button>
        </div>
      )}

      {/* Menu */}
      {phase === "menu" && (
        <div className="bg-[#16213e] rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
          <p className="text-gray-300 mb-6">Draw platforms to guide the ball to the goal!</p>

          <div className="space-y-3 mb-6">
            <p className="font-bold text-white">Select Level:</p>
            {LEVELS.map((level, index) => (
              <button
                key={level.id}
                onClick={() => startLevel(index)}
                className="w-full px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
              >
                Level {index + 1}: {level.name}
              </button>
            ))}
          </div>

          <div className="text-sm text-gray-400">
            <p>✏️ White = Normal platform</p>
            <p>🟢 Green = Bouncy platform</p>
            <p>🟠 Orange = Sticky platform</p>
          </div>
        </div>
      )}

      {/* Level Complete */}
      {phase === "levelComplete" && (
        <div className="bg-[#16213e] rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
          <h2 className="text-3xl font-black text-[#4ECDC4] mb-4">🎉 Level Complete!</h2>
          <p className="text-white mb-4">You used {Math.round(inkUsed)} units of ink!</p>
          
          <div className="space-y-3">
            {currentLevel < LEVELS.length - 1 ? (
              <button
                onClick={() => startLevel(currentLevel + 1)}
                className="w-full px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
              >
                Next Level ▶
              </button>
            ) : null}
            <button
              onClick={() => setPhase("menu")}
              className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl transition-all"
            >
              🏠 Menu
            </button>
          </div>
        </div>
      )}

      {/* Game Over */}
      {phase === "gameOver" && (
        <div className="bg-[#16213e] rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
          <h2 className="text-3xl font-black text-[#FF6B6B] mb-4">💥 Ball Fell!</h2>
          <p className="text-gray-300 mb-6">The ball fell off the screen!</p>
          
          <div className="space-y-3">
            <button
              onClick={() => startLevel(currentLevel)}
              className="w-full px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
            >
              🔄 Try Again
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
