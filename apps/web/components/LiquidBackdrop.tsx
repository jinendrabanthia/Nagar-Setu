"use client";

export function LiquidBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Subtle top-left champagne / muted burgundy radial wash */}
      <div
        className="animate-liquid-slow absolute -top-[18%] -left-[10%] h-[58vh] w-[58vw] rounded-full opacity-55 blur-[110px]"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, var(--accent-blush) 0%, var(--accent-soft) 45%, transparent 72%)",
        }}
      />

      {/* Soft copper / champagne flowing reflection on right */}
      <div
        className="animate-liquid-slow absolute top-[18%] -right-[14%] h-[62vh] w-[52vw] rounded-full opacity-45 blur-[120px]"
        style={{
          animationDelay: "-12s",
          background:
            "radial-gradient(circle at 60% 45%, var(--accent-champagne) 0%, transparent 70%)",
        }}
      />

      {/* Organic curved architectural silk waves */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.28]"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="liquidWaveA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-champagne)" stopOpacity="0.35" />
            <stop offset="55%" stopColor="var(--accent-copper)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="liquidWaveB" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-blush)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--accent-copper)" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path
          d="M-60 220 C 260 110, 560 350, 920 210 C 1180 110, 1340 200, 1500 140 L 1500 0 L -60 0 Z"
          fill="url(#liquidWaveA)"
        />
        <path
          d="M-60 900 L -60 660 C 240 580, 520 770, 880 650 C 1150 560, 1320 690, 1500 620 L 1500 900 Z"
          fill="url(#liquidWaveB)"
        />
      </svg>
    </div>
  );
}
