import Link from "next/link";
import { GameCard } from "./components/GameCard";

const games = [
  {
    id: "bubble-pop-chain",
    title: "Bubble Pop Chain",
    description: "Pop bubbles and create amazing chain reactions!",
    color: "#4ECDC4",
    ageRange: "4+",
  },
  {
    id: "shadow-match",
    title: "Shadow Match",
    description: "Match objects to their shadows!",
    color: "#9B59B6",
    ageRange: "3+",
  },
  {
    id: "color-mix-lab",
    title: "Color Mix Lab",
    description: "Mix colors and learn color theory!",
    color: "#FF9800",
    ageRange: "4+",
  },
  {
    id: "rhythm-tiles",
    title: "Rhythm Tiles",
    description: "Tap tiles to the beat!",
    color: "#E91E63",
    ageRange: "5+",
  },
  {
    id: "gravity-draw",
    title: "Gravity Draw",
    description: "Draw platforms to guide the ball!",
    color: "#2196F3",
    ageRange: "5+",
  },
  {
    id: "pattern-repeat",
    title: "Pattern Repeat",
    description: "Watch and repeat the pattern!",
    color: "#9C27B0",
    ageRange: "4+",
  },
  {
    id: "word-snake",
    title: "Word Snake",
    description: "Connect letters to form words!",
    color: "#4CAF50",
    ageRange: "5+",
  },
  {
    id: "word-search",
    title: "Word Search",
    description: "Find hidden words in a colorful grid!",
    color: "#FF6B6B",
    ageRange: "5-11",
  },
  // Future games will be added here
];

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-[#F7FFF7] to-[#E8FFF8]">
      {/* Header */}
      <header className="text-center mb-8 md:mb-12 animate-bounce-in">
        <h1 className="text-4xl md:text-6xl font-black text-gradient mb-2">
          🎮 Kids Games Hub 🎨
        </h1>
        <p className="text-lg md:text-2xl text-[#2C3E50]/80 font-semibold">
          Fun games for awesome kids!
        </p>
      </header>

      {/* Games Grid */}
      <section className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="block focus:outline-none focus:ring-4 focus:ring-[#4ECDC4]/50 rounded-2xl"
            >
              <GameCard game={game} />
            </Link>
          ))}
          
          {/* Coming Soon Card */}
          <div className="bg-white/50 border-4 border-dashed border-[#4ECDC4]/30 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[280px]">
            <div className="text-6xl mb-4 animate-float">🎲</div>
            <h3 className="text-xl font-bold text-[#2C3E50]/60">More Games Coming!</h3>
            <p className="text-[#2C3E50]/40 text-center mt-2">Stay tuned for more fun!</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center mt-12 py-8 text-[#2C3E50]/60 font-semibold">
        <p>🌟 Made with love for kids everywhere 🌟</p>
      </footer>
    </main>
  );
}
