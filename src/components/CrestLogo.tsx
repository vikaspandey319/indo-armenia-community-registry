import React from 'react';

interface CrestLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  lightMode?: boolean;
  layout?: 'horizontal' | 'vertical';
}

/**
 * Official Indo Armenia LLC Logo
 * Faithfully matches the official Indo-Armenia LLC dual-flag emblem:
 * Waving Indian Flag & Armenian Flag with crossed flagpoles,
 * Gold "INDO ARMENIA LLC" typography and "GLOBAL PARTNERSHIP" subtitle.
 */
export const CrestLogo: React.FC<CrestLogoProps> = ({
  className = '',
  size = 48,
  showText = false,
  lightMode = false,
  layout = 'horizontal',
}) => {
  return (
    <div
      className={`flex items-center gap-3 ${
        layout === 'vertical' ? 'flex-col text-center' : 'flex-row'
      } ${className}`}
    >
      {/* Dual Waving Flags SVG */}
      <svg
        width={size}
        height={Math.round(size * 0.72)}
        viewBox="0 0 400 288"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md select-none transition-transform duration-300 hover:scale-105"
        role="img"
        aria-label="Indo Armenia LLC - Dual Flags Emblem"
      >
        <defs>
          {/* Gradients for dynamic flag wave lighting */}
          <linearGradient id="waveShade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="35%" stopColor="#000000" stopOpacity="0.1" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id="goldTextGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e5a93c" />
            <stop offset="50%" stopColor="#f5ca68" />
            <stop offset="100%" stopColor="#df9c2c" />
          </linearGradient>

          {/* Flag Clip Paths for Realistic Cloth Waves */}
          {/* Left Flag (India) Wave: x ~ 40 to 195, y ~ 35 to 175 */}
          <clipPath id="leftFlagWave">
            <path d="M 45 45 Q 115 15, 185 55 L 185 165 Q 115 125, 45 155 Z" />
          </clipPath>

          {/* Right Flag (Armenia) Wave: x ~ 205 to 355, y ~ 35 to 175 */}
          <clipPath id="rightFlagWave">
            <path d="M 215 55 Q 285 15, 355 45 L 355 155 Q 285 125, 215 165 Z" />
          </clipPath>
        </defs>

        {/* 1. Crossed Flagpoles */}
        {/* Left Pole (holding Indian Flag, angled right) */}
        <line
          x1="38"
          y1="38"
          x2="228"
          y2="200"
          stroke="#e2e8f0"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="38" cy="38" r="4.5" fill="#f5ca68" stroke="#d97706" strokeWidth="1" />

        {/* Right Pole (holding Armenian Flag, angled left) */}
        <line
          x1="362"
          y1="38"
          x2="172"
          y2="200"
          stroke="#cbd5e1"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="362" cy="38" r="4.5" fill="#f5ca68" stroke="#d97706" strokeWidth="1" />

        {/* 2. Indian Flag (Left) */}
        <g clipPath="url(#leftFlagWave)">
          {/* Top Saffron Stripe */}
          <path
            d="M 45 45 Q 115 15, 185 55 L 185 92 Q 115 52, 45 82 Z"
            fill="#FF9933"
          />
          {/* Middle White Stripe */}
          <path
            d="M 45 82 Q 115 52, 185 92 L 185 128 Q 115 88, 45 118 Z"
            fill="#FFFFFF"
          />
          {/* Bottom Green Stripe */}
          <path
            d="M 45 118 Q 115 88, 185 128 L 185 165 Q 115 125, 45 155 Z"
            fill="#138808"
          />

          {/* Ashoka Chakra in Center of White Band */}
          <g transform="translate(114, 90)">
            <circle cx="0" cy="0" r="14" stroke="#000080" strokeWidth="1.8" fill="none" />
            <circle cx="0" cy="0" r="2.8" fill="#000080" />
            {/* 24 Spokes */}
            {[0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345].map(
              (deg) => (
                <line
                  key={deg}
                  x1="0"
                  y1="0"
                  x2={13 * Math.cos((deg * Math.PI) / 180)}
                  y2={13 * Math.sin((deg * Math.PI) / 180)}
                  stroke="#000080"
                  strokeWidth="0.9"
                />
              )
            )}
          </g>

          {/* Shading overlay for wave */}
          <rect x="40" y="20" width="150" height="150" fill="url(#waveShade)" />
        </g>
        {/* Border outline for Left flag */}
        <path
          d="M 45 45 Q 115 15, 185 55 L 185 165 Q 115 125, 45 155 Z"
          fill="none"
          stroke="#000000"
          strokeWidth="1.5"
          opacity="0.25"
        />

        {/* 3. Armenian Flag (Right) */}
        <g clipPath="url(#rightFlagWave)">
          {/* Top Red Stripe */}
          <path
            d="M 215 55 Q 285 15, 355 45 L 355 82 Q 285 52, 215 92 Z"
            fill="#D90012"
          />
          {/* Middle Blue Stripe */}
          <path
            d="M 215 92 Q 285 52, 355 82 L 355 118 Q 285 88, 215 128 Z"
            fill="#0033A0"
          />
          {/* Bottom Orange/Apricot Stripe */}
          <path
            d="M 215 128 Q 285 88, 355 118 L 355 155 Q 285 125, 215 165 Z"
            fill="#F2A800"
          />

          {/* Shading overlay for wave */}
          <rect x="210" y="20" width="150" height="150" fill="url(#waveShade)" />
        </g>
        {/* Border outline for Right flag */}
        <path
          d="M 215 55 Q 285 15, 355 45 L 355 155 Q 285 125, 215 165 Z"
          fill="none"
          stroke="#000000"
          strokeWidth="1.5"
          opacity="0.25"
        />

        {/* 4. Decorative Curved Flourish below crossing poles */}
        <path
          d="M 90 240 Q 200 265, 310 240"
          stroke="#7dd3fc"
          strokeWidth="1.2"
          fill="none"
          opacity="0.8"
        />
        <circle cx="90" cy="240" r="2.5" fill="#7dd3fc" />
        <circle cx="310" cy="240" r="2.5" fill="#7dd3fc" />

        <path
          d="M 170 195 Q 200 215, 230 195"
          stroke="#e0f2fe"
          strokeWidth="1"
          fill="none"
          opacity="0.6"
        />
      </svg>

      {/* Brand Text Lockup */}
      {showText && (
        <div
          className={`flex flex-col ${
            layout === 'vertical' ? 'items-center mt-1' : 'items-start'
          }`}
        >
          <span
            className={`font-black tracking-wide text-lg sm:text-xl uppercase leading-none font-sans ${
              lightMode
                ? 'text-amber-600'
                : 'text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
            }`}
            style={{
              letterSpacing: '0.04em',
            }}
          >
            Indo Armenia LLC
          </span>
          <span
            className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.26em] mt-1 ${
              lightMode ? 'text-slate-600' : 'text-slate-300'
            }`}
          >
            Global Partnership
          </span>
        </div>
      )}
    </div>
  );
};
