"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Fruit {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  type: FruitType;
  radius: number;
  sliced: boolean;
  sliceAngle: number;
}

interface SliceParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: "splash" | "half";
  halfFruit?: {
    type: FruitType;
    isLeft: boolean;
    rotation: number;
    rotationSpeed: number;
  };
}

interface SwipeTrail {
  x: number;
  y: number;
  age: number;
}

interface ComboText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

interface SoundEffect {
  frequency: number;
  duration: number;
  type: "slice" | "bomb" | "combo" | "miss";
}

type FruitType = "watermelon" | "orange" | "apple" | "banana" | "grape" | "bomb";

type GamePhase = "menu" | "playing" | "gameOver";

interface FruitConfig {
  emoji: string;
  color: string;
  juiceColor: string;
  points: number;
  radius: number;
}

const FRUIT_CONFIGS: Record<FruitType, FruitConfig> = {
  watermelon: { emoji: "🍉", color: "#22C55E", juiceColor: "#EF4444", points: 3, radius: 45 },
  orange: { emoji: "🍊", color: "#F97316", juiceColor: "#FDBA74", points: 2, radius: 35 },
  apple: { emoji: "🍎", color: "#EF4444", juiceColor: "#FCA5A5", points: 1, radius: 32 },
  banana: { emoji: "🍌", color: "#FACC15", juiceColor: "#FEF08A", points: 1, radius: 35 },
  grape: { emoji: "🍇", color: "#8B5CF6", juiceColor: "#C4B5FD", points: 2, radius: 30 },
  bomb: { emoji: "💣", color: "#1F2937", juiceColor: "#4B5563", points: 0, radius: 38 },
};

const INITIAL_LIVES = 3;
const GRAVITY = 0.25;
const MIN_SPAWN_INTERVAL = 400;
const MAX_SPAWN_INTERVAL = 1500;
const COMBO_TIMEOUT = 800;

export default function FruitSlicePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [combo, setCombo] = useState(0);
  const [difficulty, setDifficulty] = useState(1);

  const fruitsRef = useRef<Fruit[]>([]);
  const particlesRef = useRef<SliceParticle[]>([]);
  const swipeTrailsRef = useRef<SwipeTrail[]>([]);
  const comboTextsRef = useRef<ComboText[]>([]);
  const isSlicingRef = useRef(false);
  const lastSlicePosRef = useRef({ x: 0, y: 0 });
  const lastSliceTimeRef = useRef(0);
  const comboCountRef = useRef(0);
  const animationRef = useRef<number>(0);
  const spawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const difficultyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sound synthesis
  const playSound = useCallback((effect: SoundEffect) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (effect.type === "slice") {
      oscillator.frequency.setValueAtTime(800 + effect.frequency, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      oscillator.type = "sine";
    } else if (effect.type === "bomb") {
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      oscillator.type = "sawtooth";
    } else if (effect.type === "combo") {
      oscillator.frequency.setValueAtTime(523, ctx.currentTime);
      oscillator.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      oscillator.type = "square";
    } else if (effect.type === "miss") {
      oscillator.frequency.setValueAtTime(300, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      oscillator.type = "triangle";
    }

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + effect.duration / 1000);
  }, []);

  const spawnFruit = useCallback((canvasWidth: number, canvasHeight: number) => {
    const types: FruitType[] = ["watermelon", "orange", "apple", "banana", "grape"];
    const isBomb = Math.random() < 0.1 + difficulty * 0.02;
    const type = isBomb ? "bomb" : types[Math.floor(Math.random() * types.length)];
    const config = FRUIT_CONFIGS[type];

    const x = 80 + Math.random() * (canvasWidth - 160);
    const targetX = canvasWidth / 2 + (Math.random() - 0.5) * canvasWidth * 0.6;
    const angle = Math.atan2(-canvasHeight, targetX - x);
    const speed = 12 + Math.random() * 4 + difficulty * 0.5;

    const fruit: Fruit = {
      id: Date.now() + Math.random(),
      x,
      y: canvasHeight + config.radius,
      vx: Math.cos(angle) * speed * (Math.random() * 0.4 + 0.8),
      vy: -speed - Math.random() * 3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      type,
      radius: config.radius,
      sliced: false,
      sliceAngle: 0,
    };

    fruitsRef.current.push(fruit);
  }, [difficulty]);

  const scheduleNextSpawn = useCallback((canvasWidth: number, canvasHeight: number) => {
    const interval = Math.max(
      MIN_SPAWN_INTERVAL,
      MAX_SPAWN_INTERVAL - difficulty * 100 - Math.random() * 300
    );
    
    spawnTimeoutRef.current = setTimeout(() => {
      if (phase === "playing") {
        const spawnCount = Math.random() < 0.3 + difficulty * 0.05 ? 2 : 1;
        for (let i = 0; i < spawnCount; i++) {
          setTimeout(() => spawnFruit(canvasWidth, canvasHeight), i * 150);
        }
        scheduleNextSpawn(canvasWidth, canvasHeight);
      }
    }, interval);
  }, [phase, difficulty, spawnFruit]);

  const createSliceEffect = useCallback((fruit: Fruit, sliceAngle: number) => {
    const config = FRUIT_CONFIGS[fruit.type];
    
    // Create two halves
    for (let i = 0; i < 2; i++) {
      particlesRef.current.push({
        id: Date.now() + Math.random(),
        x: fruit.x,
        y: fruit.y,
        vx: fruit.vx + (i === 0 ? -3 : 3) + (Math.random() - 0.5) * 2,
        vy: fruit.vy - 2 + Math.random() * 2,
        color: config.color,
        size: fruit.radius,
        life: 60,
        maxLife: 60,
        type: "half",
        halfFruit: {
          type: fruit.type,
          isLeft: i === 0,
          rotation: fruit.rotation,
          rotationSpeed: fruit.rotationSpeed + (i === 0 ? -0.1 : 0.1),
        },
      });
    }

    // Create juice splash particles
    for (let i = 0; i < 15; i++) {
      const angle = sliceAngle + (Math.random() - 0.5) * Math.PI;
      const speed = 3 + Math.random() * 6;
      particlesRef.current.push({
        id: Date.now() + Math.random(),
        x: fruit.x,
        y: fruit.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: config.juiceColor,
        size: 4 + Math.random() * 8,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        type: "splash",
      });
    }
  }, []);

  const checkSlice = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    const sliceAngle = Math.atan2(y2 - y1, x2 - x1);
    let slicedAny = false;
    const now = Date.now();

    fruitsRef.current.forEach(fruit => {
      if (fruit.sliced) return;

      // Check line-circle collision
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const dot = ((fruit.x - x1) * dx + (fruit.y - y1) * dy) / (len * len);
      
      if (dot < 0 || dot > 1) return;

      const closestX = x1 + dot * dx;
      const closestY = y1 + dot * dy;
      const dist = Math.sqrt((fruit.x - closestX) ** 2 + (fruit.y - closestY) ** 2);

      if (dist < fruit.radius) {
        fruit.sliced = true;
        fruit.sliceAngle = sliceAngle;
        slicedAny = true;

        if (fruit.type === "bomb") {
          // Game over on bomb slice
          playSound({ frequency: 0, duration: 300, type: "bomb" });
          // Explosion effect
          for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            particlesRef.current.push({
              id: Date.now() + Math.random(),
              x: fruit.x,
              y: fruit.y,
              vx: Math.cos(angle) * (5 + Math.random() * 5),
              vy: Math.sin(angle) * (5 + Math.random() * 5),
              color: i % 2 === 0 ? "#F97316" : "#FBBF24",
              size: 8 + Math.random() * 8,
              life: 40,
              maxLife: 40,
              type: "splash",
            });
          }
          setPhase("gameOver");
          return;
        }

        createSliceEffect(fruit, sliceAngle);
        playSound({ frequency: fruit.radius * 10, duration: 100, type: "slice" });

        // Combo handling
        if (now - lastSliceTimeRef.current < COMBO_TIMEOUT) {
          comboCountRef.current++;
        } else {
          comboCountRef.current = 1;
        }
        lastSliceTimeRef.current = now;
        setCombo(comboCountRef.current);

        const config = FRUIT_CONFIGS[fruit.type];
        const comboMultiplier = Math.min(comboCountRef.current, 5);
        const points = config.points * comboMultiplier;
        setScore(s => s + points);

        // Combo text
        if (comboCountRef.current > 1) {
          comboTextsRef.current.push({
            id: Date.now(),
            x: fruit.x,
            y: fruit.y - 30,
            text: `${comboCountRef.current}x COMBO! +${points}`,
            color: comboCountRef.current >= 5 ? "#EF4444" : comboCountRef.current >= 3 ? "#F97316" : "#22C55E",
            life: 60,
          });
          if (comboCountRef.current >= 3) {
            playSound({ frequency: 440 * comboCountRef.current, duration: 300, type: "combo" });
          }
        }
      }
    });

    return slicedAny;
  }, [createSliceEffect, playSound]);

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || phase !== "playing") return;

    // Background gradient - dojo theme
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, "#1a1a2e");
    bgGradient.addColorStop(0.5, "#16213e");
    bgGradient.addColorStop(1, "#0f3460");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Wooden board effect at bottom
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.fillStyle = "#A0522D";
    for (let i = 0; i < canvas.width; i += 80) {
      ctx.fillRect(i, canvas.height - 40, 78, 38);
    }

    // Update and draw fruits
    fruitsRef.current = fruitsRef.current.filter(fruit => {
      if (fruit.sliced) return false;

      // Physics
      fruit.vy += GRAVITY;
      fruit.x += fruit.vx;
      fruit.y += fruit.vy;
      fruit.rotation += fruit.rotationSpeed;

      // Check if missed (fell off screen)
      if (fruit.y > canvas.height + fruit.radius * 2) {
        if (fruit.type !== "bomb") {
          setLives(l => {
            const newLives = l - 1;
            if (newLives <= 0) {
              setTimeout(() => setPhase("gameOver"), 100);
            }
            return newLives;
          });
          playSound({ frequency: 150, duration: 200, type: "miss" });
        }
        return false;
      }

      // Draw fruit
      ctx.save();
      ctx.translate(fruit.x, fruit.y);
      ctx.rotate(fruit.rotation);

      const config = FRUIT_CONFIGS[fruit.type];
      
      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.beginPath();
      ctx.ellipse(4, 4, fruit.radius, fruit.radius * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Fruit emoji
      ctx.font = `${fruit.radius * 1.5}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(config.emoji, 0, 0);

      ctx.restore();

      return true;
    });

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.vy += GRAVITY * 0.5;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;

      if (particle.life <= 0) return false;

      const alpha = particle.life / particle.maxLife;

      if (particle.type === "half" && particle.halfFruit) {
        ctx.save();
        ctx.translate(particle.x, particle.y);
        particle.halfFruit.rotation += particle.halfFruit.rotationSpeed;
        ctx.rotate(particle.halfFruit.rotation);
        ctx.globalAlpha = alpha;

        // Draw half fruit
        ctx.beginPath();
        const config = FRUIT_CONFIGS[particle.halfFruit.type];
        if (particle.halfFruit.isLeft) {
          ctx.arc(0, 0, particle.size * 0.8, Math.PI / 2, -Math.PI / 2);
        } else {
          ctx.arc(0, 0, particle.size * 0.8, -Math.PI / 2, Math.PI / 2);
        }
        ctx.closePath();
        ctx.fillStyle = config.juiceColor;
        ctx.fill();
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
      } else {
        // Splash particle
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      return particle.y < canvas.height + 50;
    });

    // Update and draw swipe trail
    swipeTrailsRef.current = swipeTrailsRef.current.filter(trail => {
      trail.age++;
      if (trail.age > 10) return false;

      ctx.strokeStyle = `rgba(255, 255, 255, ${1 - trail.age / 10})`;
      ctx.lineWidth = 8 - trail.age * 0.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, 1, 0, Math.PI * 2);
      ctx.stroke();

      return true;
    });

    // Draw combo texts
    comboTextsRef.current = comboTextsRef.current.filter(text => {
      text.life--;
      text.y -= 2;
      if (text.life <= 0) return false;

      const alpha = text.life / 60;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = text.color;
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.strokeText(text.text, text.x, text.y);
      ctx.fillText(text.text, text.x, text.y);
      ctx.globalAlpha = 1;

      return true;
    });

    // Draw lives as hearts
    for (let i = 0; i < INITIAL_LIVES; i++) {
      ctx.font = "30px serif";
      ctx.fillText(i < lives ? "❤️" : "🖤", 20 + i * 40, 40);
    }

    // Draw score
    ctx.fillStyle = "white";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`Score: ${score}`, canvas.width - 20, 40);

    // Draw combo if active
    if (combo > 1 && Date.now() - lastSliceTimeRef.current < COMBO_TIMEOUT) {
      ctx.textAlign = "center";
      ctx.font = "bold 20px sans-serif";
      ctx.fillStyle = "#FBBF24";
      ctx.fillText(`${combo}x Combo!`, canvas.width / 2, 40);
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [phase, lives, score, combo]);

  const handlePointerDown = useCallback((clientX: number, clientY: number) => {
    if (phase !== "playing") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    isSlicingRef.current = true;
    lastSlicePosRef.current = { x, y };
    swipeTrailsRef.current.push({ x, y, age: 0 });
  }, [phase]);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!isSlicingRef.current || phase !== "playing") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Check for slice
    const dx = x - lastSlicePosRef.current.x;
    const dy = y - lastSlicePosRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 10) {
      checkSlice(lastSlicePosRef.current.x, lastSlicePosRef.current.y, x, y);
      lastSlicePosRef.current = { x, y };
      swipeTrailsRef.current.push({ x, y, age: 0 });
    }
  }, [phase, checkSlice]);

  const handlePointerUp = useCallback(() => {
    isSlicingRef.current = false;
  }, []);

  const startGame = useCallback(() => {
    fruitsRef.current = [];
    particlesRef.current = [];
    swipeTrailsRef.current = [];
    comboTextsRef.current = [];
    comboCountRef.current = 0;
    setScore(0);
    setLives(INITIAL_LIVES);
    setCombo(0);
    setDifficulty(1);
    setPhase("playing");

    const canvas = canvasRef.current;
    if (canvas) {
      scheduleNextSpawn(canvas.width, canvas.height);
    }
  }, [scheduleNextSpawn]);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = Math.min(850, window.innerWidth - 20);
    canvas.height = Math.min(600, window.innerHeight - 200);

    const handleResize = () => {
      canvas.width = Math.min(850, window.innerWidth - 20);
      canvas.height = Math.min(600, window.innerHeight - 200);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("fruit-slice-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Game loop
  useEffect(() => {
    if (phase !== "playing") return;

    animationRef.current = requestAnimationFrame(gameLoop);

    // Difficulty increase
    difficultyIntervalRef.current = setInterval(() => {
      setDifficulty(d => Math.min(d + 0.5, 10));
    }, 10000);

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (spawnTimeoutRef.current) clearTimeout(spawnTimeoutRef.current);
      if (difficultyIntervalRef.current) clearInterval(difficultyIntervalRef.current);
    };
  }, [phase, gameLoop]);

  // Save high score
  useEffect(() => {
    if (phase === "gameOver" && score > highScore) {
      setHighScore(score);
      localStorage.setItem("fruit-slice-high-score", String(score));
    }
  }, [phase, score, highScore]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col items-center pt-4">
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="rounded-2xl shadow-2xl cursor-crosshair touch-none select-none"
        onPointerDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onPointerMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      {/* Instructions */}
      {phase === "playing" && (
        <div className="mt-2 bg-white/10 rounded-xl px-4 py-2 text-center max-w-md">
          <p className="text-sm text-white/80">
            ✋ Swipe to slice fruit! 💣 Avoid bombs! 🍉🍊🍎🍌🍇
          </p>
        </div>
      )}

      {/* Menu */}
      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h1 className="text-5xl font-black text-red-600 mb-2">
              🍉 Fruit Slice 🗡️
            </h1>
            <p className="text-gray-600 mb-4">Swipe to slice the fruit!</p>
            
            <div className="grid grid-cols-5 gap-2 mb-4">
              {["🍉", "🍊", "🍎", "🍌", "🍇"].map((emoji, i) => (
                <span key={i} className="text-3xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
                  {emoji}
                </span>
              ))}
            </div>

            <div className="bg-gray-100 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-bold text-red-600">💣 Don't slice bombs!</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-bold text-blue-600">❤️ You have 3 lives</span>
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-bold text-green-600">🔥 Chain slices for combos!</span>
              </p>
            </div>

            {highScore > 0 && (
              <p className="text-xl font-bold text-yellow-500 mb-4">🏆 Best: {highScore}</p>
            )}
            
            <button
              onClick={startGame}
              className="w-full px-6 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-2xl shadow-lg active:scale-95 transition-transform"
            >
              ▶️ Play!
            </button>
          </div>
        </div>
      )}

      {/* Game Over */}
      {phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-4xl font-black text-red-600 mb-2">
              {lives <= 0 ? "💔 Game Over!" : "💥 BOOM!"}
            </h2>
            <p className="text-4xl font-bold text-gray-700 my-4">Score: {score}</p>
            
            {score >= highScore && score > 0 && (
              <p className="text-xl font-bold text-yellow-500 mb-4">🏆 New Best!</p>
            )}
            
            <div className="space-y-2">
              <button
                onClick={startGame}
                className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
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
