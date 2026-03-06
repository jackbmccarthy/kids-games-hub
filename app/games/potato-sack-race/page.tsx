"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type Phase = "menu" | "playing" | "finished";

interface Player {
  x: number;
  y: number;
  hopHeight: number;
  hopPhase: number;
}

export default function PotatoSackRacePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("menu");
  const [player, setPlayer] = useState<Player>({ x: 50, y: 300, hopHeight: 0, hopPhase: 0 });
  const [distance, setDistance] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [hopPower, setHopPower] = useState(0);
  const [isCharging, setIsCharging] = useState(false);

  const RACE_DISTANCE = 500;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Sky
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, 600, 400);

    // Track
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, 320, 600, 80);

    // Track lines
    ctx.strokeStyle = "#654321";
    ctx.setLineDash([20, 10]);
    ctx.beginPath();
    ctx.moveTo(0, 360);
    ctx.lineTo(600, 360);
    ctx.stroke();
    ctx.setLineDash([]);

    // Player
    const hopOffset = Math.sin(player.hopPhase) * player.hopHeight;
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🥔", player.x, player.y - hopOffset);

    // Sack shadow
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 20, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Finish line
    const finishX = 500 - (distance / RACE_DISTANCE) * 400;
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(finishX, 320);
    ctx.lineTo(finishX, 400);
    ctx.stroke();

    // Progress bar
    ctx.fillStyle = "#333";
    ctx.fillRect(50, 20, 500, 20);
    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(50, 20, (distance / RACE_DISTANCE) * 500, 20);
    ctx.fillStyle = "#FFF";
    ctx.font = "14px Arial";
    ctx.fillText(`${Math.floor(distance)}m / ${RACE_DISTANCE}m`, 300, 35);

    // Power meter
    if (isCharging) {
      ctx.fillStyle = "#333";
      ctx.fillRect(50, 50, 100, 15);
      ctx.fillStyle = "#FF6B6B";
      ctx.fillRect(50, 50, hopPower, 15);
    }
  }, [player, distance, hopPower, isCharging]);

  useEffect(() => {
    if (phase === "playing") {
      const animate = () => {
        setPlayer(prev => ({
          ...prev,
          hopPhase: prev.hopPhase + 0.2,
          hopHeight: Math.max(0, prev.hopHeight - 2)
        }));
        draw();
        requestAnimationFrame(animate);
      };
      animate();
    }
  }, [phase, draw]);

  const startHop = () => {
    setIsCharging(true);
    setHopPower(0);
    const charge = setInterval(() => {
      setHopPower(p => {
        if (p >= 100) {
          clearInterval(charge);
          return 100;
        }
        return p + 5;
      });
    }, 50);
  };

  const releaseHop = () => {
    setIsCharging(false);
    const power = hopPower / 100;
    setDistance(d => {
      const newDist = d + power * 30;
      if (newDist >= RACE_DISTANCE) {
        setPhase("finished");
        return RACE_DISTANCE;
      }
      return newDist;
    });
    setPlayer(prev => ({
      ...prev,
      hopHeight: power * 50,
      hopPhase: 0
    }));
    setHopPower(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-300 to-orange-400 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-amber-800 mb-4">🥔 Potato Sack Race</h1>

      {phase === "menu" && (
        <div className="text-center">
          <p className="text-amber-700 mb-4">Hop to the finish line!</p>
          <p className="text-amber-600 mb-4 text-sm">High Score: {highScore}m</p>
          <button onClick={() => { setDistance(0); setPhase("playing"); }} className="px-8 py-4 bg-amber-600 text-white font-bold rounded-xl text-xl">Start Race!</button>
        </div>
      )}

      {phase === "playing" && (
        <div className="text-center">
          <canvas ref={canvasRef} width={600} height={400} className="rounded-2xl shadow-xl" />
          <button
            onMouseDown={startHop}
            onMouseUp={releaseHop}
            onTouchStart={startHop}
            onTouchEnd={releaseHop}
            className="mt-4 px-12 py-6 bg-green-500 text-white font-bold rounded-2xl text-2xl active:bg-green-600"
          >
            HOP! 🦘
          </button>
        </div>
      )}

      {phase === "finished" && (
        <div className="text-center">
          <p className="text-2xl text-amber-800 mb-2">🏆 Finished!</p>
          <button onClick={() => { setDistance(0); setPhase("playing"); }} className="px-8 py-4 bg-amber-600 text-white font-bold rounded-xl text-xl">Race Again!</button>
        </div>
      )}
    </div>
  );
}
