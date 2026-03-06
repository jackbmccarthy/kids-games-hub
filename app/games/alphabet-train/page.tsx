"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface TrainCar {
  id: number;
  letter: string | null;
  expectedLetter: string;
  filled: boolean;
  x: number;
}

interface DragLetter {
  letter: string;
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  isDragging: boolean;
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

type GamePhase = "menu" | "playing" | "celebrating" | "complete";
type Difficulty = "easy" | "medium" | "hard";

const TRAIN_COLORS = {
  engine: "#E53935",
  car: "#FF7043",
  wheels: "#424242",
  window: "#81D4FA",
};

const LETTER_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F8B500", "#FF8C94", "#A8E6CF", "#FFD93D", "#6BCB77",
  "#FF8066", "#7868E6", "#B8E994", "#F9ED69", "#F08A5D",
  "#E056FD", "#686DE0", "#30336B", "#F97F51", "#7ED6DF", "#FDCB6E",
];

const DIFFICULTY_CONFIG: Record<Difficulty, { sequenceLength: number; missingCount: number }> = {
  easy: { sequenceLength: 5, missingCount: 2 },
  medium: { sequenceLength: 8, missingCount: 3 },
  hard: { sequenceLength: 10, missingCount: 4 },
};

export default function AlphabetTrainPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [trainCars, setTrainCars] = useState<TrainCar[]>([]);
  const [dragLetters, setDragLetters] = useState<DragLetter[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);
  const [trainX, setTrainX] = useState(-300);
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [completedRounds, setCompletedRounds] = useState(0);
  
  const animationRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const draggingRef = useRef<DragLetter | null>(null);
  const trainXRef = useRef(-300);

  // Initialize audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play letter sound
  const playLetterSound = useCallback((letter: string) => {
    try {
      const ctx = getAudioContext();
      
      // Map letter to frequency
      const charCode = letter.charCodeAt(0) - 65;
      const baseFreq = 300 + (charCode * 25);
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);

      // Also speak the letter
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(letter);
        utterance.rate = 0.9;
        utterance.pitch = 1.2;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Audio not available
    }
  }, [getAudioContext]);

  // Play train sound
  const playTrainSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.2);
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.4);
      oscillator.type = "square";
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
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

  // Generate a new round
  const generateRound = useCallback(() => {
    const config = DIFFICULTY_CONFIG[difficulty];
    
    // Pick a random starting position in the alphabet
    const maxStart = 26 - config.sequenceLength;
    const startLetter = Math.floor(Math.random() * maxStart);
    
    // Create train cars with letters
    const cars: TrainCar[] = [];
    const letters: string[] = [];
    
    for (let i = 0; i < config.sequenceLength; i++) {
      const letter = String.fromCharCode(65 + startLetter + i);
      letters.push(letter);
      cars.push({
        id: i,
        letter: letter,
        expectedLetter: letter,
        filled: true,
        x: 0,
      });
    }
    
    // Choose which letters to remove
    const missingIndices: number[] = [];
    while (missingIndices.length < config.missingCount) {
      const idx = Math.floor(Math.random() * config.sequenceLength);
      // Don't remove from the very first car for easy mode
      if (difficulty === "easy" && idx === 0) continue;
      if (!missingIndices.includes(idx)) {
        missingIndices.push(idx);
      }
    }
    
    // Create draggable letters for missing spots
    const draggs: DragLetter[] = [];
    const canvas = canvasRef.current;
    const canvasWidth = canvas?.width || 800;
    const canvasHeight = canvas?.height || 600;
    
    missingIndices.forEach((idx, i) => {
      const letter = letters[idx];
      cars[idx].letter = null;
      cars[idx].filled = false;
      
      draggs.push({
        letter,
        x: 80 + (i % 4) * 100,
        y: canvasHeight - 120 + Math.floor(i / 4) * 80,
        originalX: 80 + (i % 4) * 100,
        originalY: canvasHeight - 120 + Math.floor(i / 4) * 80,
        isDragging: false,
      });
    });
    
    // Shuffle draggable letters
    for (let i = draggs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [draggs[i], draggs[j]] = [draggs[j], draggs[i]];
    }
    
    // Reset positions after shuffle
    draggs.forEach((d, i) => {
      d.x = 80 + (i % 4) * 100;
      d.y = canvasHeight - 120 + Math.floor(i / 4) * 80;
      d.originalX = d.x;
      d.originalY = d.y;
    });
    
    setTrainCars(cars);
    setDragLetters(draggs);
    setTrainX(-300);
    trainXRef.current = -300;
  }, [difficulty]);

  // Start a new game
  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setCurrentRound(1);
    setCompletedRounds(0);
    setTotalRounds(diff === "easy" ? 3 : diff === "medium" ? 4 : 5);
    setPhase("playing");
  }, []);

  // Handle train arrival
  useEffect(() => {
    if (phase !== "playing" && phase !== "celebrating") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const targetX = 50;
    
    const animate = () => {
      if (trainXRef.current < targetX) {
        trainXRef.current += 5;
        setTrainX(trainXRef.current);
        if (trainXRef.current % 20 < 5) {
          playTrainSound();
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [phase, playTrainSound]);

  // Initialize round when phase changes to playing
  useEffect(() => {
    if (phase === "playing") {
      generateRound();
    }
  }, [phase, currentRound, generateRound]);

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

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // Clear and draw background
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGradient.addColorStop(0, "#87CEEB");
      skyGradient.addColorStop(0.6, "#B0E0E6");
      skyGradient.addColorStop(1, "#90EE90");
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw clouds
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      const drawCloud = (cx: number, cy: number, size: number) => {
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2);
        ctx.arc(cx + size * 0.35, cy - size * 0.1, size * 0.35, 0, Math.PI * 2);
        ctx.arc(cx + size * 0.7, cy, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      };
      
      drawCloud(100, 80, 50);
      drawCloud(canvas.width - 200, 100, 60);
      drawCloud(canvas.width / 2, 60, 40);

      // Draw ground
      ctx.fillStyle = "#7CBA5F";
      ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

      // Draw tracks
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(0, canvas.height - 130, canvas.width, 10);
      ctx.fillRect(0, canvas.height - 155, canvas.width, 6);
      ctx.fillRect(0, canvas.height - 105, canvas.width, 6);

      // Draw track ties
      ctx.fillStyle = "#5D4037";
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.fillRect(x, canvas.height - 160, 15, 60);
      }

      // Draw train if in playing or celebrating phase
      if (phase === "playing" || phase === "celebrating" || phase === "complete") {
        drawTrain(ctx, trainX, canvas.height - 180);
      }

      // Draw confetti
      confetti.forEach(c => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
        ctx.restore();
      });

      // Draw draggable letters (at bottom)
      if (phase === "playing") {
        dragLetters.forEach(drag => {
          if (!drag.isDragging) {
            drawLetterTile(ctx, drag.x, drag.y, drag.letter, 50);
          }
        });
        
        // Draw dragging letter on top
        const dragging = dragLetters.find(d => d.isDragging);
        if (dragging) {
          drawLetterTile(ctx, dragging.x, dragging.y, dragging.letter, 60);
        }
      }

      // Draw round info
      if (phase === "playing") {
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillRect(10, 10, 180, 60);
        ctx.strokeStyle = "#4ECDC4";
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, 180, 60);
        
        ctx.font = "bold 20px Arial, sans-serif";
        ctx.fillStyle = "#333";
        ctx.textAlign = "left";
        ctx.fillText(`Round ${currentRound}/${totalRounds}`, 20, 38);
        
        ctx.font = "16px Arial, sans-serif";
        ctx.fillStyle = "#666";
        ctx.fillText(`${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Mode`, 20, 58);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [phase, trainCars, dragLetters, trainX, confetti, currentRound, totalRounds, difficulty]);

  // Draw train engine and cars
  const drawTrain = (ctx: CanvasRenderingContext2D, startX: number, groundY: number) => {
    const carWidth = 80;
    const carHeight = 60;
    const carGap = 10;
    
    // Draw engine
    const engineX = startX;
    const engineY = groundY - carHeight;
    
    // Engine body
    ctx.fillStyle = TRAIN_COLORS.engine;
    ctx.fillRect(engineX, engineY, 90, carHeight);
    
    // Engine cabin
    ctx.fillRect(engineX + 50, engineY - 30, 40, 30);
    
    // Chimney
    ctx.fillStyle = "#333";
    ctx.fillRect(engineX + 15, engineY - 25, 15, 25);
    
    // Chimney steam
    if (phase === "playing" || phase === "celebrating") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      const steamOffset = Date.now() / 200;
      ctx.beginPath();
      ctx.arc(engineX + 22, engineY - 35 - Math.sin(steamOffset) * 5, 8, 0, Math.PI * 2);
      ctx.arc(engineX + 22 + Math.cos(steamOffset) * 5, engineY - 50, 10, 0, Math.PI * 2);
      ctx.arc(engineX + 22, engineY - 65 - Math.sin(steamOffset + 1) * 3, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Engine window
    ctx.fillStyle = TRAIN_COLORS.window;
    ctx.fillRect(engineX + 58, engineY - 22, 24, 18);
    
    // Engine front
    ctx.fillStyle = "#C62828";
    ctx.beginPath();
    ctx.arc(engineX + 90, engineY + carHeight / 2, carHeight / 2, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    
    // Cowcatcher
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.moveTo(engineX + 100, engineY + carHeight);
    ctx.lineTo(engineX + 115, engineY + carHeight + 15);
    ctx.lineTo(engineX + 100, engineY + carHeight + 15);
    ctx.closePath();
    ctx.fill();
    
    // Engine wheels
    drawWheel(ctx, engineX + 20, engineY + carHeight + 5, 18);
    drawWheel(ctx, engineX + 70, engineY + carHeight + 5, 18);
    
    // Draw train cars
    trainCars.forEach((car, i) => {
      const carX = startX + 100 + i * (carWidth + carGap);
      const carY = groundY - carHeight;
      
      // Car body
      const carColor = LETTER_COLORS[i % LETTER_COLORS.length];
      ctx.fillStyle = carColor;
      ctx.fillRect(carX, carY, carWidth, carHeight);
      
      // Car border
      ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
      ctx.lineWidth = 2;
      ctx.strokeRect(carX, carY, carWidth, carHeight);
      
      // Car roof curve
      ctx.fillStyle = carColor;
      ctx.beginPath();
      ctx.ellipse(carX + carWidth / 2, carY, carWidth / 2 - 5, 12, 0, Math.PI, 0);
      ctx.fill();
      
      // Letter holder (white circle)
      ctx.fillStyle = car.filled ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)";
      ctx.beginPath();
      ctx.arc(carX + carWidth / 2, carY + carHeight / 2 + 5, 28, 0, Math.PI * 2);
      ctx.fill();
      
      if (!car.filled) {
        // Draw dashed circle for empty slot
        ctx.strokeStyle = "#999";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(carX + carWidth / 2, carY + carHeight / 2 + 5, 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Question mark
        ctx.font = "bold 30px Arial";
        ctx.fillStyle = "#999";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", carX + carWidth / 2, carY + carHeight / 2 + 5);
      } else if (car.letter) {
        // Draw letter
        ctx.font = "bold 36px Arial";
        ctx.fillStyle = "#333";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(car.letter, carX + carWidth / 2, carY + carHeight / 2 + 5);
      }
      
      // Car wheels
      drawWheel(ctx, carX + 15, carY + carHeight + 5, 12);
      drawWheel(ctx, carX + carWidth - 15, carY + carHeight + 5, 12);
      
      // Connector
      if (i < trainCars.length - 1) {
        ctx.fillStyle = "#666";
        ctx.fillRect(carX + carWidth, carY + carHeight / 2 - 3, carGap, 6);
      }
    });
  };

  // Draw wheel
  const drawWheel = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    // Outer wheel
    ctx.fillStyle = TRAIN_COLORS.wheels;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner wheel
    ctx.fillStyle = "#666";
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Hub
    ctx.fillStyle = "#888";
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  };

  // Draw letter tile
  const drawLetterTile = (ctx: CanvasRenderingContext2D, x: number, y: number, letter: string, size: number) => {
    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.arc(x + 3, y + 3, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Tile background
    const gradient = ctx.createRadialGradient(x - size * 0.2, y - size * 0.2, 0, x, y, size / 2);
    gradient.addColorStop(0, "#FFFFFF");
    gradient.addColorStop(0.7, "#FFE082");
    gradient.addColorStop(1, "#FFB300");
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = "#FF8F00";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Letter
    ctx.font = `bold ${size * 0.7}px Arial`;
    ctx.fillStyle = "#333";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, x, y);
  };

  // Handle mouse/touch events
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (phase !== "playing") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find clicked letter
    for (const drag of dragLetters) {
      const dist = Math.sqrt((drag.x - x) ** 2 + (drag.y - y) ** 2);
      if (dist < 30) {
        drag.isDragging = true;
        draggingRef.current = drag;
        setDragLetters([...dragLetters]);
        break;
      }
    }
  }, [phase, dragLetters]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    draggingRef.current.x = x;
    draggingRef.current.y = y;
    setDragLetters([...dragLetters]);
  }, [dragLetters]);

  const handlePointerUp = useCallback(() => {
    if (!draggingRef.current) return;
    
    const drag = draggingRef.current;
    drag.isDragging = false;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const carWidth = 80;
    const carGap = 10;
    const carHeight = 60;
    const groundY = canvas.height - 180;
    
    // Check if dropped on a matching empty car
    let placed = false;
    
    trainCars.forEach((car, i) => {
      if (!car.filled && car.expectedLetter === drag.letter) {
        const carX = trainX + 100 + i * (carWidth + carGap);
        const carY = groundY - carHeight / 2;
        const letterY = carY + carHeight / 2 + 5;
        
        const dist = Math.sqrt((carX + carWidth / 2 - drag.x) ** 2 + (letterY - drag.y) ** 2);
        
        if (dist < 50) {
          // Correct placement!
          car.letter = drag.letter;
          car.filled = true;
          placed = true;
          playLetterSound(drag.letter);
          
          // Remove from draggable letters
          setDragLetters(prev => prev.filter(d => d.letter !== drag.letter));
          
          // Check if round complete
          const allFilled = trainCars.every(c => c.filled);
          if (allFilled) {
            setTimeout(() => {
              handleRoundComplete();
            }, 500);
          }
        }
      }
    });
    
    if (!placed) {
      // Return to original position
      drag.x = drag.originalX;
      drag.y = drag.originalY;
    }
    
    draggingRef.current = null;
    setDragLetters([...dragLetters]);
    setTrainCars([...trainCars]);
  }, [dragLetters, trainCars, trainX, playLetterSound]);

  // Handle round completion
  const handleRoundComplete = useCallback(() => {
    setPhase("celebrating");
    playCelebrationSound();
    
    // Create confetti
    const newConfetti: Confetti[] = [];
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"];
    for (let i = 0; i < 50; i++) {
      newConfetti.push({
        id: Date.now() + i,
        x: Math.random() * (canvasRef.current?.width || 800),
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        size: 8 + Math.random() * 8,
      });
    }
    setConfetti(newConfetti);
    
    // Speak the alphabet sequence
    if ('speechSynthesis' in window) {
      const sequence = trainCars.map(c => c.expectedLetter).join(", ");
      const utterance = new SpeechSynthesisUtterance(sequence);
      utterance.rate = 0.7;
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 500);
    }
    
    // Move to next round or complete
    setTimeout(() => {
      setConfetti([]);
      if (currentRound >= totalRounds) {
        setCompletedRounds(totalRounds);
        setPhase("complete");
      } else {
        setCurrentRound(r => r + 1);
        setCompletedRounds(r => r + 1);
        setPhase("playing");
      }
    }, 2500);
  }, [currentRound, totalRounds, trainCars, playCelebrationSound]);

  // Animate confetti
  useEffect(() => {
    if (confetti.length === 0) return;
    
    const animate = () => {
      setConfetti(prev => 
        prev
          .map(c => ({
            ...c,
            x: c.x + c.vx,
            y: c.y + c.vy,
            vy: c.vy + 0.1,
            rotation: c.rotation + c.rotationSpeed,
          }))
          .filter(c => c.y < (canvasRef.current?.height || 600) + 50)
      );
    };
    
    const interval = setInterval(animate, 16);
    return () => clearInterval(interval);
  }, [confetti.length]);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      {/* Menu Overlay */}
      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h1 className="text-4xl font-black text-amber-600 mb-2">🚂 Alphabet Train</h1>
            <p className="text-gray-600 mb-6">Put the letters in ABC order!</p>
            
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-6 text-left">
              <p className="font-bold text-gray-700 mb-2">How to Play:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>🚂 A train arrives with empty cars</li>
                <li>🔤 Drag letters to fill the missing spots</li>
                <li>📖 Letters must be in ABC order (A, B, C...)</li>
                <li>🎉 Complete all rounds to win!</li>
              </ul>
            </div>
            
            <p className="font-bold text-gray-700 mb-3">Choose Difficulty:</p>
            <div className="space-y-3">
              <button
                onClick={() => startGame("easy")}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-bold text-lg rounded-2xl transition-all hover:scale-105 shadow-lg"
              >
                🌱 Easy (5 letters, 2 missing)
              </button>
              <button
                onClick={() => startGame("medium")}
                className="w-full px-6 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-bold text-lg rounded-2xl transition-all hover:scale-105 shadow-lg"
              >
                🌿 Medium (8 letters, 3 missing)
              </button>
              <button
                onClick={() => startGame("hard")}
                className="w-full px-6 py-4 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold text-lg rounded-2xl transition-all hover:scale-105 shadow-lg"
              >
                🌳 Hard (10 letters, 4 missing)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebration overlay */}
      {phase === "celebrating" && (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-white/90 rounded-3xl px-12 py-6 shadow-2xl text-center animate-bounce">
            <p className="text-4xl font-black text-green-500">🎉 Great Job! 🎉</p>
            <p className="text-xl text-gray-600 mt-2">The train is complete!</p>
          </div>
        </div>
      )}

      {/* Complete overlay */}
      {phase === "complete" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-4xl font-black text-amber-500 mb-2">🏆 All Aboard! 🏆</h2>
            <p className="text-xl text-gray-600 mb-4">You completed all the trains!</p>
            
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 mb-6">
              <p className="text-5xl mb-2">🚂🎉🚂</p>
              <p className="text-2xl font-bold text-amber-600">
                {completedRounds} / {totalRounds} Rounds
              </p>
              <p className="text-lg text-gray-500 capitalize mt-2">{difficulty} Mode</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => startGame(difficulty)}
                className="w-full px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all"
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
    </main>
  );
}
