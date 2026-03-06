"use client";

import { useState, useCallback } from "react";
import { WelcomeScreen } from "../../components/word-search/WelcomeScreen";
import { SettingsScreen } from "../../components/word-search/SettingsScreen";
import { GameScreen } from "../../components/word-search/GameScreen";
import { VictoryScreen } from "../../components/word-search/VictoryScreen";

export type Grade = "k" | "1" | "2" | "3" | "4" | "5";
export type WordCount = 10 | 15 | 20;

export interface GameSettings {
  grade: Grade;
  wordCount: WordCount;
  category: string;
}

type GamePhase = "welcome" | "settings" | "playing" | "victory";

export default function WordSearchPage() {
  const [phase, setPhase] = useState<GamePhase>("welcome");
  const [settings, setSettings] = useState<GameSettings>({
    grade: "k",
    wordCount: 10,
    category: "animals",
  });

  const handleStartGame = useCallback(() => {
    setPhase("settings");
  }, []);

  const handleStartPlaying = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    setPhase("playing");
  }, []);

  const handleVictory = useCallback(() => {
    setPhase("victory");
  }, []);

  const handlePlayAgain = useCallback(() => {
    setPhase("playing");
  }, []);

  const handleNewGame = useCallback(() => {
    setPhase("settings");
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FFF5F5] to-[#F0FFFF]">
      {phase === "welcome" && (
        <WelcomeScreen onStart={handleStartGame} />
      )}
      {phase === "settings" && (
        <SettingsScreen 
          onStart={handleStartPlaying} 
          initialSettings={settings}
        />
      )}
      {phase === "playing" && (
        <GameScreen 
          settings={settings}
          onVictory={handleVictory}
        />
      )}
      {phase === "victory" && (
        <VictoryScreen 
          onPlayAgain={handlePlayAgain}
          onNewGame={handleNewGame}
        />
      )}
    </main>
  );
}
