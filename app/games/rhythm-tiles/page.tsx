"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Tile {
  id: number;
  lane: number;
  y: number;
  height: number;
  hit: boolean;
  missed: boolean;
  type: "tap" | "hold";
}

interface HitEffect {
  id: number;
  lane: number;
  type: "perfect" | "good" | "miss";
  y: number;
}

type GamePhase = "menu" | "playing" | "paused" | "gameOver";
type Difficulty = "easy" | "medium" | "hard";

const LANE_COUNT = 4;
const LANE_COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#957DAD"];
const LANE_KEYS = ["d", "f", "j", "k"];

const DIFFICULTY_CONFIG = {
  easy: { speed: 2, spawnRate: 1200, holdChance: 0.1 },
  medium: { speed: 3, spawnRate: 900, holdChance: 0.2 },
  hard: { speed: 4, spawnRate: 700, holdChance: 0.3 },
};

export default function RhythmTilesPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [accuracy, setAccuracy] = useState({ perfect: 0, good: 0, miss: 0 });
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [hitEffects, setHitEffects] = useState<HitEffect[]>([]);
  const [health, setHealth] = useState(100);
  const [songProgress, setSongProgress] = useState(0);
  
  const tilesRef = useRef<Tile[]>([]);
  const effectsRef = useRef<HitEffect[]>([]);
  const animationRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const tileIdRef = useRef(0);
  const holdStateRef = useRef<{ [lane: number]: number | null }>({});
  const audioContextRef = useRef<AudioContext | null>(null);

  // Get audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play hit sound
  const playHitSound = useCallback((type: "perfect" | "good" | "miss") => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      const freq = type === "perfect" ? 880 : type === "good" ? 660 : 220;
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      oscillator.type = type === "miss" ? "sawtooth" : "sine";

      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch {
      // Audio not available
    }
  }, [getAudioContext]);

  // Start game
  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setAccuracy({ perfect: 0, good: 0, miss: 0 });
    setHealth(100);
    setSongProgress(0);
    tilesRef.current = [];
    effectsRef.current = [];
    holdStateRef.current = {};
    lastSpawnRef.current = 0;
    setPhase("playing");
  }, []);

  // Process tile hit
  const processHit = useCallback((lane: number, isHoldStart: boolean = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const targetY = canvas.height - 100;
    const config = DIFFICULTY_CONFIG[difficulty];
    
    // Find the lowest tile in this lane that hasn't been hit
    const tile = tilesRef.current.find(t => 
      t.lane === lane && !t.hit && !t.missed && 
      t.y + t.height >= targetY - 50 && t.y <= targetY + 50
    );

    if (!tile) {
      // No tile to hit
      if (!isHoldStart) return; // Holding with no tile
      return;
    }

    // Calculate timing
    const distance = Math.abs((tile.y + tile.height / 2) - targetY);
    let hitType: "perfect" | "good" | "miss";
    
    if (distance < 20) {
      hitType = "perfect";
      setScore(prev => prev + 100 * (1 + combo * 0.1));
      setCombo(prev => {
        const newCombo = prev + 1;
        setMaxCombo(max => Math.max(max, newCombo));
        return newCombo;
      });
      setAccuracy(prev => ({ ...prev, perfect: prev.perfect + 1 }));
    } else if (distance < 50) {
      hitType = "good";
      setScore(prev => prev + 50 * (1 + combo * 0.05));
      setCombo(prev => prev + 1);
      setAccuracy(prev => ({ ...prev, good: prev.good + 1 }));
    } else {
      hitType = "miss";
      setCombo(0);
      setHealth(prev => Math.max(0, prev - 10));
      setAccuracy(prev => ({ ...prev, miss: prev.miss + 1 }));
    }

    playHitSound(hitType);

    // Mark tile as hit
    if (tile.type === "tap" || hitType === "miss") {
      tile.hit = true;
    }

    // Add hit effect
    effectsRef.current.push({
      id: Date.now(),
      lane,
      type: hitType,
      y: targetY,
    });
  }, [difficulty, combo, playHitSound]);

  // Main game loop
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const config = DIFFICULTY_CONFIG[difficulty];
    const laneWidth = canvas.width / LANE_COUNT;
    const targetY = canvas.height - 100;

    // Clear canvas
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw lanes
    for (let i = 0; i < LANE_COUNT; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#16213e" : "#1a1a2e";
      ctx.fillRect(i * laneWidth, 0, laneWidth, canvas.height);
      
      // Lane divider
      ctx.strokeStyle = "#2a2a4a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(i * laneWidth, 0);
      ctx.lineTo(i * laneWidth, canvas.height);
      ctx.stroke();
    }

    // Draw target zone
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(0, targetY - 30, canvas.width, 60);
    
    for (let i = 0; i < LANE_COUNT; i++) {
      ctx.strokeStyle = LANE_COLORS[i];
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(i * laneWidth, targetY);
      ctx.lineTo((i + 1) * laneWidth, targetY);
      ctx.stroke();
    }

    // Spawn tiles
    if (timestamp - lastSpawnRef.current > config.spawnRate) {
      const lane = Math.floor(Math.random() * LANE_COUNT);
      const isHold = Math.random() < config.holdChance;
      
      tilesRef.current.push({
        id: tileIdRef.current++,
        lane,
        y: -100,
        height: isHold ? 150 : 60,
        hit: false,
        missed: false,
        type: isHold ? "hold" : "tap",
      });
      lastSpawnRef.current = timestamp;
    }

    // Update and draw tiles
    tilesRef.current = tilesRef.current.filter(tile => {
      if (tile.hit) return false;
      
      tile.y += config.speed;

      // Check if missed
      if (tile.y > targetY + 60 && !tile.missed) {
        tile.missed = true;
        setCombo(0);
        setHealth(prev => Math.max(0, prev - 10));
        setAccuracy(prev => ({ ...prev, miss: prev.miss + 1 }));
        
        effectsRef.current.push({
          id: Date.now() + tile.id,
          lane: tile.lane,
          type: "miss",
          y: targetY,
        });
        playHitSound("miss");
      }

      // Remove if off screen
      if (tile.y > canvas.height + 100) return false;

      // Draw tile
      const x = tile.lane * laneWidth + 10;
      const width = laneWidth - 20;
      
      ctx.fillStyle = tile.missed ? "#666" : LANE_COLORS[tile.lane];
      ctx.fillRect(x, tile.y, width, tile.height);
      
      // Tile glow
      if (!tile.missed) {
        ctx.shadowColor = LANE_COLORS[tile.lane];
        ctx.shadowBlur = 10;
        ctx.fillRect(x, tile.y, width, tile.height);
        ctx.shadowBlur = 0;
      }

      return true;
    });

    // Update and draw hit effects
    effectsRef.current = effectsRef.current.filter(effect => {
      effect.y -= 2;
      
      if (effect.y < targetY - 100) return false;

      const x = effect.lane * laneWidth + laneWidth / 2;
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = effect.type === "perfect" ? "#FFD700" : 
                       effect.type === "good" ? "#4ECDC4" : "#FF6B6B";
      ctx.fillText(
        effect.type === "perfect" ? "PERFECT!" : 
        effect.type === "good" ? "GOOD" : "MISS",
        x,
        effect.y
      );

      return true;
    });

    // Draw UI
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "right";
    ctx.fillStyle = "#FFF";
    ctx.fillText(`Score: ${score}`, canvas.width - 20, 40);

    if (combo > 0) {
      ctx.font = "bold 24px Arial";
      ctx.fillStyle = "#FFE66D";
      ctx.fillText(`${combo}x Combo`, canvas.width - 20, 70);
    }

    // Health bar
    ctx.fillStyle = "#333";
    ctx.fillRect(20, 20, 200, 20);
    ctx.fillStyle = health > 50 ? "#4ECDC4" : health > 25 ? "#FFE66D" : "#FF6B6B";
    ctx.fillRect(20, 20, health * 2, 20);
    ctx.strokeStyle = "#FFF";
    ctx.strokeRect(20, 20, 200, 20);

    // Check game over
    if (health <= 0) {
      setPhase("gameOver");
      return;
    }

    // Update progress (simulated song length)
    setSongProgress(prev => Math.min(100, prev + 0.01));

    if (phase === "playing") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [difficulty, score, combo, health, phase, playHitSound]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== "playing") return;
      
      const laneIndex = LANE_KEYS.indexOf(e.key.toLowerCase());
      if (laneIndex !== -1 && !holdStateRef.current[laneIndex]) {
        holdStateRef.current[laneIndex] = Date.now();
        processHit(laneIndex, true);
      }
      
      if (e.key === "Escape" || e.key === "p") {
        setPhase("paused");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const laneIndex = LANE_KEYS.indexOf(e.key.toLowerCase());
      if (laneIndex !== -1) {
        holdStateRef.current[laneIndex] = null;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [phase, processHit]);

  // Handle touch/click
  const handleLanePress = useCallback((lane: number) => {
    if (phase !== "playing") return;
    processHit(lane, true);
  }, [phase, processHit]);

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = Math.min(400, window.innerWidth - 32);
      canvas.height = window.innerHeight - 200;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Game loop control
  useEffect(() => {
    if (phase === "playing") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [phase, gameLoop]);

  // Calculate final grade
  const getGrade = useCallback(() => {
    const total = accuracy.perfect + accuracy.good + accuracy.miss;
    if (total === 0) return "F";
    const percent = (accuracy.perfect * 100 + accuracy.good * 50) / total;
    if (percent >= 95) return "S";
    if (percent >= 85) return "A";
    if (percent >= 70) return "B";
    if (percent >= 55) return "C";
    if (percent >= 40) return "D";
    return "F";
  }, [accuracy]);

  return (
    <main className="min-h-screen bg-[#1a1a2e] p-4 flex flex-col items-center">
      <header className="text-center mb-4">
        <h1 className="text-3xl font-black text-white mb-2">🎵 Rhythm Tiles 🎵</h1>
        {phase === "playing" && (
          <p className="text-gray-400">
            Keys: D F J K | Combo: {combo}x | Max: {maxCombo}x
          </p>
        )}
      </header>

      {/* Game Canvas */}
      {(phase === "playing" || phase === "paused") && (
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="rounded-xl border-4 border-[#2a2a4a]"
          />
          
          {/* Touch buttons for mobile */}
          <div className="absolute bottom-0 left-0 right-0 flex h-24">
            {Array.from({ length: LANE_COUNT }).map((_, i) => (
              <button
                key={i}
                className="flex-1 opacity-30 active:opacity-60 transition-opacity"
                style={{ backgroundColor: LANE_COLORS[i] }}
                onTouchStart={() => handleLanePress(i)}
                onClick={() => handleLanePress(i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Menu */}
      {phase === "menu" && (
        <div className="bg-[#16213e] rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
          <p className="text-gray-300 mb-6">Tap the tiles as they reach the line!</p>

          <div className="space-y-3 mb-6">
            <p className="font-bold text-white">Select Difficulty:</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => startGame("easy")}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all"
              >
                Easy 🌱
              </button>
              <button
                onClick={() => startGame("medium")}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition-all"
              >
                Medium ⭐
              </button>
              <button
                onClick={() => startGame("hard")}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all"
              >
                Hard 🔥
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            <p className="font-bold mb-2">Controls:</p>
            <p>Keyboard: D F J K</p>
            <p>Mobile: Tap the lanes!</p>
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      {phase === "paused" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
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

      {/* Game Over */}
      {phase === "gameOver" && (
        <div className="bg-[#16213e] rounded-3xl p-8 max-w-md w-full shadow-xl text-center">
          <h2 className="text-3xl font-black text-[#FF6B6B] mb-2">Game Over!</h2>
          <p className="text-6xl font-black text-[#FFE66D] mb-4">{getGrade()}</p>
          
          <div className="my-6 space-y-2 text-white">
            <p className="text-2xl">Score: {score}</p>
            <p>Max Combo: {maxCombo}x</p>
            <div className="text-sm">
              <span className="text-[#FFD700]">Perfect: {accuracy.perfect}</span>
              {" | "}
              <span className="text-[#4ECDC4]">Good: {accuracy.good}</span>
              {" | "}
              <span className="text-[#FF6B6B]">Miss: {accuracy.miss}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => startGame(difficulty)}
              className="w-full px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
            >
              🔄 Play Again
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
