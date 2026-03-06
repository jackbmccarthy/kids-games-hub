"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Coin {
  id: number;
  type: "penny" | "nickel" | "dime" | "quarter";
  value: number;
  x: number;
  y: number;
  selected: boolean;
  scale: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  radius: number;
}

interface Confetti {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  size: number;
}

type GamePhase = "menu" | "playing" | "complete" | "celebrating";

interface Level {
  name: string;
  prices: number[];
  description: string;
}

const LEVELS: Level[] = [
  {
    name: "Pennies (1¢ - 10¢)",
    prices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    description: "Learn to count with pennies!"
  },
  {
    name: "Nickels (5¢ - 25¢)",
    prices: [5, 10, 15, 20, 25],
    description: "Add nickels (5¢ each)"
  },
  {
    name: "Dimes (10¢ - 50¢)",
    prices: [10, 20, 30, 40, 50],
    description: "Add dimes (10¢ each)"
  },
  {
    name: "Quarters (25¢ - $1)",
    prices: [25, 50, 75, 100],
    description: "Add quarters (25¢ each)"
  },
  {
    name: "Mixed Coins",
    prices: [7, 12, 18, 26, 33, 42, 55, 67, 78, 89],
    description: "Use any coins to match!"
  }
];

const COIN_COLORS = {
  penny: "#B87333",
  nickel: "#C0C0C0",
  dime: "#A8A8A8",
  quarter: "#D4D4D4"
};

const COIN_VALUES = {
  penny: 1,
  nickel: 5,
  dime: 10,
  quarter: 25
};

const COIN_NAMES = {
  penny: "Penny",
  nickel: "Nickel",
  dime: "Dime",
  quarter: "Quarter"
};

export default function MoneyMatchPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentPriceIndex, setCurrentPriceIndex] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [selectedTotal, setSelectedTotal] = useState(0);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [showWrong, setShowWrong] = useState(false);
  const [completedPrices, setCompletedPrices] = useState<number[]>([]);
  
  const particlesRef = useRef<Particle[]>([]);
  const confettiRef = useRef<Confetti[]>([]);
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play coin sound
  const playCoinSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio not available
    }
  }, [getAudioContext]);

  // Play success sound
  const playSuccessSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const notes = [523, 659, 784]; // C5, E5, G5
      
      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        oscillator.type = "sine";
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.15 + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
        
        oscillator.start(ctx.currentTime + i * 0.15);
        oscillator.stop(ctx.currentTime + i * 0.15 + 0.3);
      });
    } catch {
      // Audio not available
    }
  }, [getAudioContext]);

  // Play error sound
  const playErrorSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
      oscillator.type = "square";
      
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch {
      // Audio not available
    }
  }, [getAudioContext]);

  // Play celebration sound
  const playCelebrationSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
      
      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        oscillator.type = "sine";
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.12 + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.4);
        
        oscillator.start(ctx.currentTime + i * 0.12);
        oscillator.stop(ctx.currentTime + i * 0.12 + 0.4);
      });
    } catch {
      // Audio not available
    }
  }, [getAudioContext]);

  // Speak text
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Create particles
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 15) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 3 + Math.random() * 5;
      particlesRef.current.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1,
        radius: 4 + Math.random() * 6,
      });
    }
  }, []);

  // Create confetti
  const createConfetti = useCallback(() => {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#FF8C94", "#FFD700"];
    for (let i = 0; i < 80; i++) {
      confettiRef.current.push({
        id: Date.now() + i,
        x: Math.random() * (canvasRef.current?.width || 800),
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        size: 8 + Math.random() * 8,
      });
    }
  }, []);

  // Generate coins for a level
  const generateCoins = useCallback((levelIndex: number, canvasWidth: number, canvasHeight: number): Coin[] => {
    const coinCounts: Record<number, { penny: number; nickel: number; dime: number; quarter: number }> = {
      0: { penny: 15, nickel: 0, dime: 0, quarter: 0 }, // Pennies only
      1: { penny: 5, nickel: 10, dime: 0, quarter: 0 }, // Nickels
      2: { penny: 5, nickel: 5, dime: 10, quarter: 0 }, // Dimes
      3: { penny: 5, nickel: 5, dime: 5, quarter: 8 }, // Quarters
      4: { penny: 10, nickel: 8, dime: 8, quarter: 6 }, // Mixed
    };

    const counts = coinCounts[levelIndex] || coinCounts[4];
    const coins: Coin[] = [];
    let id = 0;

    const addCoins = (type: "penny" | "nickel" | "dime" | "quarter", count: number) => {
      for (let i = 0; i < count; i++) {
        const radius = type === "quarter" ? 35 : type === "dime" ? 25 : type === "nickel" ? 30 : 22;
        let x: number, y: number;
        let attempts = 0;

        // Place coins in a grid-like pattern in the bottom area
        const gridCols = 6;
        const gridRows = 4;
        const cellWidth = (canvasWidth - 100) / gridCols;
        const cellHeight = 150;
        const startY = canvasHeight - 180;

        do {
          const col = Math.floor(Math.random() * gridCols);
          const row = Math.floor(Math.random() * gridRows);
          x = 50 + col * cellWidth + Math.random() * (cellWidth - radius * 2) + radius;
          y = startY + row * 40 + Math.random() * 30;
          attempts++;
        } while (
          attempts < 30 &&
          coins.some(c => {
            const dist = Math.sqrt((c.x - x) ** 2 + (c.y - y) ** 2);
            return dist < 60;
          })
        );

        coins.push({
          id: id++,
          type,
          value: COIN_VALUES[type],
          x,
          y,
          selected: false,
          scale: 1
        });
      }
    };

    addCoins("penny", counts.penny);
    addCoins("nickel", counts.nickel);
    addCoins("dime", counts.dime);
    addCoins("quarter", counts.quarter);

    return coins;
  }, []);

  // Handle coin click
  const handleCoinClick = useCallback((coinId: number) => {
    if (phase !== "playing") return;

    setCoins(prev => {
      const newCoins = prev.map(c => {
        if (c.id !== coinId) return c;
        return { ...c, selected: !c.selected, scale: c.selected ? 1 : 1.2 };
      });
      
      const total = newCoins
        .filter(c => c.selected)
        .reduce((sum, c) => sum + c.value, 0);
      
      setSelectedTotal(total);
      
      // Play sound
      const clickedCoin = prev.find(c => c.id === coinId);
      if (clickedCoin && !clickedCoin.selected) {
        playCoinSound();
        createParticles(clickedCoin.x, clickedCoin.y, COIN_COLORS[clickedCoin.type], 8);
      }
      
      return newCoins;
    });
  }, [phase, playCoinSound, createParticles]);

  // Check answer
  const checkAnswer = useCallback(() => {
    if (selectedTotal === currentPrice) {
      // Correct!
      playSuccessSound();
      speak("Great job!");
      
      setCompletedPrices(prev => [...prev, currentPriceIndex]);
      
      const level = LEVELS[currentLevel];
      if (currentPriceIndex + 1 >= level.prices.length) {
        // Level complete!
        setTimeout(() => {
          setPhase("complete");
          playCelebrationSound();
          createConfetti();
        }, 500);
      } else {
        // Next price
        setTimeout(() => {
          setCurrentPriceIndex(prev => prev + 1);
          const nextPrice = level.prices[currentPriceIndex + 1];
          setCurrentPrice(nextPrice);
          setSelectedTotal(0);
          setCoins(prev => prev.map(c => ({ ...c, selected: false, scale: 1 })));
          speak(`Find ${nextPrice} cents`);
        }, 1000);
      }
    } else if (selectedTotal > currentPrice) {
      // Too much!
      playErrorSound();
      setShowWrong(true);
      setTimeout(() => {
        setShowWrong(false);
        setSelectedTotal(0);
        setCoins(prev => prev.map(c => ({ ...c, selected: false, scale: 1 })));
      }, 800);
    }
    // If under, do nothing - let them keep adding
  }, [selectedTotal, currentPrice, currentLevel, currentPriceIndex, playSuccessSound, playErrorSound, speak, playCelebrationSound, createConfetti]);

  // Start game
  const startGame = useCallback((levelIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setCurrentLevel(levelIndex);
    setCurrentPriceIndex(0);
    const firstPrice = LEVELS[levelIndex].prices[0];
    setCurrentPrice(firstPrice);
    setSelectedTotal(0);
    setCompletedPrices([]);
    setCoins(generateCoins(levelIndex, canvas.width, canvas.height));
    particlesRef.current = [];
    confettiRef.current = [];
    setPhase("playing");
    
    setTimeout(() => {
      speak(`Find ${firstPrice} cents`);
    }, 500);
  }, [generateCoins, speak]);

  // Handle click/touch
  const handleInteraction = useCallback((clientX: number, clientY: number) => {
    if (phase !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Find clicked coin
    for (const coin of coins) {
      const radius = coin.type === "quarter" ? 35 : coin.type === "dime" ? 25 : coin.type === "nickel" ? 30 : 22;
      const dist = Math.sqrt((coin.x - x) ** 2 + (coin.y - y) ** 2);
      if (dist < radius) {
        handleCoinClick(coin.id);
        break;
      }
    }
  }, [phase, coins, handleCoinClick]);

  // Draw coin
  const drawCoin = useCallback((ctx: CanvasRenderingContext2D, coin: Coin) => {
    const radius = coin.type === "quarter" ? 35 : coin.type === "dime" ? 25 : coin.type === "nickel" ? 30 : 22;
    const color = COIN_COLORS[coin.type];
    
    ctx.save();
    ctx.translate(coin.x, coin.y);
    ctx.scale(coin.scale, coin.scale);
    
    // Shadow
    ctx.beginPath();
    ctx.arc(3, 3, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fill();
    
    // Main coin
    const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
    gradient.addColorStop(0, "#FFFFFF");
    gradient.addColorStop(0.3, color);
    gradient.addColorStop(1, color);
    
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Border
    ctx.strokeStyle = coin.selected ? "#FFD700" : "rgba(0, 0, 0, 0.3)";
    ctx.lineWidth = coin.selected ? 4 : 2;
    ctx.stroke();
    
    // Inner circle decoration
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Coin value
    const fontSize = radius * 0.7;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#333";
    ctx.fillText(`${coin.value}¢`, 0, 0);
    
    // Selection glow
    if (coin.selected) {
      ctx.beginPath();
      ctx.arc(0, 0, radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    
    ctx.restore();
  }, []);

  // Main game loop
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#FFF8E7");
    gradient.addColorStop(1, "#FFE4B5");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw price display area
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillRect(0, 0, canvas.width, 140);
    ctx.strokeStyle = "#E0E0E0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 140);
    ctx.lineTo(canvas.width, 140);
    ctx.stroke();

    // Current price
    ctx.font = "bold 48px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = showWrong ? "#FF6B6B" : "#4ECDC4";
    const priceText = currentPrice >= 100 ? `$${(currentPrice / 100).toFixed(2)}` : `${currentPrice}¢`;
    ctx.fillText(`Find: ${priceText}`, canvas.width / 2, 55);

    // Progress bar
    const level = LEVELS[currentLevel];
    const progress = completedPrices.length / level.prices.length;
    
    ctx.fillStyle = "#E8E8E8";
    ctx.fillRect(40, 85, canvas.width - 80, 20);
    
    const progressGradient = ctx.createLinearGradient(40, 0, canvas.width - 80, 0);
    progressGradient.addColorStop(0, "#4ECDC4");
    progressGradient.addColorStop(1, "#45B7D1");
    ctx.fillStyle = progressGradient;
    ctx.fillRect(40, 85, (canvas.width - 80) * progress, 20);

    // Progress text
    ctx.font = "16px Arial, sans-serif";
    ctx.fillStyle = "#666";
    ctx.fillText(`${completedPrices.length + 1} of ${level.prices.length}`, canvas.width / 2, 130);

    // Selected total
    if (selectedTotal > 0) {
      ctx.font = "bold 28px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = selectedTotal === currentPrice ? "#4ECDC4" : selectedTotal > currentPrice ? "#FF6B6B" : "#666";
      const totalText = selectedTotal >= 100 ? `$${(selectedTotal / 100).toFixed(2)}` : `${selectedTotal}¢`;
      ctx.fillText(`Selected: ${totalText}`, canvas.width / 2, 180);
    }

    // Draw coins
    coins.forEach(coin => {
      // Animate scale
      if (coin.selected && coin.scale < 1.2) {
        coin.scale = Math.min(1.2, coin.scale + 0.1);
      } else if (!coin.selected && coin.scale > 1) {
        coin.scale = Math.max(1, coin.scale - 0.1);
      }
      drawCoin(ctx, coin);
    });

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.15;
      particle.life -= 0.025;

      if (particle.life > 0) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * particle.life, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life;
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      }
      return false;
    });

    // Update and draw confetti
    confettiRef.current = confettiRef.current.filter(c => {
      c.x += c.vx;
      c.y += c.vy;
      c.vy += 0.05;
      c.rotation += c.rotationSpeed;

      if (c.y < canvas.height + 50) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
        ctx.restore();
        return true;
      }
      return false;
    });

    // Draw check button if total matches or exceeds
    if (selectedTotal >= currentPrice) {
      const buttonX = canvas.width / 2 - 80;
      const buttonY = canvas.height - 60;
      const buttonWidth = 160;
      const buttonHeight = 50;

      ctx.fillStyle = selectedTotal === currentPrice ? "#4ECDC4" : "#FF6B6B";
      ctx.beginPath();
      ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 15);
      ctx.fill();

      ctx.font = "bold 24px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#FFF";
      ctx.fillText(selectedTotal === currentPrice ? "✓ Check!" : "Try Again", canvas.width / 2, buttonY + 25);
    }

    if (phase === "playing" || phase === "complete") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [phase, coins, currentPrice, currentLevel, selectedTotal, completedPrices, showWrong, drawCoin]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Start/stop game loop
  useEffect(() => {
    if (phase === "playing" || phase === "complete") {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [phase, gameLoop]);

  // Auto-check when total matches
  useEffect(() => {
    if (phase === "playing" && selectedTotal === currentPrice) {
      const timeout = setTimeout(() => {
        checkAnswer();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [selectedTotal, currentPrice, phase, checkAnswer]);

  // Handle check button click
  useEffect(() => {
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (phase !== "playing") return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      const buttonX = canvas.width / 2 - 80;
      const buttonY = canvas.height - 60;
      const buttonWidth = 160;
      const buttonHeight = 50;

      if (x >= buttonX && x <= buttonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
        if (selectedTotal >= currentPrice) {
          if (selectedTotal === currentPrice) {
            checkAnswer();
          } else {
            playErrorSound();
            setShowWrong(true);
            setTimeout(() => {
              setShowWrong(false);
              setSelectedTotal(0);
              setCoins(prev => prev.map(c => ({ ...c, selected: false, scale: 1 })));
            }, 800);
          }
        }
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [phase, selectedTotal, currentPrice, checkAnswer, playErrorSound]);

  // Load voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE4B5] relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        onClick={(e) => handleInteraction(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleInteraction(touch.clientX, touch.clientY);
        }}
      />

      {/* Menu Overlay */}
      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl text-center">
            <h1 className="text-4xl font-black text-[#4ECDC4] mb-2">💰 Money Match 💰</h1>
            <p className="text-gray-600 mb-6">Tap coins to match the price!</p>
            
            <div className="grid grid-cols-1 gap-3 mb-6">
              {LEVELS.map((level, index) => (
                <button
                  key={index}
                  onClick={() => startGame(index)}
                  className="w-full px-4 py-4 bg-gradient-to-r from-[#4ECDC4] to-[#45B7D1] hover:from-[#3DBDB5] hover:to-[#34A6C0] text-white font-bold rounded-xl transition-all hover:scale-105 text-left"
                >
                  <div>
                    <div className="text-lg">{level.name}</div>
                    <div className="text-sm opacity-80">{level.description}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="text-sm text-gray-500 bg-gray-100 rounded-xl p-3 space-y-1">
              <p>🪙 Penny = 1 cent</p>
              <p>🪙 Nickel = 5 cents</p>
              <p>🪙 Dime = 10 cents</p>
              <p>🪙 Quarter = 25 cents</p>
            </div>
          </div>
        </div>
      )}

      {/* Complete Overlay */}
      {phase === "complete" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center pointer-events-auto">
            <h2 className="text-4xl font-black text-[#FFD700] mb-2">🎉 Amazing! 🎉</h2>
            <p className="text-gray-600 mb-4">You completed {LEVELS[currentLevel].name}!</p>
            
            <div className="my-6">
              <div className="text-6xl mb-4">🏆</div>
              <p className="text-xl text-gray-600">You're a money master!</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => startGame(currentLevel)}
                className="w-full px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl transition-all"
              >
                🏠 Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back button during gameplay */}
      {phase === "playing" && (
        <button
          onClick={() => setPhase("menu")}
          className="absolute top-4 left-4 bg-white/90 hover:bg-white px-4 py-2 rounded-xl font-bold text-gray-700 shadow-lg transition-all z-10"
        >
          ← Back
        </button>
      )}
    </main>
  );
}
