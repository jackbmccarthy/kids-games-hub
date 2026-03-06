"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Drop {
  id: number;
  x: number;
  y: number;
  type: "water" | "acid" | "gem";
  speed: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

type GamePhase = "menu" | "playing" | "paused" | "gameOver";

const DROP_COLORS = {
  water: "#4FC3F7",
  acid: "#81C784",
  gem: "#E040FB",
};

export default function CatchTheRainPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [bucketCapacity, setBucketCapacity] = useState(0);
  const [combo, setCombo] = useState(0);

  const bucketRef = useRef({ x: 0, width: 100, y: 0, height: 60 });
  const dropsRef = useRef<Drop[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const dropIdRef = useRef(0);
  const dropSpeedRef = useRef(2);
  const spawnRateRef = useRef(800);

  const handleMouseMove = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    bucketRef.current.x = Math.max(bucketRef.current.width / 2, 
      Math.min(canvas.width - bucketRef.current.width / 2, x));
  }, []);

  const createParticle = useCallback((x: number, y: number, color: string) => {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      particlesRef.current.push({
        id: Date.now() + i,
        x, y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3 - 2,
        color,
        life: 1,
      });
    }
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || phase !== "playing") return;

    // Draw background - stormy sky
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(0.5, "#16213e");
    gradient.addColorStop(1, "#0f3460");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw rain streaks in background
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 50; i++) {
      const x = (i * 37 + timestamp / 20) % canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - 10, 30);
      ctx.stroke();
    }

    // Spawn drops
    if (timestamp - lastSpawnRef.current > spawnRateRef.current) {
      const type: "water" | "acid" | "gem" = 
        Math.random() < 0.7 ? "water" : 
        Math.random() < 0.85 ? "acid" : "gem";
      
      dropsRef.current.push({
        id: dropIdRef.current++,
        x: Math.random() * (canvas.width - 40) + 20,
        y: -20,
        type,
        speed: dropSpeedRef.current + Math.random(),
      });
      lastSpawnRef.current = timestamp;
    }

    // Update and draw drops
    const bucket = bucketRef.current;
    dropsRef.current = dropsRef.current.filter(drop => {
      drop.y += drop.speed;

      // Draw drop
      ctx.beginPath();
      if (drop.type === "gem") {
        // Diamond shape for gems
        ctx.fillStyle = DROP_COLORS[drop.type];
        ctx.moveTo(drop.x, drop.y - 12);
        ctx.lineTo(drop.x + 10, drop.y);
        ctx.lineTo(drop.x, drop.y + 12);
        ctx.lineTo(drop.x - 10, drop.y);
        ctx.closePath();
        ctx.fill();
        // Sparkle
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Teardrop shape
        ctx.fillStyle = DROP_COLORS[drop.type];
        ctx.arc(drop.x, drop.y, drop.type === "acid" ? 8 : 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Check collision with bucket
      if (drop.y > bucket.y - bucket.height / 2 && 
          drop.y < bucket.y + bucket.height / 2 &&
          drop.x > bucket.x - bucket.width / 2 - 10 &&
          drop.x < bucket.x + bucket.width / 2 + 10) {
        
        createParticle(drop.x, bucket.y, DROP_COLORS[drop.type]);
        
        if (drop.type === "water") {
          setScore(s => s + 1 + combo);
          setBucketCapacity(c => Math.min(c + 5, 100));
          setCombo(c => c + 1);
        } else if (drop.type === "gem") {
          setScore(s => s + 10);
          createParticle(drop.x, bucket.y, "#FFD700");
        } else if (drop.type === "acid") {
          setScore(s => Math.max(0, s - 5));
          setBucketCapacity(c => Math.max(0, c - 20));
          setCombo(0);
        }
        return false;
      }

      // Check if dropped past screen
      if (drop.y > canvas.height + 20) {
        setCombo(0);
        return false;
      }

      return true;
    });

    // Draw bucket
    const tilt = (bucket.x - canvas.width / 2) / canvas.width * 15;
    ctx.save();
    ctx.translate(bucket.x, bucket.y);
    ctx.rotate(tilt * Math.PI / 180);

    // Bucket body
    ctx.fillStyle = "#8B4513";
    ctx.beginPath();
    ctx.moveTo(-bucket.width / 2, -bucket.height / 2);
    ctx.lineTo(-bucket.width / 2 + 10, bucket.height / 2);
    ctx.lineTo(bucket.width / 2 - 10, bucket.height / 2);
    ctx.lineTo(bucket.width / 2, -bucket.height / 2);
    ctx.closePath();
    ctx.fill();

    // Bucket rim
    ctx.fillStyle = "#A0522D";
    ctx.fillRect(-bucket.width / 2 - 5, -bucket.height / 2 - 8, bucket.width + 10, 12);

    // Water level in bucket
    if (bucketCapacity > 0) {
      ctx.fillStyle = "rgba(79, 195, 247, 0.7)";
      const waterHeight = (bucketCapacity / 100) * (bucket.height - 10);
      ctx.fillRect(-bucket.width / 2 + 8, bucket.height / 2 - waterHeight - 5, 
        bucket.width - 16, waterHeight);
    }

    ctx.restore();

    // Draw particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= 0.03;
      if (p.life > 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      }
      return false;
    });

    // Draw UI
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.fillText(`Score: ${score}`, canvas.width - 20, 40);

    if (combo > 1) {
      ctx.fillStyle = "#FFD700";
      ctx.fillText(`${combo}x Combo!`, canvas.width - 20, 75);
    }

    // Bucket capacity meter
    ctx.fillStyle = "#333";
    ctx.fillRect(20, 20, 150, 25);
    ctx.fillStyle = bucketCapacity > 80 ? "#f44336" : "#4FC3F7";
    ctx.fillRect(22, 22, (bucketCapacity / 100) * 146, 21);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(20, 20, 150, 25);
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.fillText("Bucket", 25, 38);

    // Increase difficulty over time
    dropSpeedRef.current = 2 + score / 50;
    spawnRateRef.current = Math.max(300, 800 - score * 2);

    // Game over when bucket full
    if (bucketCapacity >= 100) {
      setPhase("gameOver");
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("catch-rain-high-score", String(score));
      }
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [phase, score, combo, bucketCapacity, highScore, createParticle]);

  const startGame = useCallback(() => {
    setScore(0);
    setCombo(0);
    setBucketCapacity(0);
    dropsRef.current = [];
    particlesRef.current = [];
    dropSpeedRef.current = 2;
    spawnRateRef.current = 800;
    bucketRef.current.x = canvasRef.current!.width / 2;
    setPhase("playing");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bucketRef.current.y = canvas.height - 80;
    bucketRef.current.x = canvas.width / 2;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      bucketRef.current.y = canvas.height - 80;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("catch-rain-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [phase, gameLoop]);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      handleMouseMove(x);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
    };
  }, [handleMouseMove]);

  return (
    <main className="min-h-screen bg-[#1a1a2e] relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h1 className="text-4xl font-black text-[#4FC3F7] mb-2">🌧️ Catch the Rain</h1>
            <p className="text-gray-600 mb-4">Move the bucket to catch water drops!</p>
            <p className="text-sm text-gray-500 mb-6">
              💧 Water = +1 pt | 💎 Gem = +10 pts | ☠️ Acid = -5 pts
            </p>
            {highScore > 0 && (
              <p className="text-xl font-bold text-[#FFD700] mb-4">🏆 High Score: {highScore}</p>
            )}
            <button
              onClick={startGame}
              className="w-full px-6 py-4 bg-[#4FC3F7] hover:bg-[#29B6F6] text-white font-bold rounded-xl text-xl transition-all"
            >
              ▶️ Play
            </button>
          </div>
        </div>
      )}

      {phase === "paused" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 text-center">
            <h2 className="text-3xl font-black text-gray-700 mb-6">⏸️ Paused</h2>
            <button onClick={() => setPhase("playing")} 
              className="px-6 py-3 bg-[#4FC3F7] text-white font-bold rounded-xl mr-2">Resume</button>
            <button onClick={startGame} 
              className="px-6 py-3 bg-[#FF6B6B] text-white font-bold rounded-xl">Restart</button>
          </div>
        </div>
      )}

      {phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-3xl font-black text-[#FF6B6B] mb-2">🪣 Bucket Full!</h2>
            <p className="text-2xl font-bold text-gray-700 my-4">Score: {score}</p>
            {score >= highScore && score > 0 && (
              <p className="text-xl font-bold text-[#FFD700] mb-4">🏆 New High Score!</p>
            )}
            <div className="space-y-2">
              <button onClick={startGame} 
                className="w-full px-6 py-3 bg-[#4FC3F7] text-white font-bold rounded-xl">Play Again</button>
              <button onClick={() => setPhase("menu")} 
                className="w-full px-6 py-3 bg-gray-400 text-white font-bold rounded-xl">Menu</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
