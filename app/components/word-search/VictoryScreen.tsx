"use client";

interface VictoryScreenProps {
  onPlayAgain: () => void;
  onNewGame: () => void;
}

export function VictoryScreen({ onPlayAgain, onNewGame }: VictoryScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#FFE66D]/30 to-[#4ECDC4]/30">
      {/* Confetti */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            {["🎉", "⭐", "✨", "🌟", "🎊"][Math.floor(Math.random() * 5)]}
          </div>
        ))}
      </div>

      {/* Victory Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center relative z-10 animate-bounce-in">
        {/* Trophy */}
        <div className="text-6xl md:text-8xl mb-4 animate-float">🏆</div>
        
        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-black text-gradient mb-4">
          YOU DID IT!
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl text-[#2C3E50]/70 mb-8">
          🎉 Amazing work! You found all the words! 🎉
        </p>
        
        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onPlayAgain}
            className="flex-1 bg-[#4ECDC4] hover:bg-[#3dbdb5] text-white text-xl font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            Play Again! 🔄
          </button>
          <button
            onClick={onNewGame}
            className="flex-1 bg-[#FF6B6B] hover:bg-[#ff5252] text-white text-xl font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            New Game 🎮
          </button>
        </div>
      </div>

      {/* Stars */}
      <div className="mt-8 flex gap-4 text-4xl">
        <span className="animate-pulse-slow">⭐</span>
        <span className="animate-pulse-slow delay-100">🌟</span>
        <span className="animate-pulse-slow delay-200">⭐</span>
      </div>
    </div>
  );
}
