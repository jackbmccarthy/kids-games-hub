"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type FoodType = "fruit" | "veggie" | "sweet" | "meat";
type MonsterMood = "hungry" | "happy" | "sad";

interface Monster {
  id: number;
  name: string;
  favoriteFood: FoodType;
  mood: MonsterMood;
  emoji: string;
  color: string;
  x: number;
}

interface Food {
  id: number;
  type: FoodType;
  emoji: string;
  x: number;
  y: number;
  falling: boolean;
}

type GamePhase = "menu" | "playing" | "gameOver";

const FOOD_EMOJIS: Record<FoodType, string[]> = {
  fruit: ["🍎", "🍊", "🍇", "🍓", "🍌"],
  veggie: ["🥕", "🥦", "🌽", "🥒", "🍅"],
  sweet: ["🍩", "🍪", "🍬", "🍭", "🧁"],
  meat: ["🍖", "🍗", "🥩", "🌭", "🍔"],
};

const MONSTER_CONFIGS = [
  { name: "Chompy", emoji: "👹", color: "#FF6B6B", favoriteFood: "fruit" as FoodType },
  { name: "Veggie", emoji: "👾", color: "#4ECDC4", favoriteFood: "veggie" as FoodType },
  { name: "Sweetie", emoji: "👻", color: "#F472B6", favoriteFood: "sweet" as FoodType },
  { name: "Meatie", emoji: "🦖", color: "#A78BFA", favoriteFood: "meat" as FoodType },
];

export default function FeedTheMonsterPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [draggedFood, setDraggedFood] = useState<Food | null>(null);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize monsters
  const initMonsters = useCallback(() => {
    const positions = [15, 40, 65, 90];
    setMonsters(
      MONSTER_CONFIGS.map((config, idx) => ({
        ...config,
        id: idx,
        mood: "hungry" as MonsterMood,
        x: positions[idx],
      }))
    );
  }, []);

  // Create falling food
  const spawnFood = useCallback(() => {
    if (!gameAreaRef.current) return;
    
    const types: FoodType[] = ["fruit", "veggie", "sweet", "meat"];
    const type = types[Math.floor(Math.random() * types.length)];
    const emojis = FOOD_EMOJIS[type];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    const newFood: Food = {
      id: Date.now() + Math.random(),
      type,
      emoji,
      x: 10 + Math.random() * 80,
      y: -5,
      falling: true,
    };
    
    setFoods(prev => [...prev.slice(-20), newFood]); // Keep only last 20 foods
  }, []);

  // Game loop for falling food
  useEffect(() => {
    if (phase !== "playing") return;

    const fallInterval = setInterval(() => {
      setFoods(prev => 
        prev
          .map(food => ({
            ...food,
            y: food.falling ? food.y + 0.5 : food.y,
          }))
          .filter(food => food.y < 75)
      );
    }, 50);

    return () => clearInterval(fallInterval);
  }, [phase]);

  // Timer countdown
  useEffect(() => {
    if (phase !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setPhase("gameOver");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Spawn food periodically
  useEffect(() => {
    if (phase !== "playing") return;

    spawnRef.current = setInterval(spawnFood, 1500);

    return () => {
      if (spawnRef.current) clearInterval(spawnRef.current);
    };
  }, [phase, spawnFood]);

  // Handle drag start
  const handleDragStart = (food: Food) => {
    setDraggedFood(food);
    // Stop this food from falling
    setFoods(prev => prev.map(f => 
      f.id === food.id ? { ...f, falling: false } : f
    ));
  };

  // Handle drop on monster
  const handleDrop = (monster: Monster) => {
    if (!draggedFood) return;

    const isCorrect = draggedFood.type === monster.favoriteFood;
    
    // Update score
    setScore(prev => Math.max(0, prev + (isCorrect ? 10 : -5)));
    
    // Update monster mood
    setMonsters(prev => prev.map(m => 
      m.id === monster.id 
        ? { ...m, mood: isCorrect ? "happy" : "sad" } as Monster
        : m
    ));
    
    // Remove fed food
    setFoods(prev => prev.filter(f => f.id !== draggedFood.id));
    
    // Reset monster mood after delay
    setTimeout(() => {
      setMonsters(prev => prev.map(m => 
        m.id === monster.id ? { ...m, mood: "hungry" } : m
      ));
    }, 1500);
    
    setDraggedFood(null);
  };

  // Get monster face based on mood
  const getMonsterFace = (mood: MonsterMood) => {
    switch (mood) {
      case "happy": return { eyes: "😄", mouth: "😀" };
      case "sad": return { eyes: "😢", mouth: "☹️" };
      default: return { eyes: "👀", mouth: "👄" };
    }
  };

  // Start game
  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(60);
    setFoods([]);
    setDraggedFood(null);
    initMonsters();
    setPhase("playing");
  }, [initMonsters]);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("feed-monster-high-score");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Save high score
  useEffect(() => {
    if (phase === "gameOver" && score > highScore) {
      setHighScore(score);
      localStorage.setItem("feed-monster-high-score", String(score));
    }
  }, [phase, score, highScore]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-400 via-pink-300 to-orange-300 relative overflow-hidden">
      {/* Game area */}
      <div 
        ref={gameAreaRef}
        className="relative w-full h-screen"
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Falling foods */}
        {phase === "playing" && foods.map(food => (
          <div
            key={food.id}
            draggable
            onDragStart={() => handleDragStart(food)}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              handleDragStart(food);
            }}
            onDragEnd={() => setDraggedFood(null)}
            className="absolute text-4xl cursor-grab active:cursor-grabbing select-none transition-transform hover:scale-110 z-10"
            style={{
              left: `${food.x}%`,
              top: `${food.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {food.emoji}
          </div>
        ))}

        {/* Monsters */}
        {phase === "playing" && monsters.map(monster => (
          <div
            key={monster.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(monster)}
            onTouchEnd={() => handleDrop(monster)}
            className="absolute bottom-8 cursor-pointer z-20"
            style={{ left: `${monster.x}%`, transform: "translateX(-50%)" }}
          >
            {/* Food preference indicator */}
            <div className="text-center mb-2">
              <div className="inline-block bg-white/90 rounded-full px-3 py-1 text-sm font-bold shadow-lg">
                {FOOD_EMOJIS[monster.favoriteFood][0]} {monster.favoriteFood}
              </div>
            </div>
            
            {/* Monster body */}
            <div 
              className={`relative transition-all duration-300 ${
                monster.mood === "happy" ? "animate-bounce" : 
                monster.mood === "sad" ? "animate-pulse" : ""
              }`}
            >
              {/* Monster emoji */}
              <div 
                className="text-7xl filter drop-shadow-lg"
                style={{
                  transform: monster.mood === "sad" ? "scale(0.9)" : "scale(1)",
                }}
              >
                {monster.emoji}
              </div>
              
              {/* Mood indicator */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-2xl">
                {monster.mood === "happy" && "💖"}
                {monster.mood === "sad" && "💔"}
              </div>
              
              {/* Open mouth (drop zone) */}
              <div 
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-16 h-8 bg-gray-800 rounded-full flex items-center justify-center"
                style={{
                  boxShadow: "inset 0 -4px 8px rgba(0,0,0,0.4)",
                }}
              >
                <div className="text-sm">
                  {monster.mood === "happy" ? "😊" : monster.mood === "sad" ? "😖" : "😋"}
                </div>
              </div>
            </div>
            
            {/* Monster name */}
            <div className="text-center mt-2">
              <span 
                className="font-black text-white text-lg px-3 py-1 rounded-full shadow-lg"
                style={{ backgroundColor: monster.color }}
              >
                {monster.name}
              </span>
            </div>
          </div>
        ))}

        {/* HUD */}
        {phase === "playing" && (
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-30">
            <div className="bg-white/90 rounded-xl px-4 py-2 shadow-lg">
              <p className="font-bold text-2xl text-purple-600">🏆 {score}</p>
            </div>
            <div className="bg-white/90 rounded-xl px-4 py-2 shadow-lg">
              <p className={`font-bold text-2xl ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-orange-600"}`}>
                ⏱️ {timeLeft}s
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        {phase === "playing" && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-yellow-300/90 rounded-xl px-4 py-2 shadow-lg z-30">
            <p className="font-bold text-sm text-gray-800">
              Drag food to the monster who likes it! 🍎→👹
            </p>
          </div>
        )}
      </div>

      {/* Menu screen */}
      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-40">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h1 className="text-5xl font-black text-purple-600 mb-2">
              🍔 Feed the Monster 👹
            </h1>
            <p className="text-gray-600 mb-4 text-lg">
              Drag food to hungry monsters!
            </p>
            
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl p-4 mb-4">
              <p className="font-bold text-gray-700 mb-2">How to Play:</p>
              <div className="text-sm text-gray-600 space-y-1">
                <p>🍎 Drag food to monsters</p>
                <p>✨ Match their favorite food</p>
                <p>🎉 Get points for right matches!</p>
              </div>
            </div>
            
            {highScore > 0 && (
              <p className="text-xl font-bold text-orange-500 mb-4">
                🏆 Best: {highScore}
              </p>
            )}
            
            <button
              onClick={startGame}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-black rounded-2xl text-2xl shadow-lg transform hover:scale-105 transition-transform"
            >
              ▶️ Play!
            </button>
          </div>
        </div>
      )}

      {/* Game over screen */}
      {phase === "gameOver" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-40">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center">
            <h2 className="text-4xl font-black text-purple-600 mb-2">
              🎉 Time's Up!
            </h2>
            
            <div className="text-6xl my-6">{score > highScore - 1 ? "🏆" : "⭐"}</div>
            
            <p className="text-3xl font-black text-gray-700 my-4">
              {score} points!
            </p>
            
            {score >= highScore && score > 0 && (
              <p className="text-xl font-bold text-orange-500 mb-4 animate-bounce">
                🎊 New High Score! 🎊
              </p>
            )}
            
            <div className="space-y-2">
              <button
                onClick={startGame}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl text-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
              >
                🔄 Play Again
              </button>
              <button
                onClick={() => setPhase("menu")}
                className="w-full px-6 py-3 bg-gray-400 text-white font-bold rounded-xl text-lg hover:bg-gray-500 transition-colors"
              >
                🏠 Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
