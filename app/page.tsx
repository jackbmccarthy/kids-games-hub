"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const ALL_GAMES = [
  // Puzzle
  { id: "word-search", title: "Word Search", emoji: "🔤", category: "Puzzle", color: "#FF6B6B", ageRange: "5+", description: "Find hidden words in a colorful grid!" },
  { id: "word-snake", title: "Word Snake", emoji: "🐍", category: "Puzzle", color: "#4CAF50", ageRange: "5+", description: "Connect letters to form words!" },
  { id: "shadow-match", title: "Shadow Match", emoji: "👤", category: "Puzzle", color: "#9B59B6", ageRange: "3+", description: "Match objects to their shadows!" },
  { id: "memory-mural", title: "Memory Mural", emoji: "🖼️", category: "Puzzle", color: "#3F51B5", ageRange: "4+", description: "Find matching picture pairs!" },
  { id: "emoji-match", title: "Emoji Match", emoji: "🎴", category: "Puzzle", color: "#E91E63", ageRange: "4+", description: "Match emoji pairs!" },
  { id: "connect-the-dots", title: "Connect the Dots", emoji: "🔢", category: "Puzzle", color: "#FF9800", ageRange: "3+", description: "Connect numbers to reveal pictures!" },
  { id: "pattern-repeat", title: "Pattern Repeat", emoji: "🎵", category: "Puzzle", color: "#9C27B0", ageRange: "4+", description: "Watch and repeat the pattern!" },
  { id: "maze-runner", title: "Maze Runner", emoji: "🏃", category: "Puzzle", color: "#607D8B", ageRange: "5+", description: "Navigate through mazes!" },
  { id: "jigsaw-jam", title: "Jigsaw Jam", emoji: "🧩", category: "Puzzle", color: "#795548", ageRange: "4+", description: "Drag puzzle pieces to complete pictures!" },
  { id: "spot-the-difference", title: "Spot the Difference", emoji: "👀", category: "Puzzle", color: "#00BCD4", ageRange: "4+", description: "Find what's different!" },
  { id: "star-catcher", title: "Star Catcher", emoji: "⭐", category: "Puzzle", color: "#FFC107", ageRange: "4+", description: "Connect stars to form shapes!" },
  { id: "puzzle-slider", title: "Puzzle Slider", emoji: "🧊", category: "Puzzle", color: "#00ACC1", ageRange: "5+", description: "Slide tiles to solve the puzzle!" },
  { id: "slide-puzzle", title: "Slide Puzzle", emoji: "🔄", category: "Puzzle", color: "#26A69A", ageRange: "5+", description: "Classic sliding puzzle game!" },
  { id: "domino-chain", title: "Domino Chain", emoji: "🁃", category: "Puzzle", color: "#5D4037", ageRange: "4+", description: "Match and chain dominoes!" },

  // Arcade
  { id: "bubble-pop-chain", title: "Bubble Pop Chain", emoji: "🫧", category: "Arcade", color: "#4ECDC4", ageRange: "4+", description: "Pop bubbles and create chain reactions!" },
  { id: "dino-jump", title: "Dino Jump", emoji: "🦖", category: "Arcade", color: "#4CAF50", ageRange: "4+", description: "Jump over obstacles!" },
  { id: "whack-a-mole", title: "Whack-a-Mole", emoji: "🔨", category: "Arcade", color: "#8D6E63", ageRange: "3+", description: "Tap the moles before they hide!" },
  { id: "catch-the-rain", title: "Catch the Rain", emoji: "🌧️", category: "Arcade", color: "#42A5F5", ageRange: "4+", description: "Catch raindrops in your bucket!" },
  { id: "fishing-frenzy", title: "Fishing Frenzy", emoji: "🎣", category: "Arcade", color: "#1976D2", ageRange: "4+", description: "Catch fish with your hook!" },
  { id: "shape-sorter", title: "Shape Sorter", emoji: "🔷", category: "Arcade", color: "#9C27B0", ageRange: "3+", description: "Drag shapes to matching holes!" },
  { id: "balloon-pop", title: "Balloon Pop", emoji: "🎈", category: "Arcade", color: "#F44336", ageRange: "3+", description: "Pop balloons for points!" },
  { id: "fruit-slice", title: "Fruit Slice", emoji: "🍉", category: "Arcade", color: "#FF5722", ageRange: "4+", description: "Swipe to slice falling fruit!" },
  { id: "drop-stack", title: "Drop Stack", emoji: "📦", category: "Arcade", color: "#673AB7", ageRange: "5+", description: "Stack blocks perfectly!" },
  { id: "balloon-keepy-up", title: "Balloon Keepy-Up", emoji: "🎈", category: "Arcade", color: "#E91E63", ageRange: "4+", description: "Keep balloons in the air!" },
  { id: "reaction-time", title: "Reaction Time", emoji: "⚡", category: "Arcade", color: "#FFEB3B", ageRange: "5+", description: "Test your reaction speed!" },
  { id: "build-a-tower", title: "Build a Tower", emoji: "🏗️", category: "Arcade", color: "#795548", ageRange: "5+", description: "Stack blocks to build tall towers!" },
  { id: "potato-sack-race", title: "Potato Sack Race", emoji: "🏃", category: "Arcade", color: "#8BC34A", ageRange: "4+", description: "Race to the finish!" },
  { id: "lava-jump", title: "Lava Jump", emoji: "🌋", category: "Arcade", color: "#FF5722", ageRange: "5+", description: "Jump over the lava!" },
  { id: "button-mash", title: "Button Mash", emoji: "🔴", category: "Arcade", color: "#F44336", ageRange: "4+", description: "Tap as fast as you can!" },
  { id: "cup-stack", title: "Cup Stack", emoji: "🥤", category: "Arcade", color: "#2196F3", ageRange: "4+", description: "Stack cups quickly!" },
  { id: "coin-collector", title: "Coin Collector", emoji: "🪙", category: "Arcade", color: "#FFC107", ageRange: "4+", description: "Collect falling coins!" },

  // Creative
  { id: "splat-paint", title: "Splat Paint", emoji: "🎨", category: "Creative", color: "#E91E63", ageRange: "3+", description: "Throw paint to create art!" },
  { id: "mirror-draw", title: "Mirror Draw", emoji: "🪞", category: "Creative", color: "#9C27B0", ageRange: "4+", description: "Draw symmetrical art!" },
  { id: "color-mix-lab", title: "Color Mix Lab", emoji: "🧪", category: "Creative", color: "#FF9800", ageRange: "4+", description: "Mix colors and learn color theory!" },
  { id: "coloring-book", title: "Coloring Book", emoji: "📖", category: "Creative", color: "#4CAF50", ageRange: "3+", description: "Tap to color pictures!" },
  { id: "sticker-scene", title: "Sticker Scene", emoji: "🌟", category: "Creative", color: "#FFD54F", ageRange: "3+", description: "Create scenes with stickers!" },
  { id: "bubble-wand", title: "Bubble Wand", emoji: "🫧", category: "Creative", color: "#81D4FA", ageRange: "3+", description: "Wave to create bubble art!" },
  { id: "face-maker", title: "Face Maker", emoji: "😊", category: "Creative", color: "#FFAB91", ageRange: "3+", description: "Build funny faces!" },

  // Educational
  { id: "pokemon-kana-speller", title: "Pokémon Kana Speller", emoji: "⚡", category: "Educational", color: "#FFCB05", ageRange: "6+", description: "Learn Japanese by spelling Pokémon names!" },
  { id: "number-bubbles", title: "Number Bubbles", emoji: "🔢", category: "Educational", color: "#2196F3", ageRange: "3+", description: "Pop numbers in order!" },
  { id: "piano-keys", title: "Piano Keys", emoji: "🎹", category: "Educational", color: "#3F51B5", ageRange: "4+", description: "Play songs on the piano!" },
  { id: "constellation-connect", title: "Constellation Connect", emoji: "⭐", category: "Educational", color: "#1A237E", ageRange: "5+", description: "Connect stars to form constellations!" },
  { id: "letter-pop", title: "Letter Pop", emoji: "🔤", category: "Educational", color: "#E91E63", ageRange: "4+", description: "Pop balloons to spell words!" },
  { id: "pattern-builder", title: "Pattern Builder", emoji: "🔷", category: "Educational", color: "#00BCD4", ageRange: "4+", description: "Complete the patterns!" },
  { id: "clock-learn", title: "Clock Learn", emoji: "🕐", category: "Educational", color: "#607D8B", ageRange: "5+", description: "Learn to tell time!" },
  { id: "clock-time", title: "Clock Time", emoji: "⏰", category: "Educational", color: "#546E7A", ageRange: "5+", description: "Set the clock hands!" },
  { id: "money-match", title: "Money Match", emoji: "💰", category: "Educational", color: "#4CAF50", ageRange: "5+", description: "Count coins to match prices!" },
  { id: "food-groups", title: "Food Groups", emoji: "🥗", category: "Educational", color: "#8BC34A", ageRange: "4+", description: "Sort foods into categories!" },
  { id: "animal-sounds", title: "Animal Sounds", emoji: "🐄", category: "Educational", color: "#795548", ageRange: "3+", description: "Match animals to their sounds!" },
  { id: "rhyme-time", title: "Rhyme Time", emoji: "🎤", category: "Educational", color: "#9C27B0", ageRange: "4+", description: "Match rhyming words!" },
  { id: "opposites", title: "Opposites", emoji: "↔️", category: "Educational", color: "#FF5722", ageRange: "4+", description: "Match opposite words!" },
  { id: "alphabet-train", title: "Alphabet Train", emoji: "🚂", category: "Educational", color: "#F44336", ageRange: "4+", description: "Put letters in ABC order!" },
  { id: "alphabet-trace", title: "Alphabet Trace", emoji: "✏️", category: "Educational", color: "#2196F3", ageRange: "3+", description: "Trace the alphabet!" },
  { id: "counting-sheep", title: "Counting Sheep", emoji: "🐑", category: "Educational", color: "#90A4AE", ageRange: "3+", description: "Count sheep jumping over fence!" },
  { id: "balloon-pop-math", title: "Balloon Pop Math", emoji: "🧮", category: "Educational", color: "#673AB7", ageRange: "5+", description: "Pop the correct answer!" },
  { id: "dice-roll", title: "Dice Roll", emoji: "🎲", category: "Educational", color: "#FF7043", ageRange: "4+", description: "Learn to count with dice!" },
  { id: "bead-pattern", title: "Bead Pattern", emoji: "📿", category: "Educational", color: "#EC407A", ageRange: "4+", description: "Complete bead patterns!" },

  // Adventure
  { id: "rocket-launch", title: "Rocket Launch", emoji: "🚀", category: "Adventure", color: "#1A237E", ageRange: "5+", description: "Guide rocket through space!" },
  { id: "snowball-fight", title: "Snowball Fight", emoji: "❄️", category: "Adventure", color: "#81D4FA", ageRange: "4+", description: "Throw snowballs at targets!" },
  { id: "train-tracks", title: "Train Tracks", emoji: "🚂", category: "Adventure", color: "#795548", ageRange: "4+", description: "Lay track to guide the train!" },
  { id: "train-track", title: "Train Track", emoji: "🛤️", category: "Adventure", color: "#6D4C41", ageRange: "4+", description: "Build train tracks!" },
  { id: "treasure-hunt", title: "Treasure Hunt", emoji: "🏴‍☠️", category: "Adventure", color: "#FFC107", ageRange: "4+", description: "Follow clues to find treasure!" },
  { id: "cloud-jump", title: "Cloud Jump", emoji: "☁️", category: "Adventure", color: "#64B5F6", ageRange: "4+", description: "Jump between clouds!" },
  { id: "treasure-map", title: "Treasure Map", emoji: "🗺️", category: "Adventure", color: "#A1887F", ageRange: "4+", description: "Find hidden treasure!" },
  { id: "zoo-escape", title: "Zoo Escape", emoji: "🦁", category: "Adventure", color: "#FF9800", ageRange: "4+", description: "Help animals escape!" },
  { id: "time-travel", title: "Time Travel", emoji: "⏳", category: "Adventure", color: "#7E57C2", ageRange: "5+", description: "Travel through time!" },

  // Nature
  { id: "bug-garden", title: "Bug Garden", emoji: "🦋", category: "Nature", color: "#4CAF50", ageRange: "4+", description: "Catch bugs in the garden!" },
  { id: "egg-catch", title: "Egg Catch", emoji: "🥚", category: "Nature", color: "#FFECB3", ageRange: "4+", description: "Catch eggs from chickens!" },
  { id: "petal-catch", title: "Petal Catch", emoji: "🌸", category: "Nature", color: "#F48FB1", ageRange: "4+", description: "Catch falling flower petals!" },
  { id: "garden-grow", title: "Garden Grow", emoji: "🌻", category: "Nature", color: "#66BB6A", ageRange: "4+", description: "Water and grow plants!" },
  { id: "catch-fireflies", title: "Catch Fireflies", emoji: "✨", category: "Nature", color: "#FFF59D", ageRange: "4+", description: "Catch glowing fireflies!" },
  { id: "zoo-keeper", title: "Zoo Keeper", emoji: "🦁", category: "Nature", color: "#8D6E63", ageRange: "4+", description: "Match animals to habitats!" },
  { id: "flower-bloom", title: "Flower Bloom", emoji: "🌺", category: "Nature", color: "#F06292", ageRange: "4+", description: "Help flowers bloom!" },
  { id: "plant-seeds", title: "Plant Seeds", emoji: "🌱", category: "Nature", color: "#81C784", ageRange: "4+", description: "Plant and grow seeds!" },
  { id: "food-chain", title: "Food Chain", emoji: "🔗", category: "Nature", color: "#AED581", ageRange: "5+", description: "Learn about food chains!" },

  // Physics
  { id: "gravity-draw", title: "Gravity Draw", emoji: "⚽", category: "Physics", color: "#2196F3", ageRange: "5+", description: "Draw platforms to guide the ball!" },
  { id: "rhythm-tiles", title: "Rhythm Tiles", emoji: "🎵", category: "Physics", color: "#E91E63", ageRange: "5+", description: "Tap tiles to the beat!" },
  { id: "bounce-ball", title: "Bounce Ball", emoji: "🏀", category: "Physics", color: "#FF5722", ageRange: "4+", description: "Draw lines to keep ball bouncing!" },
  { id: "pinball-wizard", title: "Pinball Wizard", emoji: "🎱", category: "Physics", color: "#9C27B0", ageRange: "5+", description: "Play pinball!" },
  { id: "hopscotch", title: "Hopscotch", emoji: "🦶", category: "Physics", color: "#4CAF50", ageRange: "4+", description: "Jump through hopscotch!" },
  { id: "juice-squeeze", title: "Juice Squeeze", emoji: "🧃", category: "Physics", color: "#FF9800", ageRange: "4+", description: "Squeeze juice from fruits!" },

  // Simulation
  { id: "weather-dress", title: "Weather Dress", emoji: "🌤️", category: "Simulation", color: "#64B5F6", ageRange: "4+", description: "Dress for the weather!" },
  { id: "music-maker", title: "Music Maker", emoji: "🎵", category: "Simulation", color: "#9C27B0", ageRange: "4+", description: "Create music with instruments!" },
  { id: "traffic-light", title: "Traffic Light", emoji: "🚦", category: "Simulation", color: "#F44336", ageRange: "4+", description: "Stop and go with the lights!" },
  { id: "pet-vet", title: "Pet Vet", emoji: "🐕", category: "Simulation", color: "#8BC34A", ageRange: "4+", description: "Take care of pets!" },
  { id: "karaoke-kids", title: "Karaoke Kids", emoji: "🎤", category: "Simulation", color: "#E91E63", ageRange: "4+", description: "Sing along to songs!" },
  { id: "symphony-conductor", title: "Symphony Conductor", emoji: "🎼", category: "Simulation", color: "#3F51B5", ageRange: "5+", description: "Conduct the orchestra!" },
  { id: "drum-beat", title: "Drum Beat", emoji: "🥁", category: "Simulation", color: "#795548", ageRange: "4+", description: "Play the drums!" },

  // Matching
  { id: "sound-match", title: "Sound Match", emoji: "🔊", category: "Matching", color: "#00BCD4", ageRange: "4+", description: "Match sounds to pictures!" },
  { id: "spin-and-match", title: "Spin and Match", emoji: "🎰", category: "Matching", color: "#9C27B0", ageRange: "4+", description: "Spin wheels to match symbols!" },
  { id: "pop-the-lock", title: "Pop the Lock", emoji: "🔓", category: "Matching", color: "#FFC107", ageRange: "5+", description: "Tap at the right moment!" },
  { id: "ant-trail", title: "Ant Trail", emoji: "🐜", category: "Matching", color: "#5D4037", ageRange: "4+", description: "Guide ants to food!" },
  { id: "bubble-bath", title: "Bubble Bath", emoji: "🛁", category: "Matching", color: "#81D4FA", ageRange: "3+", description: "Pop bubbles in the bath!" },

  // Skill
  { id: "race-the-timer", title: "Race the Timer", emoji: "⏱️", category: "Skill", color: "#FF5722", ageRange: "5+", description: "Beat the clock!" },
  { id: "gear-spin", title: "Gear Spin", emoji: "⚙️", category: "Skill", color: "#607D8B", ageRange: "5+", description: "Connect spinning gears!" },
  { id: "shadow-puppets", title: "Shadow Puppets", emoji: "🕊️", category: "Skill", color: "#37474F", ageRange: "4+", description: "Make shadow puppets!" },
  { id: "piano-tiles-drop", title: "Piano Tiles Drop", emoji: "🎹", category: "Skill", color: "#212121", ageRange: "5+", description: "Catch falling piano tiles!" },
];

const CATEGORIES = ["All", "Puzzle", "Arcade", "Creative", "Educational", "Adventure", "Nature", "Physics", "Simulation", "Matching", "Skill"];

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredGames = useMemo(() => {
    return ALL_GAMES.filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(search.toLowerCase()) ||
                           game.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "All" || game.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const gamesByCategory = useMemo(() => {
    if (selectedCategory !== "All") {
      return { [selectedCategory]: filteredGames };
    }
    const grouped: Record<string, typeof ALL_GAMES> = {};
    filteredGames.forEach(game => {
      if (!grouped[game.category]) grouped[game.category] = [];
      grouped[game.category].push(game);
    });
    return grouped;
  }, [filteredGames, selectedCategory]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F7FFF7] to-[#E8FFF8]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm shadow-md p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-black text-center mb-4 bg-gradient-to-r from-[#4ECDC4] via-[#FF6B6B] to-[#FFE66D] bg-clip-text text-transparent">
            🎮 Kids Games Hub 🎨
          </h1>
          
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
              <input
                type="text"
                placeholder="Search games..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[#4ECDC4]/30 focus:border-[#4ECDC4] focus:outline-none text-lg"
              />
            </div>
          </div>
          
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {CATEGORIES.map(cat => {
              const count = cat === "All" ? ALL_GAMES.length : ALL_GAMES.filter(g => g.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                    selectedCategory === cat
                      ? "bg-[#4ECDC4] text-white shadow-lg scale-105"
                      : "bg-white text-gray-600 hover:bg-[#4ECDC4]/20 border-2 border-[#4ECDC4]/30"
                  }`}
                >
                  {cat} <span className="opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Games */}
      <section className="max-w-6xl mx-auto p-4">
        <p className="text-center text-gray-600 mb-4 font-semibold">
          {filteredGames.length} game{filteredGames.length !== 1 ? "s" : ""} found
        </p>

        {Object.entries(gamesByCategory).map(([category, games]) => (
          <div key={category} className="mb-8">
            {selectedCategory === "All" && (
              <h2 className="text-2xl font-bold mb-4 text-gray-700 flex items-center gap-2">
                <span>{games[0]?.emoji || "🎮"}</span> {category}
                <span className="text-sm font-normal text-gray-400">({games.length})</span>
              </h2>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {games.map((game) => (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
                  className="group block"
                >
                  <div 
                    className="bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-[#4ECDC4] h-full flex flex-col"
                    style={{ borderTop: `4px solid ${game.color}` }}
                  >
                    <div className="text-4xl text-center mb-2 group-hover:scale-110 transition-transform">
                      {game.emoji}
                    </div>
                    <h3 className="font-bold text-sm text-center text-gray-800 leading-tight">
                      {game.title}
                    </h3>
                    <p className="text-xs text-gray-500 text-center mt-1 line-clamp-2">
                      {game.description}
                    </p>
                    <div className="mt-auto pt-2 flex justify-between items-center">
                      <span 
                        className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: game.color }}
                      >
                        {game.ageRange}
                      </span>
                      <span className="text-xs text-gray-400">{game.category}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {filteredGames.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-600">No games found</h2>
            <p className="text-gray-500 mt-2">Try a different search or category</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-600 font-semibold">
        <p>🌟 {ALL_GAMES.length} fun games for kids everywhere! 🌟</p>
      </footer>
    </main>
  );
}
