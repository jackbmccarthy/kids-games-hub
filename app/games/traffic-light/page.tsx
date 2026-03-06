"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type LightColor = "red" | "yellow" | "green";
type GamePhase = "menu" | "playing" | "gameOver";

interface Car {
  x: number;
  speed: number;
  emoji: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

export default function TrafficLightPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [lightColor, setLightColor] = useState<LightColor>("red");
  const [carPosition, setCarPosition] = useState(0);
  const [stars, setStars] = useState<Star[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [canTap, setCanTap] = useState(true);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [showInstruction, setShowInstruction] = useState(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const lightTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number>(0);
  const textIdRef = useRef(0);

  const CAR_EMOJIS = ["🚗", "🚙", "🚕", "🚌", "🚎", "🚐"];
  const [carEmoji] = useState(() => CAR_EMOJIS[Math.floor(Math.random() * CAR_EMOJIS.length)]);

  // Initialize audio
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Sound effects
  const playSound = useCallback((type: "go" | "stop" | "wrong" | "correct" | "beep") => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      switch (type) {
        case "go":
          // Happy ascending sound
          oscillator.frequency.setValueAtTime(400, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
          oscillator.type = "sine";
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.15);
          break;
        case "stop":
          // Firm stop sound
          oscillator.frequency.setValueAtTime(300, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
          oscillator.type = "square";
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.15);
          break;
        case "wrong":
          // Buzzer sound
          oscillator.frequency.setValueAtTime(150, ctx.currentTime);
          oscillator.type = "sawtooth";
          gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;
        case "correct":
          // Ding sound
          oscillator.frequency.setValueAtTime(880, ctx.currentTime);
          oscillator.type = "sine";
          gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
          break;
        case "beep":
          // Warning beep
          oscillator.frequency.setValueAtTime(500, ctx.currentTime);
          oscillator.type = "square";
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.08);
          break;
      }
    } catch {
      // Audio not available
    }
  }, [getAudioContext]);

  // Add floating text
  const addFloatingText = useCallback((text: string, color: string) => {
    const newFloat: FloatingText = {
      id: textIdRef.current++,
      x: 150 + Math.random() * 100,
      y: 350,
      text,
      color,
    };
    setFloatingTexts(prev => [...prev, newFloat]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(f => f.id !== newFloat.id));
    }, 1000);
  }, []);

  // Change light color randomly
  const changeLight = useCallback(() => {
    const colors: LightColor[] = ["red", "yellow", "green"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    if (randomColor === "yellow" && lightColor === "red") {
      // Yellow usually comes before green
      setLightColor("yellow");
      playSound("beep");
      lightTimerRef.current = setTimeout(() => {
        setLightColor("green");
        setIsMoving(true);
        playSound("go");
      }, 1500);
    } else if (randomColor === "green" && lightColor === "yellow") {
      // Keep going green
      setLightColor("green");
      setIsMoving(true);
      playSound("go");
    } else {
      setLightColor(randomColor);
      if (randomColor === "green") {
        setIsMoving(true);
        playSound("go");
      } else if (randomColor === "red") {
        setIsMoving(false);
        playSound("stop");
      }
    }
  }, [lightColor, playSound]);

  // Handle tap
  const handleTap = useCallback(() => {
    if (!canTap || phase !== "playing") return;
    
    setCanTap(false);
    setTimeout(() => setCanTap(true), 300);

    if (lightColor === "green") {
      // Correct! Move car
      const points = 10 + correctStreak * 2;
      setScore(s => s + points);
      setCorrectStreak(c => c + 1);
      setCarPosition(p => Math.min(p + 8, 85));
      addFloatingText(`+${points}`, "#22C55E");
      playSound("correct");
      
      // Add stars
      const newStars: Star[] = Array.from({ length: 3 }, () => ({
        x: 50 + Math.random() * 100,
        y: 400,
        size: 10 + Math.random() * 15,
        speed: 2 + Math.random() * 2,
      }));
      setStars(prev => [...prev, ...newStars]);
    } else if (lightColor === "yellow") {
      // Warning - wrong timing!
      setScore(s => Math.max(0, s - 5));
      setCorrectStreak(0);
      addFloatingText("Wait for GREEN!", "#FCD34D");
      playSound("wrong");
    } else {
      // Red - stop! Penalty
      setScore(s => Math.max(0, s - 10));
      setCorrectStreak(0);
      setCarPosition(p => Math.max(0, p - 10));
      addFloatingText("STOP on RED!", "#EF4444");
      playSound("wrong");
    }
  }, [canTap, phase, lightColor, correctStreak, addFloatingText, playSound]);

  // Game loop for animations
  useEffect(() => {
    if (phase !== "playing") return;

    const animate = () => {
      // Move car forward slowly on green
      if (lightColor === "green") {
        setCarPosition(p => Math.min(p + 0.3, 85));
      }
      
      // Animate stars
      setStars(prev => prev
        .map(s => ({ ...s, y: s.y - s.speed, x: s.x + Math.sin(s.y / 20) * 2 }))
        .filter(s => s.y > -50)
      );

      // Move floating texts
      setFloatingTexts(prev => prev.map(f => ({ ...f, y: f.y - 2 })));

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [phase, lightColor]);

  // Light changing loop
  useEffect(() => {
    if (phase !== "playing") return;

    const changeInterval = () => {
      const delay = 1500 + Math.random() * 2500; // 1.5-4 seconds
      lightTimerRef.current = setTimeout(() => {
        changeLight();
        changeInterval();
      }, delay);
    };

    // Start with red, then change
    setLightColor("red");
    setIsMoving(false);
    lightTimerRef.current = setTimeout(() => {
      changeLight();
      changeInterval();
    }, 2000);

    return () => {
      if (lightTimerRef.current) clearTimeout(lightTimerRef.current);
    };
  }, [phase, changeLight]);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setPhase("gameOver");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("traffic-light-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Save high score
  useEffect(() => {
    if (phase === "gameOver" && score > highScore) {
      setHighScore(score);
      localStorage.setItem("traffic-light-high-score", String(score));
    }
  }, [phase, score, highScore]);

  // Start game
  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(45);
    setCarPosition(10);
    setLightColor("red");
    setCorrectStreak(0);
    setStars([]);
    setFloatingTexts([]);
    setShowInstruction(true);
    setPhase("playing");
    
    // Hide instruction after 5 seconds
    setTimeout(() => setShowInstruction(false), 5000);
  }, []);

  // Calculate light glow
  const getLightGlow = (color: LightColor) => {
    switch (color) {
      case "red": return "shadow-red-500 shadow-[0_0_30px_rgba(239,68,68,0.8)]";
      case "yellow": return "shadow-yellow-400 shadow-[0_0_30px_rgba(250,204,77,0.8)]";
      case "green": return "shadow-green-500 shadow-[0_0_30px_rgba(34,197,94,0.8)]";
    }
  };

  return (
    <main 
      className="min-h-screen bg-gradient-to-b from-sky-400 via-sky-300 to-green-400 flex flex-col items-center select-none"
      onClick={handleTap}
    >
      {/* Road */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gray-700">
        <div className="absolute top-1/2 left-0 right-0 h-2 flex gap-8 justify-center -translate-y-1/2">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-12 h-2 bg-yellow-400 rounded" />
          ))}
        </div>
        
        {/* Sidewalk */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-gray-500" />
        
        {/* Car */}
        <div 
          className="absolute bottom-8 transition-all duration-200"
          style={{ left: `${carPosition}%`, transform: "translateX(-50%)" }}
        >
          <span className="text-6xl drop-shadow-lg">{carEmoji}</span>
        </div>
      </div>

      {/* Finish line */}
      <div className="absolute bottom-48 right-8 w-4 h-48 bg-gray-800 flex flex-col">
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-gray-800" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-gray-800" />
      </div>

      {/* Traffic Light */}
      <div className="mt-8 relative">
        {/* Pole */}
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-4 h-32 bg-gray-700" />
        
        {/* Light Housing */}
        <div className="bg-gray-800 rounded-2xl p-4 shadow-2xl border-4 border-gray-700">
          <div className="flex flex-col gap-3">
            {/* Red Light */}
            <div 
              className={`w-16 h-16 rounded-full transition-all duration-300 ${
                lightColor === "red" 
                  ? `bg-red-500 ${getLightGlow("red")}` 
                  : "bg-red-900 opacity-50"
              }`}
            />
            {/* Yellow Light */}
            <div 
              className={`w-16 h-16 rounded-full transition-all duration-300 ${
                lightColor === "yellow" 
                  ? `bg-yellow-400 ${getLightGlow("yellow")} animate-pulse` 
                  : "bg-yellow-900 opacity-50"
              }`}
            />
            {/* Green Light */}
            <div 
              className={`w-16 h-16 rounded-full transition-all duration-300 ${
                lightColor === "green" 
                  ? `bg-green-500 ${getLightGlow("green")}` 
                  : "bg-green-900 opacity-50"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Current instruction */}
      <div className="mt-6 text-center">
        <div 
          className={`text-4xl font-black px-6 py-3 rounded-2xl shadow-lg transition-all ${
            lightColor === "green" 
              ? "bg-green-500 text-white animate-pulse" 
              : lightColor === "yellow"
                ? "bg-yellow-400 text-gray-800 animate-pulse"
                : "bg-red-500 text-white"
          }`}
        >
          {lightColor === "green" && "🚗 GO! TAP TO DRIVE!"}
          {lightColor === "yellow" && "⚠️ SLOW DOWN!"}
          {lightColor === "red" && "🛑 STOP! DON'T TAP!"}
        </div>
      </div>

      {/* Score & Timer */}
      {phase === "playing" && (
        <div className="fixed top-4 left-4 right-4 flex justify-between">
          <div className="bg-white/90 backdrop-blur rounded-xl px-4 py-2 shadow-lg">
            <p className="text-sm font-bold text-gray-500">SCORE</p>
            <p className="text-2xl font-black text-green-600">{score}</p>
          </div>
          
          <div className="bg-white/90 backdrop-blur rounded-xl px-4 py-2 shadow-lg">
            <p className="text-sm font-bold text-gray-500">TIME</p>
            <p className={`text-2xl font-black ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-blue-600"}`}>
              {timeLeft}s
            </p>
          </div>
        </div>
      )}

      {/* Streak indicator */}
      {phase === "playing" && correctStreak > 2 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-400 to-yellow-400 text-white font-black px-6 py-2 rounded-full shadow-lg animate-bounce">
          🔥 {correctStreak} Streak! +{correctStreak * 2} bonus
        </div>
      )}

      {/* Floating texts */}
      {floatingTexts.map(ft => (
        <div
          key={ft.id}
          className="fixed text-2xl font-black pointer-events-none animate-ping"
          style={{ 
            left: ft.x, 
            top: ft.y, 
            color: ft.color,
            textShadow: "2px 2px 4px rgba(0,0,0,0.3)"
          }}
        >
          {ft.text}
        </div>
      ))}

      {/* Stars */}
      {stars.map((star, i) => (
        <div
          key={i}
          className="fixed pointer-events-none text-2xl"
          style={{ 
            left: star.x, 
            top: star.y, 
            fontSize: star.size,
          }}
        >
          ⭐
        </div>
      ))}

      {/* Instruction tooltip */}
      {phase === "playing" && showInstruction && (
        <div className="fixed bottom-56 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur rounded-xl px-6 py-3 shadow-xl text-center animate-bounce">
          <p className="text-lg font-bold text-gray-700">
            {lightColor === "green" ? "🟢 Tap now to drive!" : "🔴 Wait for green!"}
          </p>
        </div>
      )}

      {/* Menu */}
      {phase === "menu" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h1 className="text-4xl font-black text-gray-800 mb-2">🚦 Traffic Light</h1>
            <p className="text-xl text-gray-600 mb-4">Learn road safety!</p>
            
            <div className="bg-gray-100 rounded-2xl p-4 mb-6 text-left">
              <p className="text-lg font-bold text-gray-700 mb-2">How to Play:</p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">🟢</span>
                  Green = TAP to drive forward!
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">🔴</span>
                  Red = STOP! Don&apos;t tap!
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold">⚠️</span>
                  Yellow = Get ready to stop
                </li>
              </ul>
            </div>

            {highScore > 0 && (
              <p className="text-xl font-bold text-yellow-500 mb-4">
                🏆 Best: {highScore}
              </p>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); startGame(); }}
              className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-2xl text-2xl shadow-xl transition-all hover:scale-105"
            >
              ▶️ Start Driving!
            </button>
          </div>
        </div>
      )}

      {/* Game Over */}
      {phase === "gameOver" && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-3xl font-black text-gray-800 mb-2">🏁 Time&apos;s Up!</h2>
            
            <div className="my-6">
              <p className="text-2xl font-bold text-gray-600">Your Score</p>
              <p className="text-5xl font-black text-green-600">{score}</p>
            </div>

            {score >= highScore && score > 0 && (
              <p className="text-xl font-bold text-yellow-500 mb-4 animate-pulse">
                🏆 New High Score!
              </p>
            )}

            {/* Traffic safety tip */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-lg font-bold text-blue-700">💡 Safety Tip</p>
              <p className="text-gray-600">
                Always look both ways before crossing the street, even when the light is green!
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl text-xl transition-all"
              >
                🔄 Play Again
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setPhase("menu"); }}
                className="w-full px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl transition-all"
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
