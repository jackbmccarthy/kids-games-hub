"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface GameObject {
  id: number;
  name: string;
  svg: string;
  rotation: number;
  matched: boolean;
}

interface ShadowObject {
  id: number;
  matched: boolean;
}

type Difficulty = "easy" | "medium" | "hard";
type GamePhase = "menu" | "playing" | "roundComplete" | "gameOver";

const SVG_SHAPES: { name: string; svg: string }[] = [
  { name: "cat", svg: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" },
  { name: "dog", svg: "M18 4l-2 2h-1l-2-2H9L7 6H6L4 4S2 4 2 6v8c0 2 2 4 4 4h12c2 0 4-2 4-4V6c0-2-2-2-2-2z" },
  { name: "bird", svg: "M21 8c-1.45 0-2.26 1.44-1.93 2.51l-3.55 3.56c-.1-.03-.21-.07-.32-.07-.12 0-.23.04-.34.08l-2.55-2.55c.34-1.03-.2-2.39-1.31-2.87-1.11-.48-2.37.07-2.87 1.11-.48 1.11.07 2.37 1.11 2.87.39.17.79.25 1.18.25.11 0 .22-.01.33-.03l2.52 2.52c-.03.11-.07.22-.07.34 0 1.1.9 2 2 2s2-.9 2-2c0-.11-.04-.22-.07-.33l3.55-3.55c.11.03.22.07.33.07 1.1 0 2-.9 2-2s-.9-2-2-2z" },
  { name: "star", svg: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  { name: "heart", svg: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" },
  { name: "tree", svg: "M12 2L4 12h3v8h10v-8h3L12 2z" },
  { name: "apple", svg: "M20 10c0-1.63-.58-3.13-1.54-4.31C17.34 4.35 14.9 3 12 3c-2.9 0-5.34 1.35-6.46 2.69C4.58 6.87 4 8.37 4 10c0 3.31 2.69 6 6 6h4c3.31 0 6-2.69 6-6zM12 2c.55 0 1 .45 1 1v1c0 .55-.45 1-1 1s-1-.45-1-1V3c0-.55.45-1 1-1z" },
  { name: "car", svg: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" },
  { name: "fish", svg: "M12 20l-1.5-1.5c-3.1-3.1-3.1-8.2 0-11.3C13.6 5.1 17.4 5 20 7.5l-8 8c1.5 1.5 3.5 2.5 5.5 2.5 2.6 0 4.9-1.4 6.2-3.5.4-.6.8-1.2 1-1.9L22 14c-1.7 4.4-6 7.5-11 7.5-2.4 0-4.6-.7-6.5-1.9L12 20z" },
  { name: "butterfly", svg: "M12 8c-1.66 0-3 1.34-3 3v6c0 1.66 1.34 3 3 3s3-1.34 3-3v-6c0-1.66-1.34-3-3-3zm-7 0c-1.66 0-3 1.34-3 3v6c0 1.66 1.34 3 3 3s3-1.34 3-3v-6c0-1.66-1.34-3-3-3zm14 0c-1.66 0-3 1.34-3 3v6c0 1.66 1.34 3 3 3s3-1.34 3-3v-6c0-1.66-1.34-3-3-3z" },
  { name: "house", svg: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" },
  { name: "flower", svg: "M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zM5.6 10.25c0 1.38 1.12 2.5 2.5 2.5.53 0 1.01-.16 1.42-.44l-.02.19c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5l-.02-.19c.4.28.89.44 1.42.44 1.38 0 2.5-1.12 2.5-2.5 0-1-.59-1.85-1.43-2.25.84-.4 1.43-1.25 1.43-2.25 0-1.38-1.12-2.5-2.5-2.5-.53 0-1.01.16-1.42.44l.02-.19C14.5 2.12 13.38 1 12 1S9.5 2.12 9.5 3.5l.02.19c-.4-.28-.89-.44-1.42-.44-1.38 0-2.5 1.12-2.5 2.5 0 1 .59 1.85 1.43 2.25-.84.4-1.43 1.25-1.43 2.25zM12 5.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5S9.5 9.38 9.5 8s1.12-2.5 2.5-2.5zM3 13c0 4.97 4.03 9 9 9 0-4.97-4.03-9-9-9z" },
  { name: "sun", svg: "M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z" },
  { name: "moon", svg: "M9 2c-1.05 0-2.05.16-3 .46 4.06 1.27 7 5.06 7 9.54 0 4.48-2.94 8.27-7 9.54.95.3 1.95.46 3 .46 5.52 0 10-4.48 10-10S14.52 2 9 2z" },
  { name: "cloud", svg: "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" },
];

const DIFFICULTY_CONFIG = {
  easy: { objectCount: 4, timer: 90, rotation: false },
  medium: { objectCount: 6, timer: 60, rotation: true },
  hard: { objectCount: 8, timer: 45, rotation: true },
};

export default function ShadowMatchPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [shadows, setShadows] = useState<ShadowObject[]>([]);
  const [draggedObject, setDraggedObject] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [matchesThisRound, setMatchesThisRound] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctMatches, setCorrectMatches] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("shadow-match-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Start new round
  const startRound = useCallback(() => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const shuffledShapes = [...SVG_SHAPES].sort(() => Math.random() - 0.5);
    const selectedShapes = shuffledShapes.slice(0, config.objectCount);
    
    const newObjects: GameObject[] = selectedShapes.map((shape, index) => ({
      id: index,
      name: shape.name,
      svg: shape.svg,
      rotation: config.rotation ? Math.random() * 360 : 0,
      matched: false,
    }));

    const shuffledIds = newObjects.map(o => o.id).sort(() => Math.random() - 0.5);
    const newShadows: ShadowObject[] = shuffledIds.map((id, index) => ({
      id,
      matched: false,
    }));

    setObjects(newObjects);
    setShadows(newShadows);
    setTimeLeft(config.timer);
    setHintUsed(false);
    setMatchesThisRound(0);
    setPhase("playing");
  }, [difficulty]);

  // Start new game
  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setLevel(1);
    setScore(0);
    setAccuracy(0);
    setTotalAttempts(0);
    setCorrectMatches(0);
    startRound();
  }, [startRound]);

  // Timer
  useEffect(() => {
    if (phase === "playing" && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else if (phase === "playing" && timeLeft === 0) {
      setPhase("gameOver");
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("shadow-match-high-score", String(score));
      }
    }
  }, [phase, timeLeft, score, highScore]);

  // Check for round complete
  useEffect(() => {
    if (phase === "playing" && objects.length > 0 && objects.every(o => o.matched)) {
      setPhase("roundComplete");
    }
  }, [objects, phase]);

  // Handle match attempt
  const handleMatch = useCallback((objectId: number, shadowId: number) => {
    if (objectId === shadowId) {
      // Correct match
      setObjects(prev => prev.map(o => 
        o.id === objectId ? { ...o, matched: true } : o
      ));
      setShadows(prev => prev.map(s =>
        s.id === shadowId ? { ...s, matched: true } : s
      ));
      setScore(prev => prev + 10 + Math.floor(timeLeft / 10));
      setMatchesThisRound(prev => prev + 1);
      setCorrectMatches(prev => prev + 1);
      setTotalAttempts(prev => prev + 1);
    } else {
      // Wrong match
      setScore(prev => Math.max(0, prev - 2));
      setTotalAttempts(prev => prev + 1);
    }
    setDraggedObject(null);
  }, [timeLeft]);

  // Use hint
  const useHint = useCallback(() => {
    if (hintUsed || score < 5) return;
    
    const unmatchedObject = objects.find(o => !o.matched);
    if (unmatchedObject) {
      setScore(prev => Math.max(0, prev - 5));
      setHintUsed(true);
      
      // Highlight the matching shadow briefly
      const shadow = shadows.find(s => s.id === unmatchedObject.id && !s.matched);
      if (shadow) {
        // Flash effect handled in UI
      }
    }
  }, [hintUsed, score, objects, shadows]);

  // Next round
  const nextRound = useCallback(() => {
    setLevel(prev => prev + 1);
    setAccuracy(Math.round((correctMatches / totalAttempts) * 100));
    startRound();
  }, [correctMatches, totalAttempts, startRound]);

  // Render SVG icon
  const renderIcon = (svgPath: string, size: number = 48, color: string = "currentColor", blur: boolean = false) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      style={{ filter: blur ? "blur(1px)" : "none" }}
    >
      <path d={svgPath} />
    </svg>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#E8F5E9] to-[#E3F2FD] p-4">
      {/* Header */}
      <header className="max-w-4xl mx-auto text-center mb-4">
        <h1 className="text-3xl md:text-4xl font-black text-[#2C3E50] mb-2">
          🌑 Shadow Match 🌑
        </h1>
        {phase === "playing" && (
          <div className="flex justify-center gap-8 text-lg font-bold">
            <span className="text-[#4ECDC4]">Score: {score}</span>
            <span className={timeLeft <= 10 ? "text-red-500" : "text-[#2C3E50]"}>
              ⏱️ {timeLeft}s
            </span>
            <span className="text-[#FF6B6B]">Level: {level}</span>
          </div>
        )}
      </header>

      {/* Menu */}
      {phase === "menu" && (
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-xl text-center">
          <p className="text-gray-600 mb-4">Match objects to their shadows!</p>
          
          {highScore > 0 && (
            <p className="text-xl font-bold text-[#FFD700] mb-4">
              🏆 High Score: {highScore}
            </p>
          )}

          <div className="space-y-3 mb-6">
            <p className="font-bold text-gray-700">Select Difficulty:</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => startGame("easy")}
                className="px-6 py-3 bg-green-400 hover:bg-green-500 text-white font-bold rounded-xl transition-all hover:scale-105"
              >
                Easy 🌱
              </button>
              <button
                onClick={() => startGame("medium")}
                className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-xl transition-all hover:scale-105"
              >
                Medium ⭐
              </button>
              <button
                onClick={() => startGame("hard")}
                className="px-6 py-3 bg-red-400 hover:bg-red-500 text-white font-bold rounded-xl transition-all hover:scale-105"
              >
                Hard 🔥
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <p>Drag objects on the left to their matching shadows on the right!</p>
          </div>
        </div>
      )}

      {/* Game Board */}
      {phase === "playing" && (
        <div className="max-w-4xl mx-auto">
          {/* Hint Button */}
          <div className="flex justify-center mb-4">
            <button
              onClick={useHint}
              disabled={hintUsed || score < 5}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                hintUsed || score < 5
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#FFE66D] hover:bg-yellow-400 text-[#2C3E50]"
              }`}
            >
              💡 Hint (-5 points)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Objects Column */}
            <div className="bg-white/50 rounded-2xl p-4">
              <h2 className="text-xl font-bold text-center mb-4 text-[#2C3E50]">Objects</h2>
              <div className="space-y-4">
                {objects.filter(o => !o.matched).map((obj) => (
                  <div
                    key={obj.id}
                    draggable
                    onDragStart={() => setDraggedObject(obj.id)}
                    className={`
                      bg-white rounded-xl p-4 flex items-center justify-center
                      shadow-lg cursor-grab active:cursor-grabbing
                      hover:scale-105 transition-all border-4 border-transparent
                      hover:border-[#4ECDC4]
                      ${draggedObject === obj.id ? "opacity-50 scale-95" : ""}
                      ${hintUsed && !obj.matched ? "ring-4 ring-[#FFE66D]" : ""}
                    `}
                    style={{ transform: `rotate(${obj.rotation}deg)` }}
                  >
                    {renderIcon(obj.svg, 64, "#4ECDC4")}
                  </div>
                ))}
              </div>
            </div>

            {/* Shadows Column */}
            <div className="bg-white/50 rounded-2xl p-4">
              <h2 className="text-xl font-bold text-center mb-4 text-[#2C3E50]">Shadows</h2>
              <div className="space-y-4">
                {shadows.filter(s => !s.matched).map((shadow) => {
                  const obj = objects.find(o => o.id === shadow.id);
                  if (!obj) return null;
                  
                  return (
                    <div
                      key={shadow.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedObject !== null) {
                          handleMatch(draggedObject, shadow.id);
                        }
                      }}
                      className={`
                        bg-gray-100 rounded-xl p-4 flex items-center justify-center
                        border-4 border-dashed border-gray-300
                        transition-all
                        ${draggedObject !== null ? "hover:border-[#4ECDC4] hover:bg-gray-50" : ""}
                      `}
                      style={{ transform: `rotate(${obj.rotation}deg)` }}
                    >
                      {renderIcon(obj.svg, 64, "#333", true)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Matched Objects Display */}
          <div className="mt-6 text-center">
            <p className="text-lg font-bold text-[#2C3E50]">
              Matched: {objects.filter(o => o.matched).length} / {objects.length}
            </p>
          </div>
        </div>
      )}

      {/* Round Complete */}
      {phase === "roundComplete" && (
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-xl text-center">
          <h2 className="text-3xl font-black text-[#4ECDC4] mb-4">🎉 Round Complete!</h2>
          <p className="text-xl text-gray-700 mb-2">Level {level} cleared!</p>
          <p className="text-2xl font-bold text-[#FFD700] mb-6">Score: {score}</p>
          
          <button
            onClick={nextRound}
            className="w-full px-6 py-3 bg-[#4ECDC4] hover:bg-[#3DBDB5] text-white font-bold rounded-xl transition-all"
          >
            Next Level ▶
          </button>
        </div>
      )}

      {/* Game Over */}
      {phase === "gameOver" && (
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-xl text-center">
          <h2 className="text-3xl font-black text-[#FF6B6B] mb-4">⏰ Time&apos;s Up!</h2>
          
          <div className="my-6 space-y-2">
            <p className="text-2xl font-bold text-gray-700">
              Score: <span className="text-[#4ECDC4]">{score}</span>
            </p>
            <p className="text-lg text-gray-600">
              Accuracy: <span className="font-bold">{totalAttempts > 0 ? Math.round((correctMatches / totalAttempts) * 100) : 0}%</span>
            </p>
            <p className="text-lg text-gray-600">
              Levels Completed: <span className="font-bold">{level - 1}</span>
            </p>
            {score >= highScore && score > 0 && (
              <p className="text-xl font-bold text-[#FFD700]">🏆 New High Score! 🏆</p>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => startGame(difficulty)}
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
      )}
    </main>
  );
}
