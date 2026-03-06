"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Balloon {
  id: number;
  letter: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  vy: number; // vertical speed (upward)
  wobbleOffset: number;
  wobbleSpeed: number;
  isShaking: boolean;
  shakeTime: number;
  isPopped: boolean;
  popAnimation: number;
  isHint: boolean;
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

type GamePhase = "menu" | "playing" | "wordComplete" | "gameOver" | "paused";

const BALLOON_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F8B500", "#FF8C94", "#A8E6CF", "#FFD93D", "#6BCB77",
  "#FF8066", "#7868E6", "#B8E994", "#F9ED69", "#F08A5D",
  "#E056FD", "#686DE0", "#30336B", "#F97F51", "#7ED6DF",
];

// Word lists organized by length (progressive difficulty)
const WORD_LISTS: Record<number, string[]> = {
  3: ["CAT", "DOG", "SUN", "HAT", "BAT", "CUP", "BUG", "RED", "BIG", "RUN"],
  4: ["FISH", "STAR", "MOON", "TREE", "BIRD", "CAKE", "BALL", "BOOK", "FROG", "DUCK"],
  5: ["APPLE", "HAPPY", "WATER", "GREEN", "HOUSE", "MUSIC", "TIGER", "CANDY", "BEACH", "LIGHT"],
  6: ["ORANGE", "FLOWER", "PUPPY", "SUMMER", "BANANA", "GARDEN", "ROCKET", "CASTLE", "COOKIE", "PENGUIN"],
  7: ["RAINBOW", "DOLPHIN", "BALLOON", "BUTTERFLY", "POPCORN", "TREASURE", "MONSTER", "JOURNEY", "SPARKLE", "FRIENDS"],
};

export default function LetterPopPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [currentWord, setCurrentWord] = useState("");
  const [letterIndex, setLetterIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [maxTimer, setMaxTimer] = useState(15);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [currentWordLength, setCurrentWordLength] = useState(3);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  
  const balloonsRef = useRef<Balloon[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const confettiRef = useRef<Confetti[]>([]);
  const animationRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSpawnRef = useRef<number>(0);

  // Initialize audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play pop sound with pitch variation based on letter
  const playPopSound = useCallback((letter: string) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Map letter to frequency (A=lowest, Z=highest)
      const charCode = letter.charCodeAt(0) - 65;
      const baseFreq = 300 + (charCode * 20);
      oscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio not available
    }
  }, [getAudioContext]);

  // Speak the letter using speech synthesis
  const speakLetter = useCallback((letter: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(letter);
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('karen') ||
        v.name.toLowerCase().includes('google us english')
      );
      if (preferredVoice) utterance.voice = preferredVoice;
      
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Play error sound
  const playErrorSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(150, ctx.currentTime);
      oscillator.type = "square";
      
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch {
      // Audio not available
    }
  }, [getAudioContext]);

  // Play word complete sound
  const playWordCompleteSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const notes = [523, 659, 784]; // C5, E5, G5
      
      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        oscillator.type = "sine";
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.1 + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.4);
        
        oscillator.start(ctx.currentTime + i * 0.1);
        oscillator.stop(ctx.currentTime + i * 0.1 + 0.4);
      });
    } catch {
      // Audio not available
    }
  }, [getAudioContext]);

  // Create particles
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 15) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 4 + Math.random() * 6;
      particlesRef.current.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1,
        radius: 5 + Math.random() * 8,
      });
    }
  }, []);

  // Create confetti
  const createConfetti = useCallback(() => {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#FF8C94"];
    for (let i = 0; i < 60; i++) {
      confettiRef.current.push({
        id: Date.now() + i,
        x: Math.random() * (canvasRef.current?.width || 800),
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        size: 8 + Math.random() * 10,
      });
    }
  }, []);

  // Get a new word
  const getNewWord = useCallback((length: number, used: Set<string>): string => {
    const words = WORD_LISTS[length] || WORD_LISTS[3];
    const available = words.filter(w => !used.has(w));
    if (available.length === 0) {
      // Reset if all words used
      return words[Math.floor(Math.random() * words.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
  }, []);

  // Spawn a balloon with a letter
  const spawnBalloon = useCallback((letter: string, canvasWidth: number, canvasHeight: number, isHint: boolean = false) => {
    const radius = 40 + Math.random() * 15;
    const x = radius + Math.random() * (canvasWidth - radius * 2);
    const y = canvasHeight + radius + 50;
    
    balloonsRef.current.push({
      id: Date.now() + Math.random() * 1000,
      letter,
      x,
      y,
      radius,
      color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
      vy: 1 + Math.random() * 0.8, // Upward speed
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.015,
      isShaking: false,
      shakeTime: 0,
      isPopped: false,
      popAnimation: 0,
      isHint,
    });
  }, []);

  // Start a new word
  const startNewWord = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Determine word length based on progress
    let newLength = currentWordLength;
    if (wordCount > 0 && wordCount % 3 === 0) {
      newLength = Math.min(currentWordLength + 1, 7);
      setCurrentWordLength(newLength);
    }

    const newWord = getNewWord(newLength, usedWords);
    setCurrentWord(newWord);
    setUsedWords(prev => new Set(prev).add(newWord));
    setLetterIndex(0);
    
    // Set timer based on word length (more time for longer words)
    const newMaxTimer = 10 + newLength * 3;
    setMaxTimer(newMaxTimer);
    setTimer(newMaxTimer);
    
    // Clear old balloons
    balloonsRef.current = [];
    
    // Spawn balloons with all letters from the word plus some random letters
    const allLetters = newWord.split('');
    // Add some random letters to make it challenging
    const randomLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < Math.ceil(newLength * 0.5); i++) {
      allLetters.push(randomLetters[Math.floor(Math.random() * randomLetters.length)]);
    }
    
    // Shuffle letters
    for (let i = allLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allLetters[i], allLetters[j]] = [allLetters[j], allLetters[i]];
    }
    
    // Spawn balloons over time
    allLetters.forEach((letter, index) => {
      setTimeout(() => {
        if (phase === "playing" || phase === "wordComplete") {
          const isHint = letter === newWord[0] && index === 0;
          spawnBalloon(letter, canvas.width, canvas.height, isHint);
        }
      }, index * 400);
    });
  }, [currentWordLength, wordCount, usedWords, getNewWord, phase, spawnBalloon]);

  // Handle balloon click
  const handleBalloonClick = useCallback((balloon: Balloon) => {
    if (balloon.isPopped || phase !== "playing") return;
    
    const expectedLetter = currentWord[letterIndex];
    
    if (balloon.letter === expectedLetter) {
      // Correct!
      balloon.isPopped = true;
      balloon.popAnimation = 1;
      
      // Sound and speech
      playPopSound(balloon.letter);
      speakLetter(balloon.letter);
      
      // Create particles
      createParticles(balloon.x, balloon.y, balloon.color, 20);
      
      // Update hint for next balloon
      balloonsRef.current.forEach(b => {
        b.isHint = b.letter === currentWord[letterIndex + 1] && !b.isPopped;
      });
      
      // Move to next letter
      const nextIndex = letterIndex + 1;
      setLetterIndex(nextIndex);
      
      // Add points
      setScore(prev => prev + 10 + Math.floor(timer / 2));
      
      // Check word completion
      if (nextIndex >= currentWord.length) {
        setPhase("wordComplete");
        playWordCompleteSound();
        createConfetti();
        setWordCount(prev => prev + 1);
        
        // Bonus for completing word with time left
        setScore(prev => prev + timer * 5);
        
        // Speak the word
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(currentWord);
          utterance.rate = 0.8;
          window.speechSynthesis.speak(utterance);
        }
        
        // Continue to next word after delay
        setTimeout(() => {
          setPhase("playing");
          startNewWord();
        }, 2000);
      }
    } else {
      // Wrong letter - shake and penalty
      balloon.isShaking = true;
      balloon.shakeTime = 0;
      playErrorSound();
      
      // Time penalty
      setTimer(prev => Math.max(1, prev - 3));
      
      // Stop shaking after 500ms
      setTimeout(() => {
        balloon.isShaking = false;
      }, 500);
    }
  }, [phase, currentWord, letterIndex, playPopSound, speakLetter, createParticles, timer, playErrorSound, playWordCompleteSound, createConfetti, startNewWord]);

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

    // Find clicked balloon
    for (const balloon of balloonsRef.current) {
      if (balloon.isPopped) continue;
      const dist = Math.sqrt((balloon.x - x) ** 2 + (balloon.y - y) ** 2);
      if (dist < balloon.radius) {
        handleBalloonClick(balloon);
        break;
      }
    }
  }, [phase, handleBalloonClick]);

  // Main game loop
  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Clear canvas with sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(0.7, "#E0F4FF");
    gradient.addColorStop(1, "#FFF8E7");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    const drawCloud = (cx: number, cy: number, size: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
      ctx.arc(cx + size * 0.4, cy - size * 0.1, size * 0.4, 0, Math.PI * 2);
      ctx.arc(cx + size * 0.8, cy, size * 0.35, 0, Math.PI * 2);
      ctx.arc(cx + size * 0.4, cy + size * 0.2, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    };
    
    drawCloud(100 + Math.sin(timestamp / 5000) * 30, 80, 60);
    drawCloud(canvas.width - 150 + Math.cos(timestamp / 6000) * 20, 120, 50);
    drawCloud(canvas.width / 2 + Math.sin(timestamp / 7000) * 40, 60, 45);

    // Update and draw balloons
    balloonsRef.current = balloonsRef.current.filter(balloon => {
      if (balloon.isPopped) {
        // Pop animation
        balloon.popAnimation -= 0.1;
        if (balloon.popAnimation > 0) {
          ctx.save();
          ctx.globalAlpha = balloon.popAnimation;
          ctx.translate(balloon.x, balloon.y);
          ctx.scale(1 + (1 - balloon.popAnimation) * 0.8, 1 + (1 - balloon.popAnimation) * 0.8);
          
          // Draw popped balloon
          drawBalloon(ctx, 0, 0, balloon.radius, balloon.color, balloon.letter, balloon.isHint);
          
          ctx.restore();
        }
        return false;
      }

      // Move balloon up
      balloon.y -= balloon.vy;
      balloon.wobbleOffset += balloon.wobbleSpeed;

      // Remove if off screen
      if (balloon.y + balloon.radius < 0) {
        return false;
      }

      const wobbleX = Math.sin(balloon.wobbleOffset) * 4;
      const wobbleY = Math.cos(balloon.wobbleOffset * 1.3) * 2;

      ctx.save();
      
      // Shake effect
      let shakeX = 0;
      let shakeY = 0;
      if (balloon.isShaking) {
        balloon.shakeTime += 0.4;
        shakeX = Math.sin(balloon.shakeTime * 25) * 10;
        shakeY = Math.cos(balloon.shakeTime * 20) * 5;
      }
      
      ctx.translate(balloon.x + wobbleX + shakeX, balloon.y + wobbleY + shakeY);
      
      // Draw balloon
      drawBalloon(ctx, 0, 0, balloon.radius, balloon.color, balloon.letter, balloon.isHint);
      
      ctx.restore();
      
      return true;
    });

    // Draw balloon string
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 2;
    balloonsRef.current.forEach(balloon => {
      if (!balloon.isPopped) {
        const wobbleX = Math.sin(balloon.wobbleOffset) * 4;
        ctx.beginPath();
        ctx.moveTo(balloon.x + wobbleX, balloon.y + balloon.radius);
        ctx.quadraticCurveTo(
          balloon.x + wobbleX + Math.sin(balloon.wobbleOffset * 2) * 10,
          balloon.y + balloon.radius + 25,
          balloon.x + wobbleX + Math.sin(balloon.wobbleOffset * 1.5) * 5,
          balloon.y + balloon.radius + 50
        );
        ctx.stroke();
      }
    });

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2; // gravity
      particle.life -= 0.03;

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
      c.vy += 0.08;
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

    // Draw UI bar at top
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.fillRect(0, 0, canvas.width, 100);
    
    // Decorative border
    ctx.strokeStyle = "#4ECDC4";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.lineTo(canvas.width, 100);
    ctx.stroke();

    if (phase === "playing" || phase === "wordComplete") {
      // Word to spell
      ctx.font = "bold 36px Arial, sans-serif";
      ctx.textAlign = "center";
      
      // Draw each letter with highlighting
      let xPos = canvas.width / 2 - (currentWord.length * 28) / 2;
      currentWord.split('').forEach((letter, idx) => {
        ctx.fillStyle = idx < letterIndex ? "#4ECDC4" : 
                        idx === letterIndex ? "#FF6B6B" : "#333";
        ctx.fillText(letter, xPos + idx * 32, 45);
        
        // Underline current letter
        if (idx === letterIndex && phase === "playing") {
          ctx.strokeStyle = "#FF6B6B";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(xPos + idx * 32 - 12, 52);
          ctx.lineTo(xPos + idx * 32 + 12, 52);
          ctx.stroke();
        }
      });

      // Timer bar
      const timerProgress = timer / maxTimer;
      ctx.fillStyle = "#E8E8E8";
      ctx.fillRect(20, 65, canvas.width - 40, 18);
      
      // Timer fill with color gradient based on time
      let timerColor = "#4ECDC4";
      if (timerProgress < 0.3) timerColor = "#FF6B6B";
      else if (timerProgress < 0.6) timerColor = "#FFEAA7";
      
      const timerGradient = ctx.createLinearGradient(20, 0, 20 + (canvas.width - 40) * timerProgress, 0);
      timerGradient.addColorStop(0, timerColor);
      timerGradient.addColorStop(1, timerColor);
      ctx.fillStyle = timerGradient;
      ctx.fillRect(20, 65, (canvas.width - 40) * timerProgress, 18);

      // Timer text
      ctx.font = "bold 16px Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = "#333";
      ctx.fillText(`⏱️ ${timer}s`, 25, 95);

      // Score
      ctx.textAlign = "right";
      ctx.fillStyle = "#4ECDC4";
      ctx.font = "bold 18px Arial, sans-serif";
      ctx.fillText(`⭐ ${score}`, canvas.width - 20, 85);
      
      // Word count
      ctx.fillStyle = "#666";
      ctx.font = "14px Arial, sans-serif";
      ctx.fillText(`Word ${wordCount + 1}`, canvas.width - 20, 95);
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [phase, currentWord, letterIndex, timer, maxTimer, score, wordCount]);

  // Helper to draw a balloon
  const drawBalloon = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    radius: number, 
    color: string, 
    letter: string,
    isHint: boolean
  ) => {
    // Shadow
    ctx.beginPath();
    ctx.arc(x + 3, y + 3, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fill();

    // Main balloon with gradient
    const balloonGradient = ctx.createRadialGradient(
      x - radius * 0.3, y - radius * 0.3, 0,
      x, y, radius
    );
    balloonGradient.addColorStop(0, "#FFFFFF");
    balloonGradient.addColorStop(0.25, "#FFFFFF");
    balloonGradient.addColorStop(0.6, color);
    balloonGradient.addColorStop(1, color);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = balloonGradient;
    ctx.fill();
    
    // Hint glow
    if (isHint) {
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 4;
      ctx.stroke();
      
      // Pulsing outer glow
      ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
      ctx.lineWidth = 8;
      ctx.stroke();
    } else {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Glossy highlight
    ctx.beginPath();
    ctx.arc(x - radius * 0.35, y - radius * 0.35, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fill();

    // Balloon knot
    ctx.beginPath();
    ctx.moveTo(x - 5, y + radius - 2);
    ctx.lineTo(x, y + radius + 8);
    ctx.lineTo(x + 5, y + radius - 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Letter
    const fontSize = radius * 0.8;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Text shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillText(letter, x + 2, y + 2);
    
    // Main text
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    ctx.lineWidth = 3;
    ctx.strokeText(letter, x, y);
    ctx.fillText(letter, x, y);
  };

  // Start game
  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setScore(0);
    setWordCount(0);
    setCurrentWordLength(3);
    setUsedWords(new Set());
    setHintsUsed(0);
    balloonsRef.current = [];
    particlesRef.current = [];
    confettiRef.current = [];
    setPhase("playing");
    
    // Start with first word
    const firstWord = getNewWord(3, new Set());
    setCurrentWord(firstWord);
    setLetterIndex(0);
    setUsedWords(new Set([firstWord]));
    
    const startTimer = 10 + 3 * 3; // 19 seconds for 3-letter word
    setMaxTimer(startTimer);
    setTimer(startTimer);
    
    // Spawn initial balloons
    const allLetters = firstWord.split('');
    const randomLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < 2; i++) {
      allLetters.push(randomLetters[Math.floor(Math.random() * randomLetters.length)]);
    }
    
    // Shuffle
    for (let i = allLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allLetters[i], allLetters[j]] = [allLetters[j], allLetters[i]];
    }
    
    allLetters.forEach((letter, index) => {
      setTimeout(() => {
        const isHint = letter === firstWord[0] && index < 2;
        spawnBalloon(letter, canvas.width, canvas.height, isHint);
      }, index * 400);
    });

    // Start timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          // Game over
          setPhase("gameOver");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [getNewWord, spawnBalloon]);

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

  // Load voices for speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Start/stop game loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameLoop]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Spawn more balloons as needed during gameplay
  useEffect(() => {
    if (phase !== "playing") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const spawnInterval = setInterval(() => {
      const currentLetter = currentWord[letterIndex];
      const hasCurrentLetter = balloonsRef.current.some(
        b => b.letter === currentLetter && !b.isPopped
      );
      
      // Always ensure at least one balloon with the needed letter exists
      if (!hasCurrentLetter && currentLetter) {
        spawnBalloon(currentLetter, canvas.width, canvas.height, true);
      }
      
      // Occasionally spawn a random letter
      if (Math.random() < 0.3) {
        const randomLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        spawnBalloon(
          randomLetters[Math.floor(Math.random() * randomLetters.length)],
          canvas.width,
          canvas.height,
          false
        );
      }
    }, 2000);

    return () => clearInterval(spawnInterval);
  }, [phase, currentWord, letterIndex, spawnBalloon]);

  // Show hint (highlight next letter)
  const showHint = useCallback(() => {
    const nextLetter = currentWord[letterIndex];
    if (!nextLetter) return;
    
    setHintsUsed(prev => prev + 1);
    setScore(prev => Math.max(0, prev - 5)); // Small penalty for using hint
    
    balloonsRef.current.forEach(b => {
      b.isHint = b.letter === nextLetter && !b.isPopped;
    });
  }, [currentWord, letterIndex]);

  return (
    <main className="min-h-screen relative overflow-hidden">
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h1 className="text-4xl font-black text-[#FF6B6B] mb-2">🎈 Letter Pop! 🎈</h1>
            <p className="text-gray-600 mb-6">Pop balloons to spell words!</p>
            
            <div className="bg-gradient-to-r from-[#E8F4FD] to-[#FFE8F0] rounded-xl p-4 mb-6 text-left">
              <p className="font-bold text-gray-700 mb-2">How to Play:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>🎈 Balloons float up with letters</li>
                <li>👆 Pop letters in order to spell the word</li>
                <li>⏱️ Complete each word before time runs out</li>
                <li>⭐ Earn points for speed and accuracy</li>
                <li>💡 Gold glow shows the next letter</li>
              </ul>
            </div>
            
            <button
              onClick={startGame}
              className="w-full px-8 py-4 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] hover:from-[#FF5A5A] hover:to-[#FF7D3D] text-white font-bold text-xl rounded-2xl transition-all hover:scale-105 shadow-lg"
            >
              🎮 Start Game!
            </button>
          </div>
        </div>
      )}

      {/* Hint Button */}
      {phase === "playing" && (
        <button
          onClick={showHint}
          className="absolute bottom-6 right-6 bg-yellow-400 hover:bg-yellow-300 px-6 py-3 rounded-full font-bold text-yellow-900 shadow-lg transition-all hover:scale-105 z-10"
        >
          💡 Hint
        </button>
      )}

      {/* Pause Button */}
      {phase === "playing" && (
        <button
          onClick={() => {
            setPhase("paused");
            if (timerRef.current) clearInterval(timerRef.current);
          }}
          className="absolute top-[110px] left-4 bg-white/90 hover:bg-white px-4 py-2 rounded-xl font-bold text-gray-700 shadow-lg transition-all z-10"
        >
          ⏸️ Pause
        </button>
      )}

      {/* Pause Overlay */}
      {phase === "paused" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-3xl font-black text-[#4ECDC4] mb-6">⏸️ Paused</h2>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setPhase("playing");
                  timerRef.current = setInterval(() => {
                    setTimer(prev => {
                      if (prev <= 1) {
                        setPhase("gameOver");
                        return 0;
                      }
                      return prev - 1;
                    });
                  }, 1000);
                }}
                className="w-full px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
              >
                ▶️ Resume
              </button>
              <button
                onClick={startGame}
                className="w-full px-6 py-3 bg-[#FF6B6B] hover:bg-[#FF5A5A] text-white font-bold rounded-xl transition-all"
              >
                🔄 Restart
              </button>
              <button
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  setPhase("menu");
                }}
                className="w-full px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl transition-all"
              >
                🏠 Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-3xl font-black text-[#FF6B6B] mb-2">⏰ Time&apos;s Up!</h2>
            <p className="text-gray-600 mb-6">Great effort!</p>
            
            <div className="bg-gradient-to-r from-[#FFE8F0] to-[#E8F4FD] rounded-xl p-4 mb-6">
              <p className="text-4xl font-bold text-[#4ECDC4]">⭐ {score}</p>
              <p className="text-gray-600">Points</p>
              <p className="text-2xl font-bold text-[#FF6B6B] mt-2">📝 {wordCount}</p>
              <p className="text-gray-600">Words Completed</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={startGame}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] hover:from-[#FF5A5A] hover:to-[#FF7D3D] text-white font-bold rounded-xl transition-all"
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
