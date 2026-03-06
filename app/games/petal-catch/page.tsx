'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Petal types with colors and point values
const PETAL_TYPES = [
  { name: 'cherry-blossom', emoji: '🌸', color: '#FFB7C5', points: 10, size: 1 },
  { name: 'rose', emoji: '🌹', color: '#FF6B9D', points: 15, size: 1.1 },
  { name: 'tulip', emoji: '🌷', color: '#FF4B8B', points: 12, size: 1 },
  { name: 'hibiscus', emoji: '🌺', color: '#FF5E7D', points: 20, size: 1.2 },
  { name: 'sunflower', emoji: '🌻', color: '#FFD93D', points: 8, size: 0.9 },
  { name: 'lotus', emoji: '🪷', color: '#F8BBD9', points: 25, size: 1.3 },
  { name: 'blossom', emoji: '💮', color: '#FFE4E1', points: 18, size: 1 },
];

interface Petal {
  id: number;
  x: number;
  y: number;
  type: typeof PETAL_TYPES[0];
  rotation: number;
  rotationSpeed: number;
  fallSpeed: number;
  wobble: number;
  wobbleSpeed: number;
}

interface GameState {
  score: number;
  level: number;
  basketFill: number;
  combo: number;
  maxCombo: number;
  petals: Petal[];
  wind: number;
  gameStatus: 'ready' | 'playing' | 'paused' | 'won';
  lastCatchTime: number;
  highScore: number;
}

const BASKET_FILL_GOAL = 100;
const COMBO_TIMEOUT = 1500;

export default function PetalCatch() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    basketFill: 0,
    combo: 0,
    maxCombo: 0,
    petals: [],
    wind: 0,
    gameStatus: 'ready',
    lastCatchTime: 0,
    highScore: 0,
  });

  const [basketX, setBasketX] = useState(50);
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const petalIdRef = useRef<number>(0);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('petal-catch-high-score');
    if (saved) {
      setGameState(prev => ({ ...prev, highScore: parseInt(saved) }));
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.gameStatus !== 'playing') return;
      
      const moveAmount = 5;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setBasketX(prev => Math.max(5, prev - moveAmount));
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        setBasketX(prev => Math.min(95, prev + moveAmount));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.gameStatus]);

  // Touch/mouse controls
  const handleMove = useCallback((clientX: number) => {
    if (!gameRef.current || gameState.gameStatus !== 'playing') return;
    
    const rect = gameRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setBasketX(Math.max(5, Math.min(95, x)));
  }, [gameState.gameStatus]);

  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) handleMove(e.touches[0].clientX);
  };

  // Spawn petals
  const spawnPetal = useCallback(() => {
    const type = PETAL_TYPES[Math.floor(Math.random() * PETAL_TYPES.length)];
    return {
      id: petalIdRef.current++,
      x: Math.random() * 90 + 5,
      y: -10,
      type,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 3,
      fallSpeed: 1 + Math.random() * 1.5,
      wobble: 0,
      wobbleSpeed: Math.random() * 0.05 + 0.02,
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      setGameState(prev => {
        if (prev.gameStatus !== 'playing') return prev;

        // Update wind
        const newWind = prev.wind + (Math.random() - 0.5) * 0.1;
        const clampedWind = Math.max(-2, Math.min(2, newWind));

        // Check combo timeout
        const now = Date.now();
        let newCombo = prev.combo;
        if (now - prev.lastCatchTime > COMBO_TIMEOUT) {
          newCombo = 0;
        }

        // Update petals
        let newPetals = prev.petals.map(petal => ({
          ...petal,
          y: petal.y + petal.fallSpeed * (deltaTime / 16),
          x: petal.x + Math.sin(petal.wobble) * 0.5 + clampedWind * 0.3,
          rotation: petal.rotation + petal.rotationSpeed,
          wobble: petal.wobble + petal.wobbleSpeed,
        })).filter(petal => {
          if (petal.y > 110 || petal.x < -10 || petal.x > 110) {
            newCombo = 0;
            return false;
          }
          return true;
        });

        // Check catches
        let newScore = prev.score;
        let newBasketFill = prev.basketFill;
        let newMaxCombo = prev.maxCombo;
        let caughtAny = false;

        newPetals = newPetals.filter(petal => {
          const petalBottom = petal.y + 5;
          const basketTop = 80;
          const basketLeft = basketX - 8;
          const basketRight = basketX + 8;

          if (petalBottom >= basketTop && petal.y <= 95) {
            if (petal.x >= basketLeft && petal.x <= basketRight) {
              const comboMultiplier = 1 + newCombo * 0.1;
              const points = Math.floor(petal.type.points * comboMultiplier);
              newScore += points;
              newBasketFill = Math.min(BASKET_FILL_GOAL, newBasketFill + 5);
              newCombo++;
              newMaxCombo = Math.max(newMaxCombo, newCombo);
              caughtAny = true;
              return false;
            }
          }
          return true;
        });

        // Spawn new petals
        const spawnRate = Math.max(25, 50 - prev.level * 5);
        if (Math.random() < 1 / spawnRate) {
          newPetals.push(spawnPetal());
        }

        // Check level complete
        let newLevel = prev.level;
        let newStatus: GameState['gameStatus'] = prev.gameStatus;
        
        if (newBasketFill >= BASKET_FILL_GOAL) {
          newLevel++;
          newBasketFill = 0;
          if (newLevel > 5) {
            newStatus = 'won';
          }
        }

        // Update high score
        if (newScore > prev.highScore) {
          localStorage.setItem('petal-catch-high-score', newScore.toString());
        }

        return {
          ...prev,
          score: newScore,
          level: newLevel,
          basketFill: newBasketFill,
          combo: newCombo,
          maxCombo: newMaxCombo,
          petals: newPetals,
          wind: clampedWind,
          gameStatus: newStatus,
          lastCatchTime: caughtAny ? now : prev.lastCatchTime,
          highScore: Math.max(prev.highScore, newScore),
        };
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState.gameStatus, basketX, spawnPetal]);

  const startGame = () => {
    lastTimeRef.current = 0;
    petalIdRef.current = 0;
    setBasketX(50);
    setGameState(prev => ({
      score: 0,
      level: 1,
      basketFill: 0,
      combo: 0,
      maxCombo: 0,
      petals: [],
      wind: 0,
      gameStatus: 'playing',
      lastCatchTime: 0,
      highScore: prev.highScore,
    }));
  };

  // Combo display colors
  const getComboColor = (combo: number) => {
    if (combo >= 10) return 'text-red-500';
    if (combo >= 7) return 'text-orange-500';
    if (combo >= 5) return 'text-yellow-500';
    if (combo >= 3) return 'text-blue-500';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden select-none">
      {/* Garden Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #87CEEB 0%, #B4E4FF 30%, #98D8C8 50%, #7CB342 75%, #558B2F 100%)',
        }}
      />

      {/* Decorative garden elements */}
      <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none z-10">
        <div className="absolute bottom-0 left-3 text-4xl md:text-5xl">🌷</div>
        <div className="absolute bottom-2 left-14 text-3xl md:text-4xl">🌻</div>
        <div className="absolute bottom-0 right-5 text-4xl md:text-5xl">🌹</div>
        <div className="absolute bottom-3 right-16 text-3xl md:text-4xl">🌸</div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-5xl md:text-6xl">🌳</div>
      </div>

      {/* Floating clouds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute text-3xl md:text-4xl opacity-30"
            style={{
              left: `${i * 25 + 5}%`,
              top: `${5 + i * 6}%`,
              animation: `floatCloud ${20 + i * 5}s linear infinite`,
            }}
          >
            ☁️
          </div>
        ))}
      </div>

      {/* Floating butterflies */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute text-xl md:text-2xl"
            style={{
              left: `${15 + i * 35}%`,
              top: `${25 + (i % 2) * 20}%`,
              animation: `flutter ${3 + i}s ease-in-out infinite`,
            }}
          >
            🦋
          </div>
        ))}
      </div>

      {/* Wind indicator */}
      {gameState.gameStatus === 'playing' && (
        <div className="absolute top-16 left-3 md:left-4 bg-white/70 backdrop-blur-sm rounded-full px-3 py-1 text-sm z-20">
          Wind: {gameState.wind > 0.5 ? '➡️' : gameState.wind < -0.5 ? '⬅️' : '🍃'}
        </div>
      )}

      {/* Game container */}
      <div
        ref={gameRef}
        className="relative w-full h-screen"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* UI Overlay */}
        <div className="absolute top-0 left-0 right-0 p-3 md:p-4 flex justify-between items-start z-20">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 md:p-4 shadow-lg">
            <div className="text-xl md:text-2xl font-bold text-green-700">
              🏆 {gameState.score}
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              Best: {gameState.highScore}
            </div>
            <div className="text-sm md:text-lg text-purple-600 font-semibold mt-1">
              Level {gameState.level} / 5
            </div>
          </div>

          {/* Combo display */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-3 md:p-4 shadow-lg text-center">
            <div className={`text-2xl md:text-3xl font-bold ${getComboColor(gameState.combo)}`}>
              {gameState.combo > 0 && `🔥 x${gameState.combo}`}
            </div>
            <div className="text-xs text-gray-500">Combo</div>
          </div>
        </div>

        {/* Basket Fill Progress */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧺</span>
              <div className="w-24 md:w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-400 to-rose-500 transition-all duration-300 rounded-full"
                  style={{ width: `${gameState.basketFill}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-700">{gameState.basketFill}%</span>
            </div>
          </div>
        </div>

        {/* Petals */}
        {gameState.petals.map(petal => (
          <div
            key={petal.id}
            className="absolute text-3xl md:text-4xl pointer-events-none transition-none"
            style={{
              left: `${petal.x}%`,
              top: `${petal.y}%`,
              transform: `translate(-50%, -50%) rotate(${petal.rotation}deg) scale(${petal.type.size})`,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            }}
          >
            {petal.type.emoji}
          </div>
        ))}

        {/* Basket */}
        {gameState.gameStatus === 'playing' && (
          <div
            className="absolute text-5xl md:text-6xl transition-all duration-75 pointer-events-none"
            style={{
              left: `${basketX}%`,
              bottom: '8%',
              transform: 'translateX(-50%)',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
            }}
          >
            🧺
          </div>
        )}

        {/* Start Screen */}
        {gameState.gameStatus === 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/20 backdrop-blur-sm">
            <div className="bg-white/95 rounded-3xl p-6 md:p-10 shadow-2xl text-center max-w-md mx-4">
              <div className="text-6xl mb-4">🌸🧺🌹</div>
              <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-2">
                Petal Catch
              </h1>
              <p className="text-gray-600 mb-6">
                Catch falling petals in your basket!<br/>
                Different flowers = different points!
              </p>
              
              <div className="grid grid-cols-2 gap-2 mb-6 text-sm">
                {PETAL_TYPES.slice(0, 6).map(type => (
                  <div key={type.name} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-xl">{type.emoji}</span>
                    <span className="text-gray-700">+{type.points}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={startGame}
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xl md:text-2xl font-bold py-4 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all"
              >
                🌷 Play! 🌷
              </button>

              <div className="mt-4 text-sm text-gray-500">
                Move mouse/finger or use ← → keys
              </div>
            </div>
          </div>
        )}

        {/* Win Screen */}
        {gameState.gameStatus === 'won' && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/20 backdrop-blur-sm">
            <div className="bg-white/95 rounded-3xl p-6 md:p-10 shadow-2xl text-center max-w-md mx-4">
              <div className="text-6xl mb-4">🎉🌸🌺🎉</div>
              <h2 className="text-3xl md:text-4xl font-bold text-green-700 mb-2">
                You Won!
              </h2>
              <div className="text-5xl font-bold text-rose-500 mb-4">
                🏆 {gameState.score} points
              </div>
              <div className="text-xl text-purple-600 mb-6">
                Max Combo: 🔥 x{gameState.maxCombo}
              </div>
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-xl font-bold py-4 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all"
              >
                🌷 Play Again! 🌷
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes flutter {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(15px, -20px) rotate(10deg); }
          50% { transform: translate(30px, 0) rotate(-5deg); }
          75% { transform: translate(15px, 20px) rotate(5deg); }
        }
        @keyframes floatCloud {
          0% { transform: translateX(0); }
          100% { transform: translateX(100vw); }
        }
      `}</style>
    </div>
  );
}
