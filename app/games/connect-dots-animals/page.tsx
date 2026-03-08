'use client';

import { useState, useRef, useCallback } from 'react';

type GamePhase = 'menu' | 'connecting' | 'complete';

const ANIMALS = ['🐘', '🦒', '🦁', '🦓', '🦛', '🦘', '🦌', '🦜'];

export default function ConnectTheDotsAnimals() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [currentDots, setCurrentDots] = useState<{x: number, y: number}[]>([]);
  const [nextDot, setNextDot] = useState(1);
  const [currentAnimal, setCurrentAnimal] = useState(0);
  const [score, setScore] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const dotsRef = useRef<{x: number, y: number}[]>([]);
  
  const playConnectSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(400 + nextDot * 50, ctx.currentTime);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }, [soundEnabled, nextDot]);
  
  const initializeGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Generate dots in a pattern
    const baseX = canvas.width / 2 - 100;
    const baseY = canvas.height / 2 - 100;
    
    const patterns = [
      [{ x: baseX, y: baseY + 150 }, { x: baseX + 100, y: baseY }, { x: baseX + 200, y: baseY + 150 }, { x: baseX + 100, y: baseY + 300 }, { x: baseX, y: baseY + 150 }],
      [{ x: baseX + 100, y: baseY + 50 }, { x: baseX, y: baseY + 150 }, { x: baseX + 200, y: baseY + 150 }, { x: baseX + 100, y: baseY + 350 }, { x: baseX + 100, y: baseY + 150 }],
      [{ x: baseX + 50, y: baseY + 50 }, { x: baseX + 150, y: baseY + 50 }, { x: baseX + 200, y: baseY + 150 }, { x: baseX + 150, y: baseY + 250 }, { x: baseX + 50, y: baseY + 250 }, { x: baseX, y: baseY + 150 }],
    ];
    
    dotsRef.current = patterns[currentAnimal % patterns.length];
    setCurrentDots([]);
    setNextDot(1);
    setGamePhase('connecting');
  }, [currentAnimal]);
  
  const handleTap = (clientX: number, clientY: number) => {
    if (gamePhase !== 'connecting') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const targetDot = dotsRef.current[nextDot - 1];
    if (!targetDot) return;
    
    const dx = x - targetDot.x;
    const dy = y - targetDot.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 40) {
      playConnectSound();
      setCurrentDots(prev => [...prev, targetDot]);
      
      if (nextDot >= dotsRef.current.length) {
        setScore(prev => prev + 10);
        setTimeout(() => {
          if (currentAnimal >= ANIMALS.length - 1) {
            setGamePhase('complete');
          } else {
            setCurrentAnimal(prev => prev + 1);
            initializeGame();
          }
        }, 800);
      } else {
        setNextDot(prev => prev + 1);
      }
    }
  };
  
  return (
    <main className="fixed inset-0 overflow-hidden overscroll-none">
      {/* Prevent body scroll on mobile */}
      <style jsx global>{`
        body { overflow: hidden; overscroll-behavior: none; }
      `}</style>
      
      <canvas
        ref={canvasRef}
        onClick={(e) => handleTap(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          e.preventDefault();
          handleTap(e.touches[0].clientX, e.touches[0].clientY);
        }}
        className="absolute inset-0 cursor-pointer"
        style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #F4A460 100%)', touchAction: 'none' }}
      />
      
      {gamePhase === 'connecting' && (
        <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {currentDots.map((dot, i) => (
            <line
              key={i}
              x1={`${dot.x / window.innerWidth * 100}`}
              y1={`${dot.y / window.innerHeight * 100}`}
              x2={`${currentDots[i + 1]?.x / window.innerWidth * 100 || dot.x / window.innerWidth * 100}`}
              y2={`${currentDots[i + 1]?.y / window.innerHeight * 100 || dot.y / window.innerHeight * 100}`}
              stroke="#FF6B6B"
              strokeWidth="4"
            />
          ))}
        </svg>
      )}
      
      {gamePhase === 'connecting' && dotsRef.current.map((dot, i) => (
        <div
          key={i}
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-bold text-lg ${
            i < nextDot - 1 ? 'bg-green-500 text-white' : i === nextDot - 1 ? 'bg-yellow-400 animate-pulse' : 'bg-white text-gray-700'
          }`}
          style={{
            left: dot.x,
            top: dot.y,
            width: 40,
            height: 40,
            border: '2px solid #333',
          }}
        >
          {i + 1}
        </div>
      ))}
      
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>
      
      {gamePhase === 'menu' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="text-center max-w-md mx-4">
            <div className="text-8xl mb-4 animate-bounce">🐘</div>
            <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Connect the Dots
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Connect numbered dots to reveal animals!
            </p>
            
            <button
              onClick={initializeGame}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-lg transform hover:scale-105 transition-all"
            >
              Start Connecting! 🎯
            </button>
          </div>
        </div>
      )}
      
      {gamePhase === 'connecting' && (
        <>
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/90 rounded-2xl px-6 py-3 shadow-xl">
            <span className="text-2xl font-bold text-orange-600">
              ⭐ {score} | Next: {nextDot}
            </span>
          </div>
          
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 text-6xl">
            {ANIMALS.slice(0, currentAnimal + 1).join(' ')}
          </div>
        </>
      )}
      
      {gamePhase === 'complete' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-5xl font-bold text-white mb-4">All Complete!</h2>
            <div className="text-6xl mb-6">
              {ANIMALS.join(' ')}
            </div>
            <p className="text-3xl text-yellow-400 mb-6">Score: {score}</p>
            <button
              onClick={() => {
                setCurrentAnimal(0);
                setScore(0);
                initializeGame();
              }}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg"
            >
              Play Again
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
