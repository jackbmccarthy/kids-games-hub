"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const ALL_GAMES = [
  // Puzzle
  { id: "word-search", title: "Word Search", emoji: "🔤", category: "Puzzle", age: "5+", desc: "Find hidden words!" },
  { id: "word-snake", title: "Word Snake", emoji: "🐍", category: "Puzzle", age: "5+", desc: "Connect letters!" },
  { id: "shadow-match", title: "Shadow Match", emoji: "👤", category: "Puzzle", age: "3+", desc: "Match shadows!" },
  { id: "memory-mural", title: "Memory Mural", emoji: "🖼️", category: "Puzzle", age: "4+", desc: "Find matching pairs!" },
  { id: "emoji-match", title: "Emoji Match", emoji: "🎴", category: "Puzzle", age: "4+", desc: "Match emoji!" },
  { id: "connect-the-dots", title: "Connect Dots", emoji: "🔢", category: "Puzzle", age: "3+", desc: "Connect numbers!" },
  { id: "pattern-repeat", title: "Pattern Repeat", emoji: "🎵", category: "Puzzle", age: "4+", desc: "Repeat patterns!" },
  { id: "maze-runner", title: "Maze Runner", emoji: "🏃", category: "Puzzle", age: "5+", desc: "Solve mazes!" },
  { id: "jigsaw-jam", title: "Jigsaw Jam", emoji: "🧩", category: "Puzzle", age: "4+", desc: "Puzzle pieces!" },
  { id: "spot-the-difference", title: "Spot Difference", emoji: "👀", category: "Puzzle", age: "4+", desc: "Find differences!" },
  { id: "star-catcher", title: "Star Catcher", emoji: "⭐", category: "Puzzle", age: "4+", desc: "Connect stars!" },
  { id: "puzzle-slider", title: "Puzzle Slider", emoji: "🧊", category: "Puzzle", age: "5+", desc: "Slide tiles!" },
  { id: "slide-puzzle", title: "Slide Puzzle", emoji: "🔄", category: "Puzzle", age: "5+", desc: "Classic slider!" },
  { id: "domino-chain", title: "Domino Chain", emoji: "🁃", category: "Puzzle", age: "4+", desc: "Chain dominoes!" },

  // Arcade
  { id: "bubble-pop-chain", title: "Bubble Pop", emoji: "🫧", category: "Arcade", age: "4+", desc: "Pop bubbles!" },
  { id: "dino-jump", title: "Dino Jump", emoji: "🦖", category: "Arcade", age: "4+", desc: "Jump obstacles!" },
  { id: "whack-a-mole", title: "Whack-a-Mole", emoji: "🔨", category: "Arcade", age: "3+", desc: "Tap the moles!" },
  { id: "catch-the-rain", title: "Catch Rain", emoji: "🌧️", category: "Arcade", age: "4+", desc: "Catch raindrops!" },
  { id: "fishing-frenzy", title: "Fishing Frenzy", emoji: "🎣", category: "Arcade", age: "4+", desc: "Catch fish!" },
  { id: "shape-sorter", title: "Shape Sorter", emoji: "🔷", category: "Arcade", age: "3+", desc: "Sort shapes!" },
  { id: "balloon-pop", title: "Balloon Pop", emoji: "🎈", category: "Arcade", age: "3+", desc: "Pop balloons!" },
  { id: "fruit-slice", title: "Fruit Slice", emoji: "🍉", category: "Arcade", age: "4+", desc: "Slice fruit!" },
  { id: "drop-stack", title: "Drop Stack", emoji: "📦", category: "Arcade", age: "5+", desc: "Stack blocks!" },
  { id: "balloon-keepy-up", title: "Keepy Up", emoji: "🎈", category: "Arcade", age: "4+", desc: "Keep balloons up!" },
  { id: "reaction-time", title: "Reaction Time", emoji: "⚡", category: "Arcade", age: "5+", desc: "Test speed!" },
  { id: "build-a-tower", title: "Build Tower", emoji: "🏗️", category: "Arcade", age: "5+", desc: "Stack high!" },
  { id: "potato-sack-race", title: "Sack Race", emoji: "🏃", category: "Arcade", age: "4+", desc: "Race to win!" },
  { id: "lava-jump", title: "Lava Jump", emoji: "🌋", category: "Arcade", age: "5+", desc: "Jump over lava!" },
  { id: "button-mash", title: "Button Mash", emoji: "🔴", category: "Arcade", age: "4+", desc: "Tap fast!" },
  { id: "cup-stack", title: "Cup Stack", emoji: "🥤", category: "Arcade", age: "4+", desc: "Stack cups!" },
  { id: "coin-collector", title: "Coin Collector", emoji: "🪙", category: "Arcade", age: "4+", desc: "Collect coins!" },

  // Creative
  { id: "splat-paint", title: "Splat Paint", emoji: "🎨", category: "Creative", age: "3+", desc: "Paint splatter!" },
  { id: "mirror-draw", title: "Mirror Draw", emoji: "🪞", category: "Creative", age: "4+", desc: "Symmetrical art!" },
  { id: "color-mix-lab", title: "Color Mix", emoji: "🧪", category: "Creative", age: "4+", desc: "Mix colors!" },
  { id: "coloring-book", title: "Coloring Book", emoji: "📖", category: "Creative", age: "3+", desc: "Color pictures!" },
  { id: "sticker-scene", title: "Sticker Scene", emoji: "🌟", category: "Creative", age: "3+", desc: "Sticker art!" },
  { id: "bubble-wand", title: "Bubble Wand", emoji: "🫧", category: "Creative", age: "3+", desc: "Bubble art!" },
  { id: "face-maker", title: "Face Maker", emoji: "😊", category: "Creative", age: "3+", desc: "Make faces!" },
  { id: "color-sort", title: "Color Sort", emoji: "🌈", category: "Creative", age: "3+", desc: "Sort colors!" },

  // Educational
  { id: "pokemon-kana-speller", title: "Pokémon Kana", emoji: "⚡", category: "Educational", age: "6+", desc: "Learn Japanese!" },
  { id: "number-bubbles", title: "Number Bubbles", emoji: "🔢", category: "Educational", age: "3+", desc: "Pop numbers!" },
  { id: "piano-keys", title: "Piano Keys", emoji: "🎹", category: "Educational", age: "4+", desc: "Play piano!" },
  { id: "constellation-connect", title: "Constellations", emoji: "⭐", category: "Educational", age: "5+", desc: "Connect stars!" },
  { id: "letter-pop", title: "Letter Pop", emoji: "🔤", category: "Educational", age: "4+", desc: "Pop letters!" },
  { id: "pattern-builder", title: "Pattern Builder", emoji: "🔷", category: "Educational", age: "4+", desc: "Build patterns!" },
  { id: "clock-learn", title: "Clock Learn", emoji: "🕐", category: "Educational", age: "5+", desc: "Tell time!" },
  { id: "clock-time", title: "Clock Time", emoji: "⏰", category: "Educational", age: "5+", desc: "Set the clock!" },
  { id: "money-match", title: "Money Match", emoji: "💰", category: "Educational", age: "5+", desc: "Count coins!" },
  { id: "food-groups", title: "Food Groups", emoji: "🥗", category: "Educational", age: "4+", desc: "Sort foods!" },
  { id: "animal-sounds", title: "Animal Sounds", emoji: "🐄", category: "Educational", age: "3+", desc: "Match sounds!" },
  { id: "rhyme-time", title: "Rhyme Time", emoji: "🎤", category: "Educational", age: "4+", desc: "Match rhymes!" },
  { id: "opposites", title: "Opposites", emoji: "↔️", category: "Educational", age: "4+", desc: "Match opposites!" },
  { id: "alphabet-train", title: "ABC Train", emoji: "🚂", category: "Educational", age: "4+", desc: "Letter order!" },
  { id: "alphabet-trace", title: "ABC Trace", emoji: "✏️", category: "Educational", age: "3+", desc: "Trace letters!" },
  { id: "counting-sheep", title: "Count Sheep", emoji: "🐑", category: "Educational", age: "3+", desc: "Count sheep!" },
  { id: "balloon-pop-math", title: "Balloon Math", emoji: "🧮", category: "Educational", age: "5+", desc: "Pop answers!" },
  { id: "dice-roll", title: "Dice Roll", emoji: "🎲", category: "Educational", age: "4+", desc: "Roll dice!" },
  { id: "bead-pattern", title: "Bead Pattern", emoji: "📿", category: "Educational", age: "4+", desc: "Bead patterns!" },
  { id: "feed-the-monster", title: "Feed Monster", emoji: "👹", category: "Educational", age: "3+", desc: "Feed the monster!" },

  // Adventure
  { id: "rocket-launch", title: "Rocket Launch", emoji: "🚀", category: "Adventure", age: "5+", desc: "Space adventure!" },
  { id: "snowball-fight", title: "Snowball Fight", emoji: "❄️", category: "Adventure", age: "4+", desc: "Throw snowballs!" },
  { id: "train-tracks", title: "Train Tracks", emoji: "🚂", category: "Adventure", age: "4+", desc: "Lay track!" },
  { id: "train-track", title: "Train Track", emoji: "🛤️", category: "Adventure", age: "4+", desc: "Build tracks!" },
  { id: "treasure-hunt", title: "Treasure Hunt", emoji: "🏴‍☠️", category: "Adventure", age: "4+", desc: "Find treasure!" },
  { id: "cloud-jump", title: "Cloud Jump", emoji: "☁️", category: "Adventure", age: "4+", desc: "Jump clouds!" },
  { id: "treasure-map", title: "Treasure Map", emoji: "🗺️", category: "Adventure", age: "4+", desc: "Follow map!" },
  { id: "zoo-escape", title: "Zoo Escape", emoji: "🦁", category: "Adventure", age: "4+", desc: "Help animals!" },
  { id: "time-travel", title: "Time Travel", emoji: "⏳", category: "Adventure", age: "5+", desc: "Travel time!" },

  // Nature
  { id: "bug-garden", title: "Bug Garden", emoji: "🦋", category: "Nature", age: "4+", desc: "Catch bugs!" },
  { id: "egg-catch", title: "Egg Catch", emoji: "🥚", category: "Nature", age: "4+", desc: "Catch eggs!" },
  { id: "petal-catch", title: "Petal Catch", emoji: "🌸", category: "Nature", age: "4+", desc: "Catch petals!" },
  { id: "garden-grow", title: "Garden Grow", emoji: "🌻", category: "Nature", age: "4+", desc: "Grow plants!" },
  { id: "catch-fireflies", title: "Fireflies", emoji: "✨", category: "Nature", age: "4+", desc: "Catch fireflies!" },
  { id: "zoo-keeper", title: "Zoo Keeper", emoji: "🦁", category: "Nature", age: "4+", desc: "Match habitats!" },
  { id: "flower-bloom", title: "Flower Bloom", emoji: "🌺", category: "Nature", age: "4+", desc: "Bloom flowers!" },
  { id: "plant-seeds", title: "Plant Seeds", emoji: "🌱", category: "Nature", age: "4+", desc: "Plant seeds!" },
  { id: "food-chain", title: "Food Chain", emoji: "🔗", category: "Nature", age: "5+", desc: "Food chains!" },

  // Physics
  { id: "gravity-draw", title: "Gravity Draw", emoji: "⚽", category: "Physics", age: "5+", desc: "Draw platforms!" },
  { id: "rhythm-tiles", title: "Rhythm Tiles", emoji: "🎵", category: "Physics", age: "5+", desc: "Tap to beat!" },
  { id: "bounce-ball", title: "Bounce Ball", emoji: "🏀", category: "Physics", age: "4+", desc: "Keep bouncing!" },
  { id: "pinball-wizard", title: "Pinball", emoji: "🎱", category: "Physics", age: "5+", desc: "Play pinball!" },
  { id: "hopscotch", title: "Hopscotch", emoji: "🦶", category: "Physics", age: "4+", desc: "Jump squares!" },
  { id: "juice-squeeze", title: "Juice Squeeze", emoji: "🧃", category: "Physics", age: "4+", desc: "Squeeze juice!" },

  // Simulation
  { id: "weather-dress", title: "Weather Dress", emoji: "🌤️", category: "Simulation", age: "4+", desc: "Dress up!" },
  { id: "music-maker", title: "Music Maker", emoji: "🎵", category: "Simulation", age: "4+", desc: "Make music!" },
  { id: "traffic-light", title: "Traffic Light", emoji: "🚦", category: "Simulation", age: "4+", desc: "Stop and go!" },
  { id: "pet-vet", title: "Pet Vet", emoji: "🐕", category: "Simulation", age: "4+", desc: "Care for pets!" },
  { id: "karaoke-kids", title: "Karaoke", emoji: "🎤", category: "Simulation", age: "4+", desc: "Sing along!" },
  { id: "symphony-conductor", title: "Symphony", emoji: "🎼", category: "Simulation", age: "5+", desc: "Conduct music!" },
  { id: "drum-beat", title: "Drum Beat", emoji: "🥁", category: "Simulation", age: "4+", desc: "Play drums!" },

  // Matching
  { id: "sound-match", title: "Sound Match", emoji: "🔊", category: "Matching", age: "4+", desc: "Match sounds!" },
  { id: "spin-and-match", title: "Spin Match", emoji: "🎰", category: "Matching", age: "4+", desc: "Spin to match!" },
  { id: "pop-the-lock", title: "Pop the Lock", emoji: "🔓", category: "Matching", age: "5+", desc: "Timing game!" },
  { id: "ant-trail", title: "Ant Trail", emoji: "🐜", category: "Matching", age: "4+", desc: "Guide ants!" },
  { id: "bubble-bath", title: "Bubble Bath", emoji: "🛁", category: "Matching", age: "3+", desc: "Bath bubbles!" },

  // Skill
  { id: "race-the-timer", title: "Race Timer", emoji: "⏱️", category: "Skill", age: "5+", desc: "Beat clock!" },
  { id: "gear-spin", title: "Gear Spin", emoji: "⚙️", category: "Skill", age: "5+", desc: "Connect gears!" },
  { id: "shadow-puppets", title: "Shadow Puppets", emoji: "🕊️", category: "Skill", age: "4+", desc: "Hand shadows!" },
  { id: "piano-tiles-drop", title: "Piano Tiles", emoji: "🎹", category: "Skill", age: "5+", desc: "Catch tiles!" },
];

const CATEGORIES = ["All", "Puzzle", "Arcade", "Creative", "Educational", "Adventure", "Nature", "Physics", "Simulation", "Matching", "Skill"];

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    return ALL_GAMES.filter(g => {
      const matchSearch = g.title.toLowerCase().includes(search.toLowerCase()) ||
                          g.desc.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All" || g.category === category;
      return matchSearch && matchCat;
    });
  }, [search, category]);

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = { All: ALL_GAMES.length };
    ALL_GAMES.forEach(g => {
      counts[g.category] = (counts[g.category] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <h1 className="text-2xl md:text-3xl font-black text-center mb-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
            🎮 Kids Games Hub — {ALL_GAMES.length} Games!
          </h1>
          
          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">🔍</span>
            <input
              type="text"
              placeholder="Search games... try pokemon or puzzle"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:outline-none text-base bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  category === cat
                    ? "bg-purple-500 text-white shadow"
                    : "bg-white text-gray-600 hover:bg-purple-100 border border-purple-200"
                }`}
              >
                {cat} <span className="opacity-60">({catCounts[cat] || 0})</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Results count */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        <p className="text-center text-sm text-gray-500">
          Showing {filtered.length} game{filtered.length !== 1 ? "s" : ""}
          {search && ` matching "${search}"`}
          {category !== "All" && ` in ${category}`}
        </p>
      </div>

      {/* Games Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
          {filtered.map(game => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="group"
            >
              <div className="bg-white rounded-xl p-2.5 shadow hover:shadow-lg transition-all hover:scale-105 border-2 border-transparent hover:border-purple-400 h-full flex flex-col items-center text-center">
                <span className="text-3xl group-hover:scale-110 transition-transform">
                  {game.emoji}
                </span>
                <h3 className="font-bold text-xs mt-1 text-gray-800 leading-tight line-clamp-2">
                  {game.title}
                </h3>
                <div className="flex items-center gap-1 mt-auto pt-1">
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                    {game.age}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {game.category}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <h2 className="text-xl font-bold text-gray-600">No games found</h2>
            <p className="text-gray-500 mt-1">Try a different search term</p>
            <button
              onClick={() => { setSearch(""); setCategory("All"); }}
              className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg font-bold"
            >
              Show All Games
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>🌟 {ALL_GAMES.length} fun games for kids! 🌟</p>
      </footer>
    </main>
  );
}
