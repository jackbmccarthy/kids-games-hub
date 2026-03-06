"use client";

import Link from "next/link";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Back Link */}
      <Link 
        href="/"
        className="absolute top-4 left-4 text-[#2C3E50]/60 hover:text-[#2C3E50] font-semibold flex items-center gap-2 transition-colors"
      >
        ← Back to Games
      </Link>

      {/* Icon */}
      <div className="w-32 h-32 md:w-40 md:h-40 mb-6 animate-bounce-in">
        <WordSearchIcon />
      </div>

      {/* Title */}
      <h1 className="text-4xl md:text-6xl font-black text-[#FF6B6B] mb-4 animate-bounce-in text-center">
        🔤 Word Search 🔤
      </h1>

      {/* Description */}
      <p className="text-lg md:text-xl text-[#2C3E50]/70 text-center max-w-md mb-8 animate-bounce-in">
        Find hidden words in a colorful grid! Pick your grade and start exploring!
      </p>

      {/* Play Button */}
      <button
        onClick={onStart}
        className="bg-[#FF6B6B] hover:bg-[#ff5252] text-white text-2xl md:text-3xl font-bold py-4 px-12 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
      >
        Play Now! 🎉
      </button>

      {/* Grade Preview */}
      <div className="mt-12 flex flex-wrap gap-2 justify-center">
        {["K", "1st", "2nd", "3rd", "4th", "5th"].map((grade) => (
          <span 
            key={grade}
            className="bg-[#4ECDC4]/20 text-[#2C3E50] px-3 py-1 rounded-full text-sm font-semibold"
          >
            {grade}
          </span>
        ))}
      </div>
    </div>
  );
}

function WordSearchIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Grid background */}
      <rect x="5" y="5" width="90" height="90" rx="12" fill="#ffffff" stroke="#FF6B6B" strokeWidth="4" />
      
      {/* Letter grid - Larger letters */}
      <text x="20" y="35" fontSize="20" fontWeight="bold" fill="#333">C</text>
      <text x="45" y="35" fontSize="20" fontWeight="bold" fill="#333">A</text>
      <text x="70" y="35" fontSize="20" fontWeight="bold" fill="#FF6B6B">T</text>
      
      <text x="20" y="60" fontSize="20" fontWeight="bold" fill="#333">D</text>
      <text x="45" y="60" fontSize="20" fontWeight="bold" fill="#FF6B6B">O</text>
      <text x="70" y="60" fontSize="20" fontWeight="bold" fill="#333">G</text>
      
      <text x="20" y="85" fontSize="20" fontWeight="bold" fill="#FF6B6B">F</text>
      <text x="45" y="85" fontSize="20" fontWeight="bold" fill="#FF6B6B">I</text>
      <text x="70" y="85" fontSize="20" fontWeight="bold" fill="#FF6B6B">S</text>
      
      {/* Magnifying glass */}
      <circle cx="80" cy="20" r="16" fill="none" stroke="#4ECDC4" strokeWidth="4" />
      <line x1="92" y1="32" x2="98" y2="38" stroke="#4ECDC4" strokeWidth="4" strokeLinecap="round" />
      
      {/* Stars */}
      <text x="15" y="20" fontSize="14">⭐</text>
      <text x="85" y="50" fontSize="14">✨</text>
    </svg>
  );
}
