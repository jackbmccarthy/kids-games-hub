"use client";

interface WordListProps {
  words: string[];
  foundWords: string[];
}

export function WordList({ words, foundWords }: WordListProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 h-full">
      <h3 className="text-lg font-bold text-[#2C3E50] mb-3 text-center">
        📝 Words to Find
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 max-h-[40vh] lg:max-h-full overflow-y-auto">
        {words.map((word) => {
          const isFound = foundWords.includes(word);
          return (
            <div
              key={word}
              className={`px-3 py-2 rounded-lg text-center font-semibold transition-all ${
                isFound
                  ? "bg-[#95E1A3] text-[#2C3E50] line-through"
                  : "bg-[#F7FFF7] text-[#2C3E50]"
              }`}
            >
              {isFound && "✓ "} {word}
            </div>
          );
        })}
      </div>
    </div>
  );
}
