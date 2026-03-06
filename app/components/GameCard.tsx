interface Game {
  id: string;
  title: string;
  description: string;
  color: string;
  ageRange: string;
}

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <div
      className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-4 border-transparent hover:border-[var(--card-color)] group relative overflow-hidden"
      style={{ "--card-color": game.color } as React.CSSProperties}
    >
      {/* Top color bar */}
      <div
        className="absolute top-0 left-0 right-0 h-2"
        style={{ backgroundColor: game.color }}
      />
      
      {/* Game Icon */}
      <div className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-4">
        {game.id === "bubble-pop-chain" ? (
          <BubblePopIcon color={game.color} />
        ) : game.id === "shadow-match" ? (
          <ShadowMatchIcon color={game.color} />
        ) : game.id === "color-mix-lab" ? (
          <ColorMixLabIcon color={game.color} />
        ) : game.id === "rhythm-tiles" ? (
          <RhythmTilesIcon color={game.color} />
        ) : game.id === "gravity-draw" ? (
          <GravityDrawIcon color={game.color} />
        ) : game.id === "pattern-repeat" ? (
          <PatternRepeatIcon color={game.color} />
        ) : game.id === "word-snake" ? (
          <WordSnakeIcon color={game.color} />
        ) : (
          <WordSearchIcon color={game.color} />
        )}
      </div>
      
      {/* Content */}
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-[#2C3E50] mb-2 group-hover:scale-105 transition-transform">
          {game.title}
        </h2>
        <p className="text-[#2C3E50]/70 mb-3">{game.description}</p>
        
        {/* Age Badge */}
        <span
          className="inline-block px-4 py-1 rounded-full text-sm font-bold"
          style={{ backgroundColor: "#FFE66D", color: "#2C3E50" }}
        >
          Ages {game.ageRange}
        </span>
      </div>
      
      {/* Play Button */}
      <div
        className="mt-4 py-3 rounded-xl text-white font-bold text-lg text-center transition-all group-hover:bg-gradient-to-r group-hover:from-[var(--card-color)] group-hover:to-[#4ECDC4]"
        style={{ backgroundColor: game.color }}
      >
        Play! ▶
      </div>
    </div>
  );
}

function BubblePopIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Background */}
      <rect x="5" y="5" width="90" height="90" rx="12" fill="#E8FFF8" stroke={color} strokeWidth="2" />
      
      {/* Large bubble */}
      <circle cx="35" cy="60" r="22" fill="url(#bubbleGrad1)" stroke={color} strokeWidth="2" />
      <ellipse cx="28" cy="52" rx="6" ry="4" fill="white" opacity="0.7" />
      
      {/* Medium bubble */}
      <circle cx="65" cy="45" r="16" fill="url(#bubbleGrad2)" stroke={color} strokeWidth="2" />
      <ellipse cx="60" cy="39" rx="4" ry="3" fill="white" opacity="0.7" />
      
      {/* Small bubbles */}
      <circle cx="75" cy="70" r="10" fill="url(#bubbleGrad3)" stroke={color} strokeWidth="1.5" />
      <circle cx="55" cy="25" r="8" fill="url(#bubbleGrad4)" stroke={color} strokeWidth="1.5" />
      
      {/* Sparkle effect */}
      <path d="M25 25 L27 20 L29 25 L34 27 L29 29 L27 34 L25 29 L20 27 Z" fill="#FFD700" />
      <path d="M80 30 L81 27 L82 30 L85 31 L82 32 L81 35 L80 32 L77 31 Z" fill="#FFD700" />
      
      {/* Gradients */}
      <defs>
        <radialGradient id="bubbleGrad1" cx="30%" cy="30%">
          <stop offset="0%" stopColor="white" />
          <stop offset="50%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </radialGradient>
        <radialGradient id="bubbleGrad2" cx="30%" cy="30%">
          <stop offset="0%" stopColor="white" />
          <stop offset="50%" stopColor="#FFB3BA" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FFB3BA" stopOpacity="0.3" />
        </radialGradient>
        <radialGradient id="bubbleGrad3" cx="30%" cy="30%">
          <stop offset="0%" stopColor="white" />
          <stop offset="50%" stopColor="#BAE1FF" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#BAE1FF" stopOpacity="0.3" />
        </radialGradient>
        <radialGradient id="bubbleGrad4" cx="30%" cy="30%">
          <stop offset="0%" stopColor="white" />
          <stop offset="50%" stopColor="#BAFFC9" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#BAFFC9" stopOpacity="0.3" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function ShadowMatchIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Background */}
      <rect x="5" y="5" width="90" height="90" rx="12" fill="#F3E5F5" stroke={color} strokeWidth="2" />
      
      {/* Left side - colored objects */}
      <g transform="translate(15, 20)">
        {/* Star */}
        <path d="M15 5 L17 12 L24 12 L18 17 L20 24 L15 20 L10 24 L12 17 L6 12 L13 12 Z" fill={color} />
      </g>
      
      <g transform="translate(15, 50)">
        {/* Heart */}
        <path d="M15 10 C10 5 3 8 3 14 C3 20 15 28 15 28 C15 28 27 20 27 14 C27 8 20 5 15 10" fill="#FF6B6B" />
      </g>
      
      {/* Center arrow */}
      <path d="M42 50 L52 50 L52 45 L60 50 L52 55 L52 50" fill="#333" />
      
      {/* Right side - shadows */}
      <g transform="translate(60, 20)">
        {/* Star shadow */}
        <path d="M15 5 L17 12 L24 12 L18 17 L20 24 L15 20 L10 24 L12 17 L6 12 L13 12 Z" fill="#333" opacity="0.7" filter="url(#shadowBlur)" />
      </g>
      
      <g transform="translate(60, 50)">
        {/* Heart shadow */}
        <path d="M15 10 C10 5 3 8 3 14 C3 20 15 28 15 28 C15 28 27 20 27 14 C27 8 20 5 15 10" fill="#333" opacity="0.7" filter="url(#shadowBlur)" />
      </g>
      
      {/* Question mark */}
      <text x="50" y="90" fontSize="14" fontWeight="bold" fill={color} textAnchor="middle">?</text>
      
      {/* Definitions */}
      <defs>
        <filter id="shadowBlur">
          <feGaussianBlur stdDeviation="1" />
        </filter>
      </defs>
    </svg>
  );
}

function ColorMixLabIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Background */}
      <rect x="5" y="5" width="90" height="90" rx="12" fill="#FFF8E1" stroke={color} strokeWidth="2" />
      
      {/* Beaker */}
      <path d="M30 20 L30 55 L25 80 L75 80 L70 55 L70 20 Z" fill="white" stroke="#666" strokeWidth="2" />
      
      {/* Liquid in beaker */}
      <path d="M32 50 L28 78 L72 78 L68 50 Z" fill="url(#colorMixGrad)" />
      
      {/* Primary color bottles */}
      <circle cx="20" cy="30" r="8" fill="#EF5350" />
      <circle cx="50" cy="15" r="8" fill="#FFCA28" />
      <circle cx="80" cy="30" r="8" fill="#42A5F5" />
      
      {/* Droplets */}
      <circle cx="35" cy="40" r="4" fill="#EF5350" opacity="0.7" />
      <circle cx="50" cy="35" r="4" fill="#FFCA28" opacity="0.7" />
      <circle cx="65" cy="42" r="4" fill="#42A5F5" opacity="0.7" />
      
      {/* Bubbles */}
      <circle cx="40" cy="60" r="3" fill="white" opacity="0.5" />
      <circle cx="55" cy="65" r="2" fill="white" opacity="0.4" />
      <circle cx="60" cy="55" r="2.5" fill="white" opacity="0.5" />
      
      {/* Gradient for mixed color */}
      <defs>
        <linearGradient id="colorMixGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF5350" />
          <stop offset="50%" stopColor="#FF9800" />
          <stop offset="100%" stopColor="#FFCA28" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function RhythmTilesIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Background */}
      <rect x="5" y="5" width="90" height="90" rx="12" fill="#1a1a2e" stroke={color} strokeWidth="2" />
      
      {/* Lane dividers */}
      <line x1="27" y1="10" x2="27" y2="90" stroke="#2a2a4a" strokeWidth="1" />
      <line x1="50" y1="10" x2="50" y2="90" stroke="#2a2a4a" strokeWidth="1" />
      <line x1="73" y1="10" x2="73" y2="90" stroke="#2a2a4a" strokeWidth="1" />
      
      {/* Target line */}
      <line x1="10" y1="70" x2="90" y2="70" stroke="white" strokeWidth="2" opacity="0.5" />
      
      {/* Falling tiles */}
      <rect x="10" y="20" width="15" height="25" rx="3" fill="#FF6B6B" />
      <rect x="54" y="35" width="15" height="25" rx="3" fill="#FFE66D" />
      <rect x="77" y="15" width="15" height="25" rx="3" fill="#957DAD" />
      
      {/* Hold tile (longer) */}
      <rect x="31" y="45" width="15" height="40" rx="3" fill="#4ECDC4" />
      
      {/* Hit effect at target line */}
      <circle cx="17" cy="70" r="8" fill={color} opacity="0.6" />
      
      {/* Music notes */}
      <text x="80" y="25" fontSize="14" fill={color}>♪</text>
      <text x="15" y="50" fontSize="10" fill={color} opacity="0.7">♫</text>
    </svg>
  );
}

function GravityDrawIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Background */}
      <rect x="5" y="5" width="90" height="90" rx="12" fill="#1a1a2e" stroke={color} strokeWidth="2" />
      
      {/* Drawn platform */}
      <path d="M20 60 Q35 55 50 60 T80 55" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
      
      {/* Bouncy platform */}
      <path d="M15 80 L40 75" stroke="#4ECDC4" strokeWidth="4" fill="none" strokeLinecap="round" />
      
      {/* Ball */}
      <circle cx="30" cy="35" r="12" fill="#FF6B6B" />
      <circle cx="26" cy="31" r="4" fill="#FF8A8A" />
      
      {/* Ball trail */}
      <path d="M30 35 L35 45 L30 50 L35 55" stroke="#FF6B6B" strokeWidth="2" fill="none" opacity="0.3" strokeDasharray="3,3" />
      
      {/* Goal */}
      <circle cx="75" cy="75" r="10" fill="#4ECDC4" />
      <circle cx="75" cy="75" r="5" fill="white" />
      
      {/* Arrow showing direction */}
      <path d="M32 42 L35 55" stroke={color} strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
      
      {/* Pencil icon */}
      <text x="15" y="20" fontSize="14" fill={color}>✏️</text>
      
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={color} />
        </marker>
      </defs>
    </svg>
  );
}

function PatternRepeatIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Background */}
      <rect x="5" y="5" width="90" height="90" rx="12" fill="#1a1a2e" stroke={color} strokeWidth="2" />
      
      {/* 2x2 Button grid */}
      <rect x="15" y="15" width="30" height="30" rx="6" fill="#FF6B6B" opacity="0.9" />
      <rect x="55" y="15" width="30" height="30" rx="6" fill="#4ECDC4" opacity="0.9" />
      <rect x="15" y="55" width="30" height="30" rx="6" fill="#FFE66D" opacity="0.7" />
      <rect x="55" y="55" width="30" height="30" rx="6" fill="#957DAD" opacity="0.9" />
      
      {/* Highlight on one button (showing pattern) */}
      <rect x="55" y="15" width="30" height="30" rx="6" fill="white" opacity="0.3" />
      
      {/* Numbers */}
      <text x="30" y="36" fontSize="12" fill="white" textAnchor="middle" opacity="0.5">1</text>
      <text x="70" y="36" fontSize="12" fill="white" textAnchor="middle" opacity="0.5">2</text>
      <text x="30" y="76" fontSize="12" fill="white" textAnchor="middle" opacity="0.5">3</text>
      <text x="70" y="76" fontSize="12" fill="white" textAnchor="middle" opacity="0.5">4</text>
      
      {/* Music note */}
      <text x="85" y="85" fontSize="16" fill={color}>♪</text>
      
      {/* Pattern sequence dots */}
      <circle cx="25" cy="95" r="3" fill={color} />
      <circle cx="40" cy="95" r="3" fill={color} opacity="0.7" />
      <circle cx="55" cy="95" r="3" fill={color} opacity="0.4" />
      <circle cx="70" cy="95" r="3" fill="none" stroke={color} strokeWidth="1" strokeDasharray="2,2" />
    </svg>
  );
}

function WordSnakeIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Background */}
      <rect x="5" y="5" width="90" height="90" rx="12" fill="#E8F5E9" stroke={color} strokeWidth="2" />
      
      {/* Grid cells */}
      <rect x="12" y="12" width="18" height="18" rx="3" fill="white" stroke="#ccc" />
      <rect x="32" y="12" width="18" height="18" rx="3" fill="white" stroke="#ccc" />
      <rect x="52" y="12" width="18" height="18" rx="3" fill="white" stroke="#ccc" />
      <rect x="72" y="12" width="18" height="18" rx="3" fill="white" stroke="#ccc" />
      
      <rect x="12" y="32" width="18" height="18" rx="3" fill={color} />
      <rect x="32" y="32" width="18" height="18" rx="3" fill={color} opacity="0.8" />
      <rect x="52" y="32" width="18" height="18" rx="3" fill={color} opacity="0.6" />
      <rect x="72" y="32" width="18" height="18" rx="3" fill="white" stroke="#ccc" />
      
      <rect x="12" y="52" width="18" height="18" rx="3" fill="white" stroke="#ccc" />
      <rect x="32" y="52" width="18" height="18" rx="3" fill="white" stroke="#ccc" />
      <rect x="52" y="52" width="18" height="18" rx="3" fill="white" stroke="#ccc" />
      <rect x="72" y="52" width="18" height="18" rx="3" fill="white" stroke="#ccc" />
      
      {/* Letters on selected cells */}
      <text x="21" y="46" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">C</text>
      <text x="41" y="46" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">A</text>
      <text x="61" y="46" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">T</text>
      
      {/* Snake connection line */}
      <path d="M21 41 Q31 41 41 41 Q51 41 61 41" stroke={color} strokeWidth="2" fill="none" strokeDasharray="4,2" />
      
      {/* Snake head decoration */}
      <circle cx="61" cy="41" r="2" fill={color} />
      
      {/* Word displayed */}
      <text x="50" y="82" fontSize="14" fontWeight="bold" fill={color} textAnchor="middle">CAT</text>
      
      {/* Score indicator */}
      <text x="50" y="95" fontSize="10" fill="#666" textAnchor="middle">+5 pts</text>
    </svg>
  );
}

function WordSearchIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Grid background */}
      <rect x="10" y="10" width="80" height="80" rx="8" fill="#ffffff" stroke={color} strokeWidth="3" />
      
      {/* Letter grid - Row 1 */}
      <text x="22" y="38" fontSize="16" fontWeight="bold" fill="#333">C</text>
      <text x="42" y="38" fontSize="16" fontWeight="bold" fill="#333">A</text>
      <text x="62" y="38" fontSize="16" fontWeight="bold" fill={color}>T</text>
      <text x="82" y="38" fontSize="16" fontWeight="bold" fill="#333" textAnchor="end">S</text>
      
      {/* Letter grid - Row 2 */}
      <text x="22" y="58" fontSize="16" fontWeight="bold" fill="#333">D</text>
      <text x="42" y="58" fontSize="16" fontWeight="bold" fill={color}>O</text>
      <text x="62" y="58" fontSize="16" fontWeight="bold" fill="#333">G</text>
      <text x="82" y="58" fontSize="16" fontWeight="bold" fill="#333" textAnchor="end">B</text>
      
      {/* Letter grid - Row 3 */}
      <text x="22" y="78" fontSize="16" fontWeight="bold" fill={color}>F</text>
      <text x="42" y="78" fontSize="16" fontWeight="bold" fill={color}>I</text>
      <text x="62" y="78" fontSize="16" fontWeight="bold" fill={color}>S</text>
      <text x="82" y="78" fontSize="16" fontWeight="bold" fill="#333" textAnchor="end">H</text>
      
      {/* Highlight effect */}
      <circle cx="72" cy="70" r="12" fill={color} opacity="0.2" />
      
      {/* Magnifying glass */}
      <circle cx="78" cy="25" r="14" fill="none" stroke={color} strokeWidth="3" />
      <line x1="88" y1="35" x2="95" y2="42" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
