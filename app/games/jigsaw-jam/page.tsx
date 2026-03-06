"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type GamePhase = "menu" | "playing" | "complete";
type Difficulty = "easy" | "medium" | "hard";

interface PuzzlePiece {
  id: number;
  row: number;
  col: number;
  correctX: number;
  correctY: number;
  currentX: number;
  currentY: number;
  isPlaced: boolean;
  color: string;
  emoji: string;
}

interface PuzzleImage {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;
  pieces: { emoji: string; bg: string }[];
}

// Kid-friendly puzzle images - each has 6 pieces with different emojis/colors
const PUZZLE_IMAGES: PuzzleImage[] = [
  {
    id: "farm",
    name: "Farm Friends",
    emoji: "🏡",
    bgColor: "#90EE90",
    pieces: [
      { emoji: "🐮", bg: "#FFE4B5" },
      { emoji: "🐷", bg: "#FFB6C1" },
      { emoji: "🐔", bg: "#FFFACD" },
      { emoji: "🐴", bg: "#DEB887" },
      { emoji: "🐑", bg: "#F0F0F0" },
      { emoji: "🏡", bg: "#87CEEB" },
    ],
  },
  {
    id: "safari",
    name: "Safari Adventure",
    emoji: "🦁",
    bgColor: "#F4A460",
    pieces: [
      { emoji: "🦁", bg: "#FFD700" },
      { emoji: "🐘", bg: "#B0C4DE" },
      { emoji: "🦒", bg: "#FFA500" },
      { emoji: "🦓", bg: "#F5F5F5" },
      { emoji: "🦛", bg: "#808080" },
      { emoji: "🌴", bg: "#228B22" },
    ],
  },
  {
    id: "ocean",
    name: "Ocean World",
    emoji: "🐠",
    bgColor: "#40E0D0",
    pieces: [
      { emoji: "🐠", bg: "#FF6B6B" },
      { emoji: "🐙", bg: "#9370DB" },
      { emoji: "🦀", bg: "#FF4500" },
      { emoji: "🐙", bg: "#4169E1" },
      { emoji: "🐬", bg: "#00CED1" },
      { emoji: "🌊", bg: "#1E90FF" },
    ],
  },
  {
    id: "vehicles",
    name: "Things That Go!",
    emoji: "🚗",
    bgColor: "#87CEEB",
    pieces: [
      { emoji: "🚗", bg: "#FF4444" },
      { emoji: "🚌", bg: "#FFD700" },
      { emoji: "🚒", bg: "#FF0000" },
      { emoji: "🚁", bg: "#4169E1" },
      { emoji: "✈️", bg: "#ADD8E6" },
      { emoji: "🚀", bg: "#DC143C" },
    ],
  },
  {
    id: "dinos",
    name: "Dino Land",
    emoji: "🦕",
    bgColor: "#98FB98",
    pieces: [
      { emoji: "🦕", bg: "#90EE90" },
      { emoji: "🦖", bg: "#228B22" },
      { emoji: "🥚", bg: "#FFFACD" },
      { emoji: "🌴", bg: "#6B8E23" },
      { emoji: "🌋", bg: "#8B4513" },
      { emoji: "🦴", bg: "#F5DEB3" },
    ],
  },
  {
    id: "space",
    name: "Space Journey",
    emoji: "🚀",
    bgColor: "#191970",
    pieces: [
      { emoji: "🚀", bg: "#C0C0C0" },
      { emoji: "🌙", bg: "#FFFACD" },
      { emoji: "⭐", bg: "#FFD700" },
      { emoji: "🪐", bg: "#DEB887" },
      { emoji: "🛸", bg: "#9370DB" },
      { emoji: "🌍", bg: "#4169E1" },
    ],
  },
];

const DIFFICULTY_CONFIG: Record<Difficulty, { pieces: number; snapDistance: number }> = {
  easy: { pieces: 4, snapDistance: 80 },
  medium: { pieces: 6, snapDistance: 60 },
  hard: { pieces: 6, snapDistance: 40 },
};

export default function JigsawJamPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleImage | null>(null);
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [timer, setTimer] = useState(0);
  const [showTimer, setShowTimer] = useState(true);
  const [draggedPiece, setDraggedPiece] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [placedCount, setPlacedCount] = useState(0);
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; color: string; delay: number }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pieceSize = 90; // Size of each puzzle piece
  const pieceGap = 4;

  // Initialize puzzle pieces
  const initializePuzzle = useCallback((puzzle: PuzzleImage, diff: Difficulty) => {
    const config = DIFFICULTY_CONFIG[diff];
    const numPieces = config.pieces;
    
    // Calculate grid dimensions
    const cols = numPieces === 4 ? 2 : 3;
    const rows = numPieces === 4 ? 2 : 2;
    
    // Calculate puzzle area position (center of screen)
    const puzzleWidth = cols * (pieceSize + pieceGap);
    const puzzleHeight = rows * (pieceSize + pieceGap);
    const startX = (typeof window !== "undefined" ? window.innerWidth : 400) / 2 - puzzleWidth / 2;
    const startY = 180; // Below header

    const newPieces: PuzzlePiece[] = [];
    
    for (let i = 0; i < numPieces; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const correctX = startX + col * (pieceSize + pieceGap);
      const correctY = startY + row * (pieceSize + pieceGap);
      
      // Random scattered position around the screen edges
      const scatterX = 50 + Math.random() * ((typeof window !== "undefined" ? window.innerWidth : 400) - 150);
      const scatterY = startY + puzzleHeight + 20 + Math.random() * 150;
      
      newPieces.push({
        id: i,
        row,
        col,
        correctX,
        correctY,
        currentX: scatterX,
        currentY: scatterY,
        isPlaced: false,
        color: puzzle.pieces[i].bg,
        emoji: puzzle.pieces[i].emoji,
      });
    }
    
    // Shuffle pieces
    for (let i = newPieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tempX = newPieces[i].currentX;
      const tempY = newPieces[i].currentY;
      newPieces[i].currentX = newPieces[j].currentX;
      newPieces[i].currentY = newPieces[j].currentY;
      newPieces[j].currentX = tempX;
      newPieces[j].currentY = tempY;
    }
    
    setPieces(newPieces);
    setPlacedCount(0);
    setTimer(0);
    setCurrentPuzzle(puzzle);
    setPhase("playing");
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== "playing") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, pieceId: number) => {
    e.preventDefault();
    const piece = pieces.find(p => p.id === pieceId);
    if (!piece || piece.isPlaced) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    setDraggedPiece(pieceId);
    setDragOffset({
      x: clientX - piece.currentX,
      y: clientY - piece.currentY,
    });
  }, [pieces]);

  // Handle drag move
  useEffect(() => {
    if (draggedPiece === null) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      setPieces(prevPieces => prevPieces.map(p => {
        if (p.id !== draggedPiece) return p;
        return {
          ...p,
          currentX: clientX - dragOffset.x,
          currentY: clientY - dragOffset.y,
        };
      }));
    };

    const handleUp = () => {
      if (draggedPiece === null) return;

      const piece = pieces.find(p => p.id === draggedPiece);
      if (!piece) {
        setDraggedPiece(null);
        return;
      }

      const config = DIFFICULTY_CONFIG[difficulty];
      const distance = Math.sqrt(
        (piece.currentX - piece.correctX) ** 2 + 
        (piece.currentY - piece.correctY) ** 2
      );

      // Check if piece is close enough to snap
      if (distance < config.snapDistance) {
        // Snap to correct position
        setPieces(prevPieces => prevPieces.map(p => {
          if (p.id !== draggedPiece) return p;
          return {
            ...p,
            currentX: p.correctX,
            currentY: p.correctY,
            isPlaced: true,
          };
        }));
        setPlacedCount(c => c + 1);
        
        // Play snap sound effect (visual feedback instead)
        // We'll add a visual snap animation
      }

      setDraggedPiece(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, [draggedPiece, dragOffset, pieces, difficulty]);

  // Check for puzzle completion
  useEffect(() => {
    if (phase !== "playing") return;
    
    const config = DIFFICULTY_CONFIG[difficulty];
    if (placedCount === config.pieces) {
      // Puzzle complete!
      setTimeout(() => {
        setPhase("complete");
        generateConfetti();
      }, 500);
    }
  }, [placedCount, phase, difficulty]);

  // Generate confetti celebration
  const generateConfetti = useCallback(() => {
    const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181", "#B19CD9"];
    const newConfetti = [];
    
    for (let i = 0; i < 50; i++) {
      newConfetti.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2,
      });
    }
    
    setConfetti(newConfetti);
  }, []);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Pick random puzzle
  const startRandomPuzzle = useCallback((diff: Difficulty) => {
    const randomPuzzle = PUZZLE_IMAGES[Math.floor(Math.random() * PUZZLE_IMAGES.length)];
    initializePuzzle(randomPuzzle, diff);
  }, [initializePuzzle]);

  // Calculate progress percentage
  const config = DIFFICULTY_CONFIG[difficulty];
  const progress = config ? (placedCount / config.pieces) * 100 : 0;

  return (
    <main 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-b from-sky-200 via-purple-100 to-pink-200 relative overflow-hidden select-none"
    >
      {/* Confetti celebration */}
      {confetti.length > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
          {confetti.map(c => (
            <div
              key={c.id}
              className="absolute w-3 h-3 rounded-sm animate-confetti"
              style={{
                left: `${c.x}%`,
                backgroundColor: c.color,
                animationDelay: `${c.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      {phase === "playing" && currentPuzzle && (
        <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm shadow-lg z-40 p-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentPuzzle.emoji}</span>
              <span className="font-bold text-gray-700 text-sm md:text-base">{currentPuzzle.name}</span>
            </div>
            
            {/* Progress bar */}
            <div className="flex-1 mx-4 max-w-xs">
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300 flex items-center justify-end pr-2"
                  style={{ width: `${progress}%` }}
                >
                  {progress > 20 && (
                    <span className="text-xs font-bold text-white">{placedCount}/{config.pieces}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Timer toggle & display */}
            <button 
              onClick={() => setShowTimer(!showTimer)}
              className="flex items-center gap-1 bg-purple-100 px-3 py-1 rounded-full"
            >
              {showTimer ? (
                <>
                  <span className="text-lg">⏱️</span>
                  <span className="font-mono font-bold text-purple-700">{formatTime(timer)}</span>
                </>
              ) : (
                <span className="text-lg">⏱️</span>
              )}
            </button>
          </div>
        </header>
      )}

      {/* Menu */}
      {phase === "menu" && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center">
            <div className="text-5xl mb-2">🧩</div>
            <h1 className="text-3xl md:text-4xl font-black text-purple-600 mb-2">Jigsaw Jam!</h1>
            <p className="text-gray-600 mb-6">Drag the pieces to complete the picture!</p>

            {/* Puzzle preview */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {PUZZLE_IMAGES.slice(0, 6).map(puzzle => (
                <button
                  key={puzzle.id}
                  onClick={() => initializePuzzle(puzzle, difficulty)}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center text-3xl transition-transform hover:scale-105"
                  style={{ backgroundColor: puzzle.bgColor }}
                >
                  {puzzle.emoji}
                </button>
              ))}
            </div>

            {/* Difficulty selection */}
            <div className="mb-6">
              <p className="text-sm font-bold text-gray-500 mb-2">Difficulty:</p>
              <div className="flex gap-2 justify-center">
                {(["easy", "medium", "hard"] as Difficulty[]).map(diff => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`
                      px-4 py-2 rounded-xl font-bold transition-all
                      ${difficulty === diff 
                        ? "bg-purple-500 text-white shadow-lg scale-105" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"}
                    `}
                  >
                    {diff === "easy" && "😊 Easy"}
                    {diff === "medium" && "🤔 Medium"}
                    {diff === "hard" && "😤 Hard"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {difficulty === "easy" && "4 pieces • Easy snapping"}
                {difficulty === "medium" && "6 pieces • Normal snapping"}
                {difficulty === "hard" && "6 pieces • Precise placement"}
              </p>
            </div>

            {/* Random puzzle button */}
            <button
              onClick={() => startRandomPuzzle(difficulty)}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl text-xl transition-all shadow-lg"
            >
              🎲 Random Puzzle
            </button>

            {/* Instructions */}
            <div className="mt-6 text-sm text-gray-500 space-y-1">
              <p>👆 Drag pieces to their spots</p>
              <p>✨ Pieces snap when close!</p>
              <p>🎉 Complete the puzzle to win!</p>
            </div>
          </div>
        </div>
      )}

      {/* Playing */}
      {phase === "playing" && currentPuzzle && (
        <div className="pt-20 pb-4">
          {/* Puzzle target area */}
          <div className="relative mx-auto" style={{ width: "fit-content" }}>
            {/* Target slots */}
            {pieces.map(piece => (
              <div
                key={`slot-${piece.id}`}
                className="absolute rounded-2xl border-4 border-dashed border-gray-300 flex items-center justify-center"
                style={{
                  left: piece.correctX,
                  top: piece.correctY,
                  width: pieceSize,
                  height: pieceSize,
                  backgroundColor: piece.isPlaced ? "transparent" : "rgba(255,255,255,0.5)",
                  zIndex: 0,
                }}
              >
                {!piece.isPlaced && (
                  <span className="text-4xl opacity-30">{piece.emoji}</span>
                )}
              </div>
            ))}
          </div>

          {/* Draggable pieces */}
          {pieces.map(piece => (
            <div
              key={`piece-${piece.id}`}
              className={`
                absolute rounded-2xl flex items-center justify-center
                transition-shadow duration-200 touch-none
                ${piece.isPlaced 
                  ? "cursor-default shadow-inner" 
                  : "cursor-grab active:cursor-grabbing shadow-lg hover:shadow-xl"}
                ${draggedPiece === piece.id ? "z-50 scale-105 shadow-2xl" : "z-10"}
                ${piece.isPlaced ? "animate-snap" : ""}
              `}
              style={{
                left: piece.currentX,
                top: piece.currentY,
                width: pieceSize,
                height: pieceSize,
                backgroundColor: piece.color,
                border: piece.isPlaced ? "3px solid #22C55E" : "3px solid rgba(0,0,0,0.2)",
              }}
              onMouseDown={(e) => handleDragStart(e, piece.id)}
              onTouchStart={(e) => handleDragStart(e, piece.id)}
            >
              <span className="text-4xl select-none">{piece.emoji}</span>
              {piece.isPlaced && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}
            </div>
          ))}

          {/* Back button */}
          <button
            onClick={() => setPhase("menu")}
            className="fixed bottom-4 left-4 bg-white/90 hover:bg-white px-4 py-2 rounded-full shadow-lg font-bold text-gray-700 z-30"
          >
            ← Menu
          </button>

          {/* New puzzle button */}
          <button
            onClick={() => startRandomPuzzle(difficulty)}
            className="fixed bottom-4 right-4 bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-full shadow-lg font-bold text-white z-30"
          >
            🎲 New Puzzle
          </button>
        </div>
      )}

      {/* Complete celebration */}
      {phase === "complete" && currentPuzzle && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center animate-bounce-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
              Puzzle Complete!
            </h2>
            
            <div className="text-5xl my-4">
              {currentPuzzle.pieces.map((p, i) => (
                <span key={i}>{p.emoji}</span>
              ))}
            </div>

            <p className="text-xl text-gray-700 font-bold mb-2">{currentPuzzle.name}</p>
            
            {showTimer && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-2xl">⏱️</span>
                <span className="text-2xl font-mono font-bold text-purple-600">{formatTime(timer)}</span>
              </div>
            )}

            <div className="space-y-3 mt-6">
              <button
                onClick={() => startRandomPuzzle(difficulty)}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl text-xl transition-all shadow-lg"
              >
                🎲 Next Puzzle
              </button>
              <button
                onClick={() => initializePuzzle(currentPuzzle, difficulty)}
                className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all"
              >
                🏠 Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom animations */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-20vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(120vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes snap {
          0% { transform: scale(1.1); }
          50% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-confetti {
          animation: confetti 4s ease-out forwards;
        }
        
        .animate-snap {
          animation: snap 0.3s ease-out;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </main>
  );
}
