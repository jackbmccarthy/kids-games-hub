"use client";

interface CongratsOverlayProps {
  word: string;
}

export function CongratsOverlay({ word }: CongratsOverlayProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 animate-fade-in" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 animate-slide-up max-w-sm mx-4">
        {/* Stars */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-4xl animate-bounce">
          ⭐✨⭐
        </div>
        
        {/* Content */}
        <div className="text-center pt-4">
          <h2 className="text-2xl md:text-3xl font-black text-[#FF6B6B] mb-2">
            🎉 Great Job! 🎉
          </h2>
          <p className="text-lg text-[#2C3E50]/70 mb-3">
            You found
          </p>
          <p className="text-3xl md:text-4xl font-black text-gradient mb-4">
            {word}
          </p>
        </div>
        
        {/* Bottom Stars */}
        <div className="flex justify-center gap-2 text-2xl">
          <span className="animate-pulse">🌟</span>
          <span className="animate-pulse delay-100">⭐</span>
          <span className="animate-pulse delay-200">✨</span>
        </div>
      </div>
    </div>
  );
}
