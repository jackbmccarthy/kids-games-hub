"use client";

import { useState, useEffect, useCallback } from "react";

type GamePhase = "menu" | "playing" | "complete";

interface OppositePair {
  word: string;
  opposite: string;
  emoji: string;
  oppositeEmoji: string;
  category: string;
}

interface Question {
  pair: OppositePair;
  options: string[];
  correctAnswer: string;
}

const OPPOSITE_PAIRS: OppositePair[] = [
  // Temperature
  { word: "Hot", opposite: "Cold", emoji: "🔥", oppositeEmoji: "❄️", category: "temperature" },
  { word: "Warm", opposite: "Cool", emoji: "☀️", oppositeEmoji: "🌬️", category: "temperature" },
  
  // Size
  { word: "Big", opposite: "Small", emoji: "🐘", oppositeEmoji: "🐭", category: "size" },
  { word: "Tall", opposite: "Short", emoji: "🦒", oppositeEmoji: "🐕", category: "size" },
  { word: "Long", opposite: "Short", emoji: "🐍", oppositeEmoji: "🐛", category: "size" },
  { word: "Wide", opposite: "Narrow", emoji: "🚪", oppositeEmoji: "🚪", category: "size" },
  
  // Position
  { word: "Up", opposite: "Down", emoji: "⬆️", oppositeEmoji: "⬇️", category: "position" },
  { word: "In", opposite: "Out", emoji: "📦", oppositeEmoji: "📦", category: "position" },
  { word: "Over", opposite: "Under", emoji: "🌈", oppositeEmoji: "💧", category: "position" },
  { word: "Left", opposite: "Right", emoji: "⬅️", oppositeEmoji: "➡️", category: "position" },
  { word: "Front", opposite: "Back", emoji: "😊", oppositeEmoji: "🔙", category: "position" },
  
  // Speed
  { word: "Fast", opposite: "Slow", emoji: "🐆", oppositeEmoji: "🐢", category: "speed" },
  { word: "Quick", opposite: "Slow", emoji: "⚡", oppositeEmoji: "🐌", category: "speed" },
  
  // Feelings
  { word: "Happy", opposite: "Sad", emoji: "😊", oppositeEmoji: "😢", category: "feelings" },
  { word: "Brave", opposite: "Scared", emoji: "🦁", oppositeEmoji: "😱", category: "feelings" },
  { word: "Angry", opposite: "Calm", emoji: "😤", oppositeEmoji: "😌", category: "feelings" },
  
  // Time
  { word: "Day", opposite: "Night", emoji: "☀️", oppositeEmoji: "🌙", category: "time" },
  { word: "Morning", opposite: "Evening", emoji: "🌅", oppositeEmoji: "🌆", category: "time" },
  { word: "New", opposite: "Old", emoji: "🆕", oppositeEmoji: "📜", category: "time" },
  { word: "Young", opposite: "Old", emoji: "👶", oppositeEmoji: "👴", category: "time" },
  { word: "Early", opposite: "Late", emoji: "🌅", oppositeEmoji: "🌙", category: "time" },
  
  // Numbers
  { word: "One", opposite: "Many", emoji: "1️⃣", oppositeEmoji: "🎆", category: "numbers" },
  { word: "Full", opposite: "Empty", emoji: "🫗", oppositeEmoji: "🕳️", category: "numbers" },
  { word: "More", opposite: "Less", emoji: "➕", oppositeEmoji: "➖", category: "numbers" },
  
  // Texture
  { word: "Hard", opposite: "Soft", emoji: "🪨", oppositeEmoji: "🧸", category: "texture" },
  { word: "Rough", opposite: "Smooth", emoji: "🧱", oppositeEmoji: "🪞", category: "texture" },
  { word: "Wet", opposite: "Dry", emoji: "💧", oppositeEmoji: "🏜️", category: "texture" },
  
  // Colors
  { word: "Light", opposite: "Dark", emoji: "💡", oppositeEmoji: "🌑", category: "colors" },
  { word: "Bright", opposite: "Dim", emoji: "✨", oppositeEmoji: "🌑", category: "colors" },
  
  // Actions
  { word: "Open", opposite: "Closed", emoji: "🔓", oppositeEmoji: "🔒", category: "actions" },
  { word: "Push", opposite: "Pull", emoji: "👉", oppositeEmoji: "👈", category: "actions" },
  { word: "Give", opposite: "Take", emoji: "🎁", oppositeEmoji: "🤲", category: "actions" },
  { word: "Clean", opposite: "Dirty", emoji: "✨", oppositeEmoji: "🧹", category: "actions" },
  { word: "On", opposite: "Off", emoji: "💡", oppositeEmoji: "⭕", category: "actions" },
  
  // Sounds
  { word: "Loud", opposite: "Quiet", emoji: "📢", oppositeEmoji: "🤫", category: "sounds" },
  { word: "Noisy", opposite: "Silent", emoji: "🎉", oppositeEmoji: "🤐", category: "sounds" },
  
  // States
  { word: "Alive", opposite: "Dead", emoji: "❤️", oppositeEmoji: "💔", category: "states" },
  { word: "Awake", opposite: "Asleep", emoji: "👀", oppositeEmoji: "😴", category: "states" },
  { word: "Strong", opposite: "Weak", emoji: "💪", oppositeEmoji: "🥀", category: "states" },
];

const CONFETTI_COLORS = ["🎉", "🎊", "⭐", "✨", "🌟", "💫", "🎈", "🌈"];
const CELEBRATION_EMOJIS = ["🎉", "⭐", "🌟", "✨", "👏", "🙌", "🎊", "💫"];

export default function OppositesPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; emoji: string; x: number; delay: number }[]>([]);
  const [rounds, setRounds] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [showHint, setShowHint] = useState(false);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const initializeGame = useCallback(() => {
    const shuffledPairs = shuffleArray(OPPOSITE_PAIRS);
    const selectedPairs = shuffledPairs.slice(0, rounds);
    
    const generatedQuestions: Question[] = selectedPairs.map(pair => {
      // Get wrong options from other pairs
      const otherPairs = OPPOSITE_PAIRS.filter(p => p !== pair);
      const wrongOptions = shuffleArray(otherPairs)
        .slice(0, 3)
        .map(p => p.opposite);
      
      const allOptions = shuffleArray([pair.opposite, ...wrongOptions]);
      
      return {
        pair,
        options: allOptions,
        correctAnswer: pair.opposite,
      };
    });
    
    setQuestions(generatedQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowCelebration(false);
    setShowHint(false);
  }, [rounds]);

  const triggerConfetti = () => {
    const newConfetti = Array.from({ length: 20 }, (_, i) => ({
      id: Date.now() + i,
      emoji: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
    }));
    setConfetti(newConfetti);
    setTimeout(() => setConfetti([]), 2000);
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const correct = answer === currentQuestion.correctAnswer;
    
    setSelectedAnswer(answer);
    setIsCorrect(correct);
    
    if (correct) {
      const points = 10 + streak * 5;
      setScore(s => s + points);
      setStreak(s => {
        const newStreak = s + 1;
        setBestStreak(b => Math.max(b, newStreak));
        return newStreak;
      });
      setShowCelebration(true);
      triggerConfetti();
      
      // Auto advance after celebration
      setTimeout(() => {
        setShowCelebration(false);
        advanceToNextQuestion();
      }, 1500);
    } else {
      setStreak(0);
      // Allow retry after a moment
      setTimeout(() => {
        setSelectedAnswer(null);
        setIsCorrect(null);
      }, 1200);
    }
  };

  const advanceToNextQuestion = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    setShowHint(false);
    
    if (currentQuestionIndex + 1 >= questions.length) {
      setPhase("complete");
    } else {
      setCurrentQuestionIndex(i => i + 1);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  useEffect(() => {
    if (phase === "playing") {
      initializeGame();
    }
  }, [phase, initializeGame]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-400 via-purple-400 to-fuchsia-400 flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Confetti */}
      {confetti.map(c => (
        <div
          key={c.id}
          className="absolute top-0 animate-bounce pointer-events-none text-3xl"
          style={{
            left: `${c.x}%`,
            animation: `fall 2s ease-out ${c.delay}s forwards`,
          }}
        >
          {c.emoji}
        </div>
      ))}

      {/* Header */}
      {phase === "playing" && currentQuestion && (
        <div className="w-full max-w-lg mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">🔄 Opposites</h2>
            <div className="flex items-center gap-4">
              {streak > 0 && (
                <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-bold text-sm">
                  🔥 {streak} streak!
                </span>
              )}
              <span className="bg-white/30 backdrop-blur-sm text-white px-4 py-1 rounded-full font-bold">
                ⭐ {score}
              </span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-3 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/80 text-sm mt-1 text-center">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
      )}

      {/* Menu */}
      {phase === "menu" && (
        <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md w-full transform transition-all">
          <div className="text-6xl mb-4">🔄</div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent mb-2">
            Opposites
          </h1>
          <p className="text-gray-600 mb-6">Match the opposite pairs!</p>
          
          <div className="space-y-4 mb-6">
            <div>
              <p className="font-bold text-gray-700 mb-2">Rounds:</p>
              <div className="flex gap-2 justify-center">
                {[5, 10, 15].map(num => (
                  <button
                    key={num}
                    onClick={() => setRounds(num)}
                    className={`px-4 py-2 rounded-xl font-bold transition-all ${
                      rounds === num 
                        ? "bg-violet-500 text-white scale-105" 
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <p className="font-bold text-gray-700 mb-2">Difficulty:</p>
              <div className="flex gap-2 justify-center">
                {(["easy", "medium", "hard"] as const).map(diff => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`px-4 py-2 rounded-xl font-bold capitalize transition-all ${
                      difficulty === diff 
                        ? "bg-fuchsia-500 text-white scale-105" 
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setPhase("playing")}
            className="w-full px-6 py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold rounded-xl text-xl shadow-lg transform hover:scale-105 transition-all"
          >
            ▶️ Play!
          </button>
          
          <div className="mt-6 text-left bg-gray-100 rounded-xl p-4">
            <p className="font-bold text-gray-700 mb-2">How to play:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• You'll see a word with a picture</li>
              <li>• Find its opposite from the options</li>
              <li>• Get points for correct answers!</li>
              <li>• Build a streak for bonus points 🔥</li>
            </ul>
          </div>
        </div>
      )}

      {/* Game */}
      {phase === "playing" && currentQuestion && (
        <div className="w-full max-w-lg">
          {/* Question Card */}
          <div className={`bg-white rounded-3xl p-6 shadow-2xl text-center transform transition-all ${
            showCelebration ? "scale-105" : ""
          }`}>
            {/* Word Display */}
            <div className="mb-6">
              <p className="text-gray-500 text-sm mb-2">What is the opposite of...</p>
              <div className="text-7xl mb-3 animate-pulse">{currentQuestion.pair.emoji}</div>
              <h3 className="text-4xl font-black text-gray-800">
                {currentQuestion.pair.word}
              </h3>
              {showHint && (
                <p className="text-sm text-violet-600 mt-2 animate-bounce">
                  Hint: Think about {currentQuestion.pair.category}! 🤔
                </p>
              )}
            </div>

            {/* Options */}
            <div className={`grid gap-3 ${
              difficulty === "hard" ? "grid-cols-2" : "grid-cols-2"
            }`}>
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrectOption = option === currentQuestion.correctAnswer;
                const showCorrect = selectedAnswer !== null && isCorrectOption;
                const showWrong = isSelected && !isCorrect;
                
                // Find emoji for this option
                const optionPair = OPPOSITE_PAIRS.find(p => p.opposite === option);
                const optionEmoji = optionPair?.oppositeEmoji || "❓";
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    disabled={selectedAnswer !== null}
                    className={`p-4 rounded-2xl font-bold text-xl transition-all transform ${
                      showCorrect
                        ? "bg-green-400 text-white scale-105 ring-4 ring-green-300"
                        : showWrong
                        ? "bg-red-400 text-white scale-95"
                        : isSelected
                        ? "bg-violet-400 text-white scale-105"
                        : "bg-gray-100 hover:bg-violet-100 hover:scale-105 active:scale-95"
                    }`}
                  >
                    <span className="text-3xl block mb-1">{optionEmoji}</span>
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Hint Button */}
            {!showHint && selectedAnswer === null && (
              <button
                onClick={() => setShowHint(true)}
                className="mt-4 text-violet-500 hover:text-violet-600 font-medium text-sm"
              >
                💡 Need a hint?
              </button>
            )}

            {/* Feedback */}
            {selectedAnswer !== null && (
              <div className={`mt-4 p-3 rounded-xl ${
                isCorrect ? "bg-green-100" : "bg-red-100"
              }`}>
                {isCorrect ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl">{CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)]}</span>
                    <span className="text-green-700 font-bold text-lg">
                      Correct! +{10 + (streak - 1) * 5} points
                    </span>
                    <span className="text-2xl">{CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)]}</span>
                  </div>
                ) : (
                  <div className="text-red-700 font-bold">
                    Try again! The opposite of {currentQuestion.pair.word.toLowerCase()} is {currentQuestion.correctAnswer.toLowerCase()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Learning Card */}
          {selectedAnswer !== null && isCorrect && (
            <div className="mt-4 bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center animate-fade-in">
              <p className="text-gray-700">
                <span className="font-bold text-violet-600">{currentQuestion.pair.word}</span>
                {" "} ↔️ {" "}
                <span className="font-bold text-fuchsia-600">{currentQuestion.correctAnswer}</span>
              </p>
              <div className="flex justify-center items-center gap-4 mt-2">
                <span className="text-4xl">{currentQuestion.pair.emoji}</span>
                <span className="text-2xl">⟷</span>
                <span className="text-4xl">{currentQuestion.pair.oppositeEmoji}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complete */}
      {phase === "complete" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md w-full transform animate-bounce-in">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-4xl font-black bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-2">
              Amazing!
            </h2>
            <p className="text-gray-600 mb-6">You learned {questions.length} opposite pairs!</p>
            
            <div className="bg-gradient-to-r from-violet-100 to-fuchsia-100 rounded-2xl p-4 mb-6">
              <div className="text-5xl font-black text-violet-600 mb-1">{score}</div>
              <p className="text-violet-500 font-bold">Total Points</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-green-100 rounded-xl p-3">
                <div className="text-2xl font-bold text-green-600">
                  {questions.filter((_, i) => i < currentQuestionIndex).length}
                </div>
                <p className="text-green-700 text-sm">Correct</p>
              </div>
              <div className="bg-orange-100 rounded-xl p-3">
                <div className="text-2xl font-bold text-orange-600">{bestStreak}</div>
                <p className="text-orange-700 text-sm">Best Streak</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setPhase("playing")}
                className="w-full px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold rounded-xl hover:opacity-90 transition-all"
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

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes bounce-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
