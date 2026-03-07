'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type GamePhase = 'menu' | 'tracing' | 'complete';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function TraceTheLetter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [traced, setTraced] = useState(false);
  
  const currentLetter = LETTERS[currentIndex];
  
  const playCompleteSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.2);
      });
    } catch {}
  }, [soundEnabled]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    let isDrawing = false;
    let drawnPixels = 0;
    
    const letterPixels = new Set<string>();
    
    const draw = () => {
      // Background
      ctx.fillStyle = '#FFFACD';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Lines
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 2;
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Letter outline (dotted)
      ctx.font = '300px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 8;
      ctx.strokeText(currentLetter, canvas.width / 2, canvas.height / 2);
      ctx.setLineDash([]);
      
      // Guide dot
      const time = Date.now() * 0.003;
      const pulse = 1 + Math.sin(time) * 0.2;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(canvas.width / 2 - 80, canvas.height / 2 - 120, 15 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      // Arrow
      ctx.fillStyle = '#B8860B';
      ctx.font = '40px Arial';
      ctx.fillText('↓', canvas.width / 2 - 80, canvas.height / 2 - 160);
      
      requestAnimationFrame(draw);
    };
    
    draw();
    
    const handleStart = (clientX: number, clientY: number) => {
      if (traced) return;
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      ctx.fillStyle = '#4ECDC4';
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();
    };
    
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDrawing || traced) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      ctx.strokeStyle = '#4ECDC4';
      ctx.lineWidth = 30;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      drawnPixels++;
      letterPixels.add(`${Math.floor(x / 30)},${Math.floor(y / 30)}`);
      
      if (letterPixels.size > 40) {
        isDrawing = false;
        setTraced(true);
        playCompleteSound();
        setTimeout(() => {
          setGamePhase('complete');
        }, 1000);
      }
    };
    
    const handleEnd = () => {
      isDrawing = false;
    };
    
    canvas.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY));
    canvas.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    });
    canvas.addEventListener('touchend', handleEnd);
    
    return () => window.removeEventListener('resize', resize);
  }, [currentLetter, traced, playCompleteSound]);
  
  const nextLetter = () => {
    setCurrentIndex((prev) => (prev + 1) % LETTERS.length);
    setTraced(false);
    setGamePhase('tracing');
  };
  
  const startGame = () => {
    setCurrentIndex(0);
    setTraced(false);
    setGamePhase('tracing');
  };
  
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
      />
      
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 z-20 bg-white/80 hover:bg-white text-gray-700 p-3 rounded-full shadow-lg"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      
      {gamePhase === 'menu' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-yellow-300 to-orange-400">
          <div className="text-center max-w-md mx-4">
            <div className="text-8xl mb-4 animate-bounce">📝</div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Trace the Letter
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Learn to write letters by tracing!
            </p>
            
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Tracing! ✏️
            </button>
          </div>
        </div>
      )}
      
      {gamePhase === 'tracing' && (
        <>
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/90 rounded-2xl px-6 py-3 shadow-xl">
            <span className="text-2xl font-bold text-orange-600">
              Letter: {currentLetter} ({currentIndex + 1}/{LETTERS.length})
            </span>
          </div>
        </>
      )}
      
      {gamePhase === 'complete' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">⭐</div>
            <h2 className="text-5xl font-bold text-white mb-4">Great!</h2>
            <p className="text-3xl text-yellow-400 mb-6">
              You traced {currentLetter}!
            </p>
            <button
              onClick={nextLetter}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg"
            >
              Next Letter →
            </button>
          </div>
        </div>
      )}
      
      {gamePhase !== 'menu' && (
        <button
          onClick={() => setGamePhase('menu')}
          className="absolute top-4 left-4 z-20 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm"
        >
          ←
        </button>
      )}
    </main>
  );
}
