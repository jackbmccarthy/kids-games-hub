"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type GamePhase = "menu" | "playing" | "gameOver";

type CloudType = "normal" | "moving" | "disappearing";

interface Cloud {
  id: number;
  x: number;
  y: number;
  width: number;
  type: CloudType;
  direction: number; // for moving clouds
  wobble: number;
  touched: boolean;
  opacity: number;
}

interface Star {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  size: number;
  twinkle: number;
}

interface Character {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isJumping: boolean;
  jumpFrame: number;
  facingRight: boolean;
}

export default function CloudJumpPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [starsCollected, setStarsCollected] = useState(0);

  const characterRef = useRef<Character>({
    x: 200,
    y: 300,
    vx: 0,
    vy: 0,
    width: 40,
    height: 50,
    isJumping: false,
    jumpFrame: 0,
    facingRight: true,
  });
  const cloudsRef = useRef<Cloud[]>([]);
  const starsRef = useRef<Star[]>([]);
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const scrollYRef = useRef(0);
  const maxHeightRef = useRef(0);
  const animationRef = useRef<number>(0);
  const cloudIdRef = useRef(0);
  const starIdRef = useRef(0);

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 600;
  const GRAVITY = 0.4;
  const JUMP_FORCE = -12;
  const MOVE_SPEED = 5;
  const CLOUD_GAP = 80;

  // Initialize clouds
  const initClouds = useCallback(() => {
    const clouds: Cloud[] = [];
    // Starting platform (solid, centered)
    clouds.push({
      id: cloudIdRef.current++,
      x: CANVAS_WIDTH / 2 - 60,
      y: CANVAS_HEIGHT - 100,
      width: 120,
      type: "normal",
      direction: 1,
      wobble: 0,
      touched: false,
      opacity: 1,
    });

    // Generate initial clouds
    for (let i = 1; i < 8; i++) {
      const types: CloudType[] = ["normal", "normal", "normal", "moving", "disappearing"];
      clouds.push({
        id: cloudIdRef.current++,
        x: 30 + Math.random() * (CANVAS_WIDTH - 120),
        y: CANVAS_HEIGHT - 100 - i * CLOUD_GAP,
        width: 70 + Math.random() * 40,
        type: types[Math.floor(Math.random() * types.length)],
        direction: Math.random() > 0.5 ? 1 : -1,
        wobble: Math.random() * Math.PI * 2,
        touched: false,
        opacity: 1,
      });
    }
    cloudsRef.current = clouds;
  }, []);

  const startGame = useCallback(() => {
    characterRef.current = {
      x: CANVAS_WIDTH / 2 - 20,
      y: CANVAS_HEIGHT - 180,
      vx: 0,
      vy: 0,
      width: 40,
      height: 50,
      isJumping: false,
      jumpFrame: 0,
      facingRight: true,
    };
    scrollYRef.current = 0;
    maxHeightRef.current = 0;
    cloudIdRef.current = 0;
    starIdRef.current = 0;
    setScore(0);
    setStarsCollected(0);
    starsRef.current = [];
    initClouds();
    setPhase("playing");
  }, [initClouds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        keysRef.current.left = true;
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        keysRef.current.right = true;
      }
      if (e.code === "Space" && phase === "menu") {
        startGame();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        keysRef.current.left = false;
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        keysRef.current.right = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [phase, startGame]);

  const drawCloud = (ctx: CanvasRenderingContext2D, cloud: Cloud, offsetY: number) => {
    const y = cloud.y + offsetY;
    ctx.save();
    ctx.globalAlpha = cloud.opacity;

    // Cloud color based on type
    let baseColor: string;
    switch (cloud.type) {
      case "moving":
        baseColor = "#87CEEB"; // Light blue
        break;
      case "disappearing":
        baseColor = cloud.touched ? "#FFB6C1" : "#DDA0DD"; // Pink when touched, plum normally
        break;
      default:
        baseColor = "#FFFFFF"; // White
    }

    // Draw fluffy cloud shape
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    
    // Main cloud body (multiple overlapping circles)
    const cx = cloud.x + cloud.width / 2;
    const h = 25;
    
    // Base ellipse
    ctx.ellipse(cx, y + 10, cloud.width / 2, h, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Fluffy bumps on top
    ctx.beginPath();
    ctx.ellipse(cx - cloud.width / 4, y + 5, cloud.width / 5, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, y - 5, cloud.width / 4, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + cloud.width / 4, y + 5, cloud.width / 5, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outline
    ctx.strokeStyle = cloud.type === "disappearing" ? "#BA55D3" : "#B0C4DE";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, y + 10, cloud.width / 2, h, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  };

  const drawStar = (ctx: CanvasRenderingContext2D, star: Star, offsetY: number, time: number) => {
    if (star.collected) return;
    
    const y = star.y + offsetY;
    const twinkle = Math.sin(time / 150 + star.twinkle) * 0.3 + 0.7;
    const size = star.size * twinkle;

    ctx.save();
    ctx.translate(star.x, y);
    ctx.rotate(time / 500);

    // Draw star shape
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Inner bright spot
    ctx.fillStyle = "#FFFACD";
    ctx.beginPath();
    ctx.arc(0, 0, size / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawCharacter = (ctx: CanvasRenderingContext2D, char: Character, time: number) => {
    ctx.save();
    ctx.translate(char.x + char.width / 2, char.y + char.height / 2);
    if (!char.facingRight) ctx.scale(-1, 1);

    // Body (cute round shape)
    ctx.fillStyle = "#FFB347"; // Pastel orange
    ctx.beginPath();
    ctx.ellipse(0, 5, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FF8C00";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.ellipse(-6, -2, 4, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(6, -2, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye highlights
    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.arc(-7, -4, 2, 0, Math.PI * 2);
    ctx.arc(5, -4, 2, 0, Math.PI * 2);
    ctx.fill();

    // Cute smile
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 5, 8, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Blush
    ctx.fillStyle = "rgba(255, 150, 150, 0.5)";
    ctx.beginPath();
    ctx.ellipse(-12, 5, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(12, 5, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ears (bunny-style)
    ctx.fillStyle = "#FFB347";
    ctx.strokeStyle = "#FF8C00";
    ctx.beginPath();
    ctx.ellipse(-8, -25, 6, 14, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(8, -25, 6, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Inner ear
    ctx.fillStyle = "#FFB6C1";
    ctx.beginPath();
    ctx.ellipse(-8, -24, 3, 8, -0.2, 0, Math.PI * 2);
    ctx.ellipse(8, -24, 3, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Legs with jump animation
    const legOffset = char.isJumping ? 5 : Math.sin(time / 150) * 3;
    ctx.fillStyle = "#FFB347";
    ctx.strokeStyle = "#FF8C00";
    
    // Left leg
    ctx.beginPath();
    ctx.ellipse(-8, 25 + (char.isJumping ? legOffset : Math.abs(legOffset)), 7, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Right leg
    ctx.beginPath();
    ctx.ellipse(8, 25 + (char.isJumping ? legOffset : -legOffset), 7, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  const drawBackground = (ctx: CanvasRenderingContext2D, height: number) => {
    // Sky gradient - gets darker/higher as you go up
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    const skyPhase = Math.min(1, height / 5000);
    
    // Transition from day to sunset to night based on height
    if (skyPhase < 0.33) {
      // Day sky
      gradient.addColorStop(0, "#87CEEB");
      gradient.addColorStop(1, "#E0F6FF");
    } else if (skyPhase < 0.66) {
      // Sunset
      gradient.addColorStop(0, "#FF7F50");
      gradient.addColorStop(0.5, "#FFB347");
      gradient.addColorStop(1, "#87CEEB");
    } else {
      // Night sky
      gradient.addColorStop(0, "#1a1a2e");
      gradient.addColorStop(0.5, "#4a4a6a");
      gradient.addColorStop(1, "#6a5acd");
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw distant clouds in background
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    for (let i = 0; i < 5; i++) {
      const x = ((i * 100 + height * 0.02) % (CANVAS_WIDTH + 100)) - 50;
      const y = 50 + i * 100;
      ctx.beginPath();
      ctx.ellipse(x, y, 40, 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || phase !== "playing") return;

    const char = characterRef.current;

    // Handle input
    if (keysRef.current.left) {
      char.vx = -MOVE_SPEED;
      char.facingRight = false;
    } else if (keysRef.current.right) {
      char.vx = MOVE_SPEED;
      char.facingRight = true;
    } else {
      char.vx *= 0.8; // Friction
    }

    // Apply gravity
    char.vy += GRAVITY;
    char.isJumping = char.vy < 0;

    // Update position
    char.x += char.vx;
    char.y += char.vy;

    // Wrap around screen edges
    if (char.x < -char.width) char.x = CANVAS_WIDTH;
    if (char.x > CANVAS_WIDTH) char.x = -char.width;

    // Update scrolling - keep character in middle-upper area
    const targetScrollY = char.y - CANVAS_HEIGHT * 0.4;
    if (targetScrollY < scrollYRef.current) {
      scrollYRef.current = targetScrollY;
    }

    // Track max height
    const currentHeight = Math.floor(-scrollYRef.current / 10);
    if (currentHeight > maxHeightRef.current) {
      maxHeightRef.current = currentHeight;
      setScore(maxHeightRef.current);
    }

    // Draw background
    drawBackground(ctx, maxHeightRef.current);

    // Update and draw clouds
    const offsetY = -scrollYRef.current;
    
    cloudsRef.current.forEach(cloud => {
      // Wobble animation
      cloud.wobble += 0.05;

      // Move moving clouds
      if (cloud.type === "moving") {
        cloud.x += cloud.direction * 1.5;
        if (cloud.x <= 0 || cloud.x + cloud.width >= CANVAS_WIDTH) {
          cloud.direction *= -1;
        }
      }

      // Fade disappearing clouds after touch
      if (cloud.type === "disappearing" && cloud.touched) {
        cloud.opacity -= 0.02;
      }

      drawCloud(ctx, cloud, offsetY);
    });

    // Check cloud collisions
    if (char.vy > 0) { // Only check when falling
      const charBottom = char.y + char.height;
      const charLeft = char.x + 5;
      const charRight = char.x + char.width - 5;

      cloudsRef.current.forEach(cloud => {
        const cloudTop = cloud.y + 15;
        const cloudBottom = cloud.y + 35;
        const cloudLeft = cloud.x;
        const cloudRight = cloud.x + cloud.width;

        if (charBottom > cloudTop && charBottom < cloudBottom &&
            charRight > cloudLeft && charLeft < cloudRight &&
            cloud.opacity > 0.5) {
          // Land on cloud
          char.vy = JUMP_FORCE;
          char.y = cloudTop - char.height;
          cloud.touched = true;
        }
      });
    }

    // Update and draw stars
    starsRef.current.forEach(star => {
      drawStar(ctx, star, offsetY, timestamp);
    });

    // Check star collection
    const charCenterX = char.x + char.width / 2;
    const charCenterY = char.y + char.height / 2;
    
    starsRef.current.forEach(star => {
      if (!star.collected) {
        const dist = Math.hypot(star.x - charCenterX, star.y + offsetY - charCenterY);
        if (dist < 30) {
          star.collected = true;
          setStarsCollected(s => s + 1);
          maxHeightRef.current += 10; // Bonus height!
        }
      }
    });

    // Draw character
    drawCharacter(ctx, char, timestamp);

    // Generate new clouds as we go up
    const topCloud = cloudsRef.current.reduce((min, c) => c.y < min ? c.y : min, Infinity);
    while (topCloud > scrollYRef.current - CANVAS_HEIGHT) {
      const lastCloud = cloudsRef.current.reduce((min, c) => c.y < min.y ? c : min, cloudsRef.current[0]);
      const types: CloudType[] = ["normal", "normal", "moving", "disappearing"];
      
      cloudsRef.current.push({
        id: cloudIdRef.current++,
        x: 30 + Math.random() * (CANVAS_WIDTH - 120),
        y: lastCloud.y - CLOUD_GAP - Math.random() * 30,
        width: 60 + Math.random() * 50,
        type: types[Math.floor(Math.random() * types.length)],
        direction: Math.random() > 0.5 ? 1 : -1,
        wobble: Math.random() * Math.PI * 2,
        touched: false,
        opacity: 1,
      });

      // Maybe add a star
      if (Math.random() > 0.7) {
        starsRef.current.push({
          id: starIdRef.current++,
          x: 30 + Math.random() * (CANVAS_WIDTH - 60),
          y: lastCloud.y - CLOUD_GAP / 2 - Math.random() * 20,
          collected: false,
          size: 12 + Math.random() * 8,
          twinkle: Math.random() * Math.PI * 2,
        });
      }
      break;
    }

    // Remove clouds and stars that are off screen
    cloudsRef.current = cloudsRef.current.filter(c => c.y < scrollYRef.current + CANVAS_HEIGHT + 100 && c.opacity > 0);
    starsRef.current = starsRef.current.filter(s => s.y < scrollYRef.current + CANVAS_HEIGHT + 100);

    // Draw UI
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillRect(10, 10, 120, 70);
    ctx.strokeStyle = "#87CEEB";
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 120, 70);

    ctx.font = "bold 18px sans-serif";
    ctx.fillStyle = "#333";
    ctx.fillText(`⭐ ${maxHeightRef.current}m`, 20, 35);
    ctx.fillText(`✨ ${starsCollected}`, 20, 60);

    // Check game over (fell off screen)
    if (char.y > scrollYRef.current + CANVAS_HEIGHT + 50) {
      const finalScore = maxHeightRef.current + starsCollected * 10;
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem("cloud-jump-high-score", String(finalScore));
      }
      setPhase("gameOver");
      return;
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [phase, starsCollected, highScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("cloud-jump-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [phase, gameLoop]);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = touch.clientX - rect.left;
    if (x < CANVAS_WIDTH / 2) {
      keysRef.current.left = true;
    } else {
      keysRef.current.right = true;
    }
  };

  const handleTouchEnd = () => {
    keysRef.current.left = false;
    keysRef.current.right = false;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-100 flex flex-col items-center justify-center">
      <canvas
        ref={canvasRef}
        className="border-4 border-white rounded-2xl shadow-2xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />

      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-400/30">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center border-4 border-sky-300 max-w-sm">
            <div className="text-6xl mb-2">☁️</div>
            <h1 className="text-4xl font-black text-sky-600 mb-2">Cloud Jump!</h1>
            <p className="text-gray-600 mb-4">Jump from cloud to cloud!</p>
            <div className="text-left bg-sky-50 rounded-xl p-4 mb-4 text-sm">
              <p className="mb-1">⬅️ ➡️ <span className="text-gray-600">Move left/right</span></p>
              <p className="mb-1">☁️ <span className="text-white">White</span> = Normal cloud</p>
              <p className="mb-1">🔵 <span className="text-sky-300">Blue</span> = Moving cloud</p>
              <p className="mb-1">💜 <span className="text-purple-300">Purple</span> = Disappears!</p>
              <p>⭐ Collect stars for bonus!</p>
            </div>
            {highScore > 0 && (
              <p className="text-xl font-bold text-yellow-500 mb-4">🏆 Best: {highScore}m</p>
            )}
            <button
              onClick={startGame}
              className="px-8 py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xl shadow-lg transform hover:scale-105 transition-all"
            >
              🚀 Play!
            </button>
          </div>
        </div>
      )}

      {phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-400/30">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center border-4 border-pink-300 max-w-sm">
            <div className="text-5xl mb-2">😢</div>
            <h2 className="text-3xl font-black text-pink-500 mb-2">Oops!</h2>
            <div className="text-2xl font-bold text-gray-700 my-4">
              <p>Height: {score}m</p>
              <p className="text-yellow-500">⭐ Stars: {starsCollected}</p>
              <p className="text-sky-500 mt-2">
                Total: {score + starsCollected * 10}m
              </p>
            </div>
            {score + starsCollected * 10 >= highScore && score > 0 && (
              <p className="text-xl font-bold text-yellow-500 mb-4 animate-bounce">
                🎉 New Record! 🎉
              </p>
            )}
            <div className="space-y-2">
              <button
                onClick={startGame}
                className="w-full px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg"
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
