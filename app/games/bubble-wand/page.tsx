"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Bubble {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  maxRadius: number;
  growthProgress: number;
  hue: number;
  wobblePhase: number;
  wobbleSpeed: number;
  wobbleAmount: number;
  life: number;
  maxLife: number;
  opacity: number;
  shimmerOffset: number;
  popProgress: number;
  isPopping: boolean;
  trailBubbles: TrailBubble[];
}

interface TrailBubble {
  id: number;
  x: number;
  y: number;
  radius: number;
  hue: number;
  life: number;
}

interface PopParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
  life: number;
}

interface MovingPoint {
  x: number;
  y: number;
  speed: number;
}

const AMBIENT_NOTES = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C4, D4, E4, G4, A4, C5

export default function BubbleWandPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [particles, setParticles] = useState<PopParticle[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const [lastPoint, setLastPoint] = useState<MovingPoint | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bubbleCount, setBubbleCount] = useState(0);
  
  const bubblesRef = useRef<Bubble[]>([]);
  const particlesRef = useRef<PopParticle[]>([]);
  const animationRef = useRef<number>(0);
  const bubbleIdRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSoundTimeRef = useRef<number>(0);
  const ambientOscRef = useRef<OscillatorNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);

  // Get audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play bubble creation sound
  const playBubbleSound = useCallback((size: number) => {
    if (!soundEnabled) return;
    
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Limit sound frequency
      if (now - lastSoundTimeRef.current < 0.05) return;
      lastSoundTimeRef.current = now;

      // Soft bubble sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      const baseFreq = AMBIENT_NOTES[Math.floor(Math.random() * AMBIENT_NOTES.length)];
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.type = "sine";

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2000, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio not available
    }
  }, [soundEnabled, getAudioContext]);

  // Play pop sound
  const playPopSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      osc.type = "sine";

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Audio not available
    }
  }, [soundEnabled, getAudioContext]);

  // Start ambient sound
  const startAmbientSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      const ctx = getAudioContext();
      
      if (ambientOscRef.current) return; // Already playing

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(130.81, ctx.currentTime); // C3
      osc.type = "sine";

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(400, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 1);

      osc.start();
      
      ambientOscRef.current = osc;
      ambientGainRef.current = gain;
    } catch {
      // Audio not available
    }
  }, [soundEnabled, getAudioContext]);

  // Stop ambient sound
  const stopAmbientSound = useCallback(() => {
    try {
      if (ambientGainRef.current && audioContextRef.current) {
        ambientGainRef.current.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.5);
        setTimeout(() => {
          if (ambientOscRef.current) {
            ambientOscRef.current.stop();
            ambientOscRef.current = null;
            ambientGainRef.current = null;
          }
        }, 600);
      }
    } catch {
      // Audio not available
    }
  }, []);

  // Create a new bubble
  const createBubble = useCallback((x: number, y: number, speed: number): Bubble => {
    const baseSize = 15 + Math.random() * 35;
    const sizeMultiplier = Math.min(speed / 5, 2);
    const finalSize = baseSize * (0.5 + sizeMultiplier * 0.5);
    
    const trailBubbles: TrailBubble[] = [];
    const numTrail = Math.floor(speed / 3) + 1;
    for (let i = 0; i < numTrail; i++) {
      trailBubbles.push({
        id: bubbleIdRef.current++,
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        radius: finalSize * (0.1 + Math.random() * 0.15),
        hue: Math.random() * 360,
        life: 1,
      });
    }
    
    return {
      id: bubbleIdRef.current++,
      x,
      y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.3 - Math.random() * 0.5,
      radius: finalSize * 0.3,
      maxRadius: finalSize,
      growthProgress: 0,
      hue: Math.random() * 360,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      wobbleAmount: 2 + Math.random() * 3,
      life: 1,
      maxLife: 300 + Math.random() * 200, // 5-8 seconds at 60fps
      opacity: 1,
      shimmerOffset: Math.random() * Math.PI * 2,
      popProgress: 0,
      isPopping: false,
      trailBubbles,
    };
  }, []);

  // Create pop particles
  const createPopParticles = useCallback((bubble: Bubble) => {
    const particles: PopParticle[] = [];
    const numParticles = 8 + Math.floor(bubble.radius / 5);
    
    for (let i = 0; i < numParticles; i++) {
      const angle = (Math.PI * 2 * i) / numParticles + Math.random() * 0.3;
      const speed = 2 + Math.random() * 3;
      
      particles.push({
        id: bubble.id * 100 + i,
        x: bubble.x,
        y: bubble.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: bubble.radius * (0.1 + Math.random() * 0.15),
        hue: bubble.hue,
        life: 1,
      });
    }
    
    return particles;
  }, []);

  // Handle mouse/touch move
  const handleMove = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    if (lastPoint) {
      const dx = x - lastPoint.x;
      const dy = y - lastPoint.y;
      const speed = Math.sqrt(dx * dx + dy * dy);
      
      // Create bubbles based on movement speed
      if (speed > 3) {
        const newBubble = createBubble(x, y, speed);
        bubblesRef.current = [...bubblesRef.current, newBubble];
        setBubbles([...bubblesRef.current]);
        setBubbleCount(prev => prev + 1);
        playBubbleSound(newBubble.maxRadius);
      }
    }
    
    setLastPoint({ x, y, speed: lastPoint?.speed || 0 });
    setIsMoving(true);
    startAmbientSound();
  }, [lastPoint, createBubble, playBubbleSound, startAmbientSound]);

  const handleMoveEnd = useCallback(() => {
    setIsMoving(false);
    setLastPoint(null);
    stopAmbientSound();
  }, [stopAmbientSound]);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      // Draw gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, "#87CEEB"); // Sky blue
      bgGradient.addColorStop(0.5, "#B0E0E6"); // Powder blue
      bgGradient.addColorStop(1, "#E6E6FA"); // Lavender
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add subtle sun glow
      const sunGradient = ctx.createRadialGradient(
        canvas.width - 100, 80, 0,
        canvas.width - 100, 80, 150
      );
      sunGradient.addColorStop(0, "rgba(255, 255, 200, 0.4)");
      sunGradient.addColorStop(0.5, "rgba(255, 220, 150, 0.1)");
      sunGradient.addColorStop(1, "rgba(255, 200, 100, 0)");
      ctx.fillStyle = sunGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw bubbles
      const timestamp = Date.now();
      bubblesRef.current = bubblesRef.current.filter(bubble => {
        // Growth animation
        if (bubble.growthProgress < 1) {
          bubble.growthProgress += 0.08;
          bubble.radius = bubble.maxRadius * Math.min(bubble.growthProgress, 1);
        }

        // Update position
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;
        
        // Wobble
        bubble.wobblePhase += bubble.wobbleSpeed;
        const wobbleX = Math.sin(bubble.wobblePhase) * bubble.wobbleAmount;
        
        // Update life
        if (!bubble.isPopping) {
          bubble.life -= 1 / bubble.maxLife;
          bubble.opacity = Math.min(bubble.life * 2, 1);
          
          // Start popping when life is low
          if (bubble.life < 0.1) {
            bubble.isPopping = true;
            playPopSound();
            const newParticles = createPopParticles(bubble);
            particlesRef.current = [...particlesRef.current, ...newParticles];
          }
        }
        
        // Pop animation
        if (bubble.isPopping) {
          bubble.popProgress += 0.15;
          bubble.opacity = Math.max(0, 1 - bubble.popProgress);
          
          if (bubble.popProgress >= 1) {
            return false;
          }
        }

        // Remove if off screen
        if (bubble.y + bubble.radius < -50) {
          return false;
        }

        // Draw bubble
        ctx.save();
        ctx.translate(bubble.x + wobbleX, bubble.y);
        
        if (bubble.isPopping) {
          ctx.scale(1 + bubble.popProgress * 0.5, 1 + bubble.popProgress * 0.5);
        }

        const currentRadius = bubble.radius * (bubble.isPopping ? (1 - bubble.popProgress * 0.3) : 1);
        
        if (currentRadius > 0) {
          // Rainbow shimmer effect
          const shimmerHue = (bubble.hue + (timestamp / 20) + bubble.shimmerOffset) % 360;
          
          // Main bubble with gradient
          const bubbleGradient = ctx.createRadialGradient(
            -currentRadius * 0.3, -currentRadius * 0.3, 0,
            0, 0, currentRadius
          );
          
          // Rainbow shimmer colors
          const shimmer1 = `hsla(${shimmerHue}, 80%, 70%, ${bubble.opacity * 0.3})`;
          const shimmer2 = `hsla(${(shimmerHue + 60) % 360}, 70%, 80%, ${bubble.opacity * 0.2})`;
          const shimmer3 = `hsla(${(shimmerHue + 120) % 360}, 60%, 90%, ${bubble.opacity * 0.15})`;
          
          bubbleGradient.addColorStop(0, `rgba(255, 255, 255, ${bubble.opacity * 0.8})`);
          bubbleGradient.addColorStop(0.2, shimmer1);
          bubbleGradient.addColorStop(0.5, shimmer2);
          bubbleGradient.addColorStop(0.8, shimmer3);
          bubbleGradient.addColorStop(1, `rgba(255, 255, 255, ${bubble.opacity * 0.1})`);

          ctx.beginPath();
          ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = bubbleGradient;
          ctx.fill();

          // Bubble outline with shimmer
          ctx.strokeStyle = `hsla(${shimmerHue}, 60%, 70%, ${bubble.opacity * 0.5})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Glossy highlight
          ctx.beginPath();
          ctx.ellipse(
            -currentRadius * 0.35,
            -currentRadius * 0.35,
            currentRadius * 0.25,
            currentRadius * 0.15,
            -0.5,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.7})`;
          ctx.fill();

          // Secondary highlight
          ctx.beginPath();
          ctx.arc(
            currentRadius * 0.3,
            currentRadius * 0.3,
            currentRadius * 0.1,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity * 0.3})`;
          ctx.fill();
        }

        ctx.restore();

        // Draw trail bubbles
        bubble.trailBubbles = bubble.trailBubbles.filter(tb => {
          tb.life -= 0.02;
          tb.y -= 0.5; // Float up
          
          if (tb.life > 0 && tb.radius > 0) {
            ctx.beginPath();
            ctx.arc(tb.x, tb.y, tb.radius * tb.life, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${tb.hue}, 70%, 75%, ${tb.life * 0.5})`;
            ctx.fill();
            return true;
          }
          return false;
        });

        return true;
      });

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.05; // Slight gravity
        particle.life -= 0.03;
        
        if (particle.life > 0) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius * particle.life, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${particle.hue}, 70%, 75%, ${particle.life * 0.6})`;
          ctx.fill();
          return true;
        }
        return false;
      });

      // Draw cursor glow when moving
      if (isMoving && lastPoint) {
        const cursorGradient = ctx.createRadialGradient(
          lastPoint.x, lastPoint.y, 0,
          lastPoint.x, lastPoint.y, 30
        );
        cursorGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
        cursorGradient.addColorStop(0.5, "rgba(200, 230, 255, 0.1)");
        cursorGradient.addColorStop(1, "rgba(150, 200, 255, 0)");
        ctx.fillStyle = cursorGradient;
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 30, 0, Math.PI * 2);
        ctx.fill();
      }

      setBubbles([...bubblesRef.current]);
      setParticles([...particlesRef.current]);
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isMoving, lastPoint, createPopParticles, playPopSound]);

  // Clear all bubbles
  const clearBubbles = useCallback(() => {
    // Pop all existing bubbles
    bubblesRef.current.forEach(bubble => {
      if (!bubble.isPopping) {
        const newParticles = createPopParticles(bubble);
        particlesRef.current = [...particlesRef.current, ...newParticles];
        playPopSound();
      }
    });
    
    bubblesRef.current = [];
    setBubbles([]);
    setBubbleCount(0);
  }, [createPopParticles, playPopSound]);

  // Save as image
  const saveImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `bubble-wand-art-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Main canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair touch-none"
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseLeave={handleMoveEnd}
        onTouchMove={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleMove(touch.clientX, touch.clientY);
        }}
        onTouchEnd={handleMoveEnd}
      />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg">
          <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400">
            🫧 Bubble Wand 🫧
          </h1>
        </div>
        
        <div className="pointer-events-auto bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg">
          <span className="font-bold text-gray-700">Bubbles: {bubbleCount}</span>
        </div>
      </header>

      {/* Control buttons */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
        <div className="flex justify-center gap-3 flex-wrap">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`pointer-events-auto px-5 py-3 font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 text-lg ${
              soundEnabled
                ? "bg-purple-400 hover:bg-purple-500 text-white"
                : "bg-gray-300 hover:bg-gray-400 text-gray-600"
            }`}
          >
            {soundEnabled ? "🔊 Sound On" : "🔇 Sound Off"}
          </button>
          
          <button
            onClick={clearBubbles}
            disabled={bubbleCount === 0}
            className={`pointer-events-auto px-5 py-3 font-bold rounded-xl shadow-lg transition-all text-lg ${
              bubbleCount === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-red-400 hover:bg-red-500 text-white hover:scale-105 active:scale-95"
            }`}
          >
            🗑️ Clear
          </button>
          
          <button
            onClick={saveImage}
            disabled={bubbleCount === 0}
            className={`pointer-events-auto px-5 py-3 font-bold rounded-xl shadow-lg transition-all text-lg ${
              bubbleCount === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white hover:scale-105 active:scale-95"
            }`}
          >
            💾 Save Art
          </button>
        </div>
      </div>

      {/* Instructions (shows when no bubbles) */}
      {bubbleCount === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/85 backdrop-blur-sm rounded-3xl p-8 text-center shadow-xl max-w-md mx-4">
            <p className="text-5xl mb-4 animate-bounce">🫧</p>
            <h2 className="text-2xl font-bold text-gray-700 mb-3">Wave Your Wand!</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Move your finger or cursor around to create beautiful bubbles! 
              Watch them float, shimmer, and pop! ✨
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
