"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type GamePhase = "menu" | "playing";
type LightLevel = "sunny" | "shady";
type PlantStage = "seed" | "sprout" | "growing" | "blooming" | "ready";

interface PlantType {
  id: string;
  name: string;
  emoji: string;
  stages: { [key in PlantStage]: string };
  preferredLight: LightLevel;
  points: number;
  waterNeeded: number;
}

interface Plot {
  id: number;
  plant: PlantType | null;
  stage: PlantStage;
  water: number;
  growth: number;
  harvested: boolean;
}

const PLANT_TYPES: PlantType[] = [
  {
    id: "sunflower",
    name: "Sunflower",
    emoji: "🌻",
    stages: { seed: "🌱", sprout: "🌿", growing: "🪴", blooming: "🌻", ready: "🌻" },
    preferredLight: "sunny",
    points: 10,
    waterNeeded: 3,
  },
  {
    id: "rose",
    name: "Rose",
    emoji: "🌹",
    stages: { seed: "🌱", sprout: "🌿", growing: "🪴", blooming: "🌹", ready: "🌹" },
    preferredLight: "sunny",
    points: 15,
    waterNeeded: 4,
  },
  {
    id: "tulip",
    name: "Tulip",
    emoji: "🌷",
    stages: { seed: "🌱", sprout: "🌿", growing: "🪴", blooming: "🌷", ready: "🌷" },
    preferredLight: "sunny",
    points: 12,
    waterNeeded: 3,
  },
  {
    id: "carrot",
    name: "Carrot",
    emoji: "🥕",
    stages: { seed: "🌱", sprout: "🌿", growing: "🥬", blooming: "🥬", ready: "🥕" },
    preferredLight: "sunny",
    points: 20,
    waterNeeded: 5,
  },
  {
    id: "tomato",
    name: "Tomato",
    emoji: "🍅",
    stages: { seed: "🌱", sprout: "🌿", growing: "🪴", blooming: "🍅", ready: "🍅" },
    preferredLight: "sunny",
    points: 25,
    waterNeeded: 4,
  },
  {
    id: "strawberry",
    name: "Strawberry",
    emoji: "🍓",
    stages: { seed: "🌱", sprout: "🌿", growing: "🪴", blooming: "🍓", ready: "🍓" },
    preferredLight: "shady",
    points: 30,
    waterNeeded: 4,
  },
  {
    id: "mushroom",
    name: "Mushroom",
    emoji: "🍄",
    stages: { seed: "🌱", sprout: "🍄", growing: "🍄", blooming: "🍄", ready: "🍄" },
    preferredLight: "shady",
    points: 15,
    waterNeeded: 2,
  },
  {
    id: "blueberry",
    name: "Blueberry",
    emoji: "🫐",
    stages: { seed: "🌱", sprout: "🌿", growing: "🪴", blooming: "🫐", ready: "🫐" },
    preferredLight: "shady",
    points: 22,
    waterNeeded: 3,
  },
];

const STAGE_ORDER: PlantStage[] = ["seed", "sprout", "growing", "blooming", "ready"];

export default function GardenGrowPage() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [plots, setPlots] = useState<Plot[]>(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      plant: null,
      stage: "seed" as PlantStage,
      water: 0,
      growth: 0,
      harvested: false,
    }))
  );
  const [lightLevel, setLightLevel] = useState<LightLevel>("sunny");
  const [score, setScore] = useState(0);
  const [selectedSeed, setSelectedSeed] = useState<PlantType | null>(null);
  const [wateringCan, setWateringCan] = useState(10);
  const [showHarvest, setShowHarvest] = useState(false);
  const [harvestPoints, setHarvestPoints] = useState(0);
  const [waterDrops, setWaterDrops] = useState<{ id: number; x: number; y: number }[]>([]);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
  const waterDropIdRef = useRef(0);
  const sparkleIdRef = useRef(0);

  // Get emoji for current stage
  const getPlantEmoji = (plot: Plot): string => {
    if (!plot.plant) return "";
    return plot.plant.stages[plot.stage];
  };

  // Check if plot can grow
  const canGrow = (plot: Plot): boolean => {
    if (!plot.plant || plot.stage === "ready") return false;
    const hasWater = plot.water > 0;
    const hasRightLight = plot.plant.preferredLight === lightLevel;
    return hasWater || hasRightLight;
  };

  // Growth tick
  useEffect(() => {
    if (phase !== "playing") return;

    const interval = setInterval(() => {
      setPlots((prev) =>
        prev.map((plot) => {
          if (!plot.plant || plot.stage === "ready") return plot;

          const hasWater = plot.water > 0;
          const rightLight = plot.plant.preferredLight === lightLevel;
          let growthIncrease = 0;

          if (hasWater && rightLight) {
            growthIncrease = 15; // Best conditions
          } else if (hasWater || rightLight) {
            growthIncrease = 5; // Okay conditions
          }

          if (growthIncrease > 0) {
            const newGrowth = plot.growth + growthIncrease;
            const newWater = Math.max(0, plot.water - 1);

            // Check for stage advancement
            const stageIndex = STAGE_ORDER.indexOf(plot.stage);
            const growthThreshold = (stageIndex + 1) * 25;

            if (newGrowth >= growthThreshold && stageIndex < STAGE_ORDER.length - 1) {
              return {
                ...plot,
                stage: STAGE_ORDER[stageIndex + 1],
                growth: newGrowth,
                water: newWater,
              };
            }

            return { ...plot, growth: newGrowth, water: newWater };
          }

          return plot;
        })
      );

      // Refill watering can slowly
      setWateringCan((prev) => Math.min(10, prev + 0.5));
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, lightLevel]);

  // Plant a seed
  const plantSeed = (plotId: number) => {
    if (!selectedSeed) return;

    setPlots((prev) =>
      prev.map((plot) =>
        plot.id === plotId && !plot.plant
          ? { ...plot, plant: selectedSeed, stage: "seed", water: 0, growth: 0 }
          : plot
      )
    );
    setSelectedSeed(null);
  };

  // Water a plot
  const waterPlot = (plotId: number, event?: React.MouseEvent | React.TouchEvent) => {
    if (wateringCan < 1) return;

    setWateringCan((prev) => prev - 1);

    setPlots((prev) =>
      prev.map((plot) =>
        plot.id === plotId && plot.plant
          ? { ...plot, water: Math.min(5, plot.water + 1) }
          : plot
      )
    );

    // Add water drop animation
    if (event) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const x = "touches" in event ? event.touches[0].clientX : event.clientX;
      const y = "touches" in event ? event.touches[0].clientY : event.clientY;
      
      const id = waterDropIdRef.current++;
      setWaterDrops((prev) => [...prev, { id, x, y }]);
      setTimeout(() => {
        setWaterDrops((prev) => prev.filter((d) => d.id !== id));
      }, 800);
    }
  };

  // Harvest a ready plant
  const harvestPlot = (plotId: number) => {
    const plot = plots.find((p) => p.id === plotId);
    if (!plot || !plot.plant || plot.stage !== "ready") return;

    const points = plot.plant.points;
    setScore((prev) => prev + points);
    setHarvestPoints(points);
    setShowHarvest(true);
    setTimeout(() => setShowHarvest(false), 1500);

    // Add sparkle animation
    for (let i = 0; i < 5; i++) {
      const id = sparkleIdRef.current++;
      setTimeout(() => {
        setSparkles((prev) => [
          ...prev,
          { id, x: 150 + plotId * 120 + Math.random() * 40, y: 200 + Math.random() * 40 },
        ]);
        setTimeout(() => {
          setSparkles((prev) => prev.filter((s) => s.id !== id));
        }, 1000);
      }, i * 100);
    }

    setPlots((prev) =>
      prev.map((p) =>
        p.id === plotId
          ? { ...p, plant: null, stage: "seed", water: 0, growth: 0 }
          : p
      )
    );
  };

  // Handle plot click
  const handlePlotClick = (plotId: number, event: React.MouseEvent | React.TouchEvent) => {
    const plot = plots.find((p) => p.id === plotId);
    if (!plot) return;

    if (!plot.plant && selectedSeed) {
      plantSeed(plotId);
    } else if (plot.plant && plot.stage === "ready") {
      harvestPlot(plotId);
    } else if (plot.plant && wateringCan > 0) {
      waterPlot(plotId, event);
    }
  };

  // Reset game
  const resetGame = () => {
    setPlots(
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        plant: null,
        stage: "seed" as PlantStage,
        water: 0,
        growth: 0,
        harvested: false,
      }))
    );
    setScore(0);
    setWateringCan(10);
    setSelectedSeed(null);
    setLightLevel("sunny");
  };

  // Get background based on light level
  const getBackgroundGradient = () => {
    if (lightLevel === "sunny") {
      return "from-sky-300 via-yellow-100 to-green-300";
    }
    return "from-indigo-300 via-purple-200 to-green-400";
  };

  return (
    <main className={`min-h-screen bg-gradient-to-b ${getBackgroundGradient()} flex flex-col items-center p-4 transition-all duration-1000`}>
      {/* Header */}
      {phase === "playing" && (
        <div className="w-full max-w-lg mb-4">
          <div className="flex justify-between items-center bg-white/70 rounded-2xl p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <span className="text-2xl font-bold text-green-700">{score}</span>
            </div>

            {/* Light Toggle */}
            <button
              onClick={() => setLightLevel((l) => (l === "sunny" ? "shady" : "sunny"))}
              className={`px-4 py-2 rounded-xl font-bold text-white transition-all ${
                lightLevel === "sunny" ? "bg-yellow-500" : "bg-indigo-500"
              }`}
            >
              {lightLevel === "sunny" ? "☀️ Sunny" : "🌙 Shady"}
            </button>

            {/* Watering Can */}
            <div className="flex items-center gap-1 bg-blue-100 rounded-xl px-3 py-1">
              <span className="text-2xl">🚿</span>
              <div className="flex gap-0.5">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-4 rounded transition-all ${
                      i < wateringCan ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Area */}
      <div className="relative w-full max-w-lg">
        {/* Decorative elements */}
        <div className="absolute -top-2 left-0 text-3xl animate-bounce">🦋</div>
        <div className="absolute -top-2 right-0 text-3xl animate-bounce delay-300">🐝</div>

        {/* Garden Plots */}
        {phase === "playing" && (
          <div className="bg-amber-800/30 rounded-3xl p-4 backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-3">
              {plots.map((plot) => (
                <button
                  key={plot.id}
                  onClick={(e) => handlePlotClick(plot.id, e)}
                  onTouchStart={(e) => handlePlotClick(plot.id, e)}
                  className={`
                    relative h-28 rounded-2xl flex flex-col items-center justify-center
                    transition-all active:scale-95
                    ${plot.plant ? "bg-amber-600/40" : "bg-amber-700/50"}
                    ${selectedSeed && !plot.plant ? "ring-4 ring-yellow-400 ring-opacity-75" : ""}
                    ${plot.stage === "ready" ? "ring-4 ring-green-400 animate-pulse" : ""}
                  `}
                >
                  {/* Soil texture */}
                  <div className="absolute inset-0 opacity-30 text-4xl flex items-center justify-center">
                    🟫
                  </div>

                  {/* Plant */}
                  {plot.plant && (
                    <div className="relative z-10 flex flex-col items-center">
                      <span className="text-4xl">{getPlantEmoji(plot)}</span>
                      
                      {/* Water indicator */}
                      {plot.water > 0 && (
                        <div className="absolute -bottom-2 flex gap-0.5">
                          {[...Array(plot.water)].map((_, i) => (
                            <span key={i} className="text-xs">💧</span>
                          ))}
                        </div>
                      )}

                      {/* Growth bar */}
                      {plot.stage !== "ready" && (
                        <div className="absolute -bottom-6 w-16 h-1.5 bg-gray-300 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${(plot.growth % 25) * 4}%` }}
                          />
                        </div>
                      )}

                      {/* Ready indicator */}
                      {plot.stage === "ready" && (
                        <span className="absolute -top-2 text-lg animate-bounce">✨</span>
                      )}
                    </div>
                  )}

                  {/* Empty plot indicator */}
                  {!plot.plant && selectedSeed && (
                    <span className="text-3xl opacity-50">{selectedSeed.stages.seed}</span>
                  )}

                  {!plot.plant && !selectedSeed && (
                    <span className="text-2xl opacity-30">+</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Water drops animation */}
        {waterDrops.map((drop) => (
          <div
            key={drop.id}
            className="absolute pointer-events-none text-2xl animate-bounce"
            style={{ left: drop.x - 12, top: drop.y - 50 }}
          >
            💧
          </div>
        ))}

        {/* Sparkles animation */}
        {sparkles.map((sparkle) => (
          <div
            key={sparkle.id}
            className="absolute pointer-events-none text-xl animate-ping"
            style={{ left: sparkle.x, top: sparkle.y }}
          >
            ✨
          </div>
        ))}

        {/* Harvest popup */}
        {showHarvest && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-yellow-400 text-white text-2xl font-bold px-6 py-3 rounded-full animate-bounce shadow-lg">
              +{harvestPoints} 🌟
            </div>
          </div>
        )}
      </div>

      {/* Seed Selection */}
      {phase === "playing" && (
        <div className="w-full max-w-lg mt-4">
          <div className="bg-white/70 rounded-2xl p-3 shadow-lg">
            <div className="text-center font-bold text-green-700 mb-2">🌱 Choose a Seed</div>
            <div className="flex flex-wrap justify-center gap-2">
              {PLANT_TYPES.map((plant) => (
                <button
                  key={plant.id}
                  onClick={() => setSelectedSeed(plant)}
                  className={`
                    px-3 py-2 rounded-xl flex flex-col items-center transition-all
                    ${selectedSeed?.id === plant.id ? "bg-green-500 text-white scale-110" : "bg-white/80 hover:bg-white"}
                    ${plant.preferredLight === "sunny" ? "ring-2 ring-yellow-400/50" : "ring-2 ring-indigo-400/50"}
                  `}
                >
                  <span className="text-2xl">{plant.emoji}</span>
                  <span className="text-xs font-medium">{plant.name}</span>
                </button>
              ))}
            </div>

            {/* Selected seed info */}
            {selectedSeed && (
              <div className="mt-3 p-2 bg-green-100 rounded-xl text-center">
                <span className="font-bold text-green-700">
                  {selectedSeed.emoji} {selectedSeed.name}
                </span>
                <span className="text-sm text-gray-600 ml-2">
                  ({selectedSeed.preferredLight === "sunny" ? "☀️" : "🌙"} {selectedSeed.points} pts)
                </span>
                <div className="text-xs text-gray-500 mt-1">
                  Tap an empty plot to plant!
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-3 bg-white/50 rounded-xl p-3 text-center text-sm text-gray-600">
            <p>💧 Water plants with the watering can</p>
            <p>☀️/🌙 Toggle light for sun/shade plants</p>
            <p>✨ Harvest when ready for points!</p>
          </div>
        </div>
      )}

      {/* Menu Screen */}
      {phase === "menu" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-200 to-green-200">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm mx-4">
            <div className="text-6xl mb-4">🌻🍅🌷🥕</div>
            <h1 className="text-4xl font-black text-green-600 mb-2">Garden Grow</h1>
            <p className="text-gray-600 mb-4">Plant, water, and watch your garden bloom!</p>
            
            <div className="space-y-2 text-sm text-gray-500 mb-6">
              <p>🌱 Plant seeds in garden plots</p>
              <p>💧 Water your plants to help them grow</p>
              <p>☀️🌙 Some plants like sun, some like shade</p>
              <p>✨ Harvest when ready for points!</p>
            </div>

            <button
              onClick={() => {
                resetGame();
                setPhase("playing");
              }}
              className="w-full px-8 py-4 bg-green-500 text-white font-bold rounded-xl text-2xl hover:bg-green-600 transition-all active:scale-95 shadow-lg"
            >
              ▶️ Start Gardening!
            </button>
          </div>
        </div>
      )}

      {/* Floating decorations */}
      {phase === "playing" && (
        <>
          <div className="fixed bottom-4 left-4 text-4xl animate-pulse">🌸</div>
          <div className="fixed bottom-4 right-4 text-4xl animate-pulse delay-500">🌺</div>
          <div className="fixed top-20 left-4 text-2xl opacity-50">🌿</div>
          <div className="fixed top-20 right-4 text-2xl opacity-50">🌿</div>
        </>
      )}
    </main>
  );
}
