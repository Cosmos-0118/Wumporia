import { motion } from 'motion/react'
import { useId } from 'react'

interface SpriteProps {
  className?: string
}

const base = { viewBox: '0 0 64 64', fill: 'none', 'aria-hidden': true } as const

function useUid(): string {
  return useId().replace(/:/g, '')
}

const fillBox = { transformBox: 'fill-box', transformOrigin: 'center' } as const

export function Explorer({ className }: SpriteProps) {
  const id = useUid()
  return (
    <motion.svg
      {...base}
      className={className}
      animate={{ y: [0, -1.5, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe4c9" />
          <stop offset="1" stopColor="#f0b184" />
        </linearGradient>
        <linearGradient id={`${id}-coat`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id={`${id}-helm`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fcd34d" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#fef9c3" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fef9c3" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="59" rx="15" ry="2.8" fill="#000" opacity="0.28" />
      {/* legs + boots */}
      <rect x="22.5" y="48" width="7" height="8" rx="2" fill="#1e3a8a" />
      <rect x="34.5" y="48" width="7" height="8" rx="2" fill="#1e3a8a" />
      <path d="M20.5 55.5h10v3a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2z" fill="#6b4423" />
      <path d="M33.5 55.5h10v3a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2z" fill="#6b4423" />
      {/* arms */}
      <rect x="11.5" y="36" width="7" height="13" rx="3.5" fill="#1e40af" />
      <rect x="45.5" y="36" width="7" height="13" rx="3.5" fill="#1e40af" />
      <circle cx="15" cy="50" r="3.3" fill={`url(#${id}-skin)`} />
      <circle cx="49" cy="50" r="3.3" fill={`url(#${id}-skin)`} />
      {/* torso */}
      <path
        d="M18 40a6 6 0 0 1 6-5h16a6 6 0 0 1 6 5v9a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2z"
        fill={`url(#${id}-coat)`}
      />
      <path d="M24 35.5 38 50" stroke="#7c4a1e" strokeWidth="3" strokeLinecap="round" />
      <rect x="18" y="44" width="28" height="3.2" fill="#7c4a1e" />
      <rect
        x="29.5"
        y="43.4"
        width="5"
        height="4.4"
        rx="1"
        fill="#fcd34d"
        stroke="#92400e"
        strokeWidth="0.8"
      />
      {/* head */}
      <circle cx="21" cy="26" r="2.6" fill={`url(#${id}-skin)`} />
      <circle cx="43" cy="26" r="2.6" fill={`url(#${id}-skin)`} />
      <circle cx="32" cy="26" r="11.2" fill={`url(#${id}-skin)`} />
      <circle cx="25" cy="31.5" r="2.4" fill="#fb7185" opacity="0.4" />
      <circle cx="39" cy="31.5" r="2.4" fill="#fb7185" opacity="0.4" />
      <motion.g
        style={fillBox}
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.46, 0.5, 0.54, 1] }}
      >
        <ellipse cx="27.6" cy="28.6" rx="1.9" ry="2.5" fill="#1f2937" />
        <ellipse cx="36.4" cy="28.6" rx="1.9" ry="2.5" fill="#1f2937" />
        <circle cx="28.2" cy="27.6" r="0.75" fill="#fff" />
        <circle cx="37" cy="27.6" r="0.75" fill="#fff" />
      </motion.g>
      <path d="M28.6 33.4q3.4 2.6 6.8 0" stroke="#7c2d12" strokeWidth="1.5" strokeLinecap="round" />
      {/* helmet */}
      <path d="M20 22.5a12 11.5 0 0 1 24 0z" fill={`url(#${id}-helm)`} />
      <path
        d="M26 12.5q6-3 12 0"
        stroke="#fef3c7"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.6"
      />
      <rect x="17" y="21.5" width="30" height="3.6" rx="1.8" fill="#b45309" />
      <rect x="29.5" y="10" width="5" height="9" rx="2.5" fill="#92400e" />
      <motion.circle
        cx="32"
        cy="15"
        r="8"
        fill={`url(#${id}-glow)`}
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <circle cx="32" cy="15" r="3.3" fill="#fef9c3" stroke="#92400e" strokeWidth="1" />
    </motion.svg>
  )
}

export function Wumpus({ className }: SpriteProps) {
  const id = useUid()
  return (
    <motion.svg {...base} className={className}>
      <defs>
        <radialGradient id={`${id}-fur`} cx="0.4" cy="0.25" r="0.9">
          <stop offset="0" stopColor="#bbf7d0" />
          <stop offset="0.45" stopColor="#4ade80" />
          <stop offset="1" stopColor="#15803d" />
        </radialGradient>
        <linearGradient id={`${id}-horn`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fef9c3" />
          <stop offset="1" stopColor="#d4a24c" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="60" rx="20" ry="3" fill="#000" opacity="0.28" />
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
        animate={{ scaleY: [1, 1.035, 1], scaleX: [1, 0.99, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* horns */}
        <path
          d="M17 21C12 16 10 10 11 3c6 3 11 8 13 14z"
          fill={`url(#${id}-horn)`}
          stroke="#a16207"
          strokeWidth="0.8"
        />
        <path
          d="M47 21c5-5 7-11 6-18-6 3-11 8-13 14z"
          fill={`url(#${id}-horn)`}
          stroke="#a16207"
          strokeWidth="0.8"
        />
        {/* arms */}
        <ellipse cx="9" cy="43" rx="5" ry="8" transform="rotate(18 9 43)" fill="#22a85a" />
        <ellipse cx="55" cy="43" rx="5" ry="8" transform="rotate(-18 55 43)" fill="#22a85a" />
        <path
          d="M5 49l1.4 4 2-3.2zm4 1 1.6 3.8 1.6-3.6zm44.4-1-2 3.2 2 .8zm-4 1.4 1.6 3.6 1.6-3.8z"
          fill="#fef3c7"
        />
        {/* body */}
        <path
          d="M8 40C8 21 18 11 32 11s24 10 24 29c0 13-9 19-24 19S8 53 8 40z"
          fill={`url(#${id}-fur)`}
        />
        <path
          d="M25 12.5l3 4 4-4.5 4 4.5 3-4"
          stroke="#15803d"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
        <ellipse cx="32" cy="50" rx="14" ry="8" fill="#d9f99d" opacity="0.45" />
        <circle cx="17" cy="47" r="1.4" fill="#166534" opacity="0.25" />
        <circle cx="48" cy="46" r="1.8" fill="#166534" opacity="0.25" />
        <circle cx="14" cy="38" r="1.2" fill="#166534" opacity="0.25" />
        {/* eyes */}
        <motion.g
          style={fillBox}
          animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
          transition={{ duration: 4.2, repeat: Infinity, times: [0, 0.46, 0.5, 0.54, 1] }}
        >
          <circle cx="23.5" cy="31" r="7.2" fill="#fff" stroke="#14532d" strokeWidth="1.2" />
          <circle cx="40.5" cy="31" r="7.2" fill="#fff" stroke="#14532d" strokeWidth="1.2" />
          <circle cx="24.5" cy="31.6" r="4.2" fill="#facc15" />
          <circle cx="39.5" cy="31.6" r="4.2" fill="#facc15" />
          <ellipse cx="24.5" cy="31.6" rx="1.2" ry="3.4" fill="#111" />
          <ellipse cx="39.5" cy="31.6" rx="1.2" ry="3.4" fill="#111" />
          <circle cx="22.8" cy="29" r="1.2" fill="#fff" />
          <circle cx="38" cy="29" r="1.2" fill="#fff" />
        </motion.g>
        <path
          d="M15.5 24 29.5 28.5M48.5 24 34.5 28.5"
          stroke="#14532d"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* nostrils */}
        <circle cx="30" cy="37" r="0.9" fill="#14532d" />
        <circle cx="34" cy="37" r="0.9" fill="#14532d" />
        {/* mouth */}
        <path d="M19 43Q32 58 45 43Q32 48 19 43z" fill="#450a0a" />
        <path d="M27 51.5q5-3.5 10 0q-5 3-10 0z" fill="#f87171" />
        <path d="M22.5 44.4l2.6 4.6 2.6-3.6zM36.3 45.4l2.6 3.6 2.6-4.6z" fill="#fff" />
        <path d="M29.5 46.4l1.4 2.8 1.4-2.8z" fill="#fff" />
      </motion.g>
    </motion.svg>
  )
}

export function Pit({ className }: SpriteProps) {
  const id = useUid()
  return (
    <svg {...base} className={className}>
      <defs>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6d3d1" />
          <stop offset="1" stopColor="#57534e" />
        </linearGradient>
        <radialGradient id={`${id}-hole`} cx="0.5" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="0.55" stopColor="#0c0a09" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="42" rx="27" ry="15" fill="#000" opacity="0.22" />
      <ellipse cx="32" cy="36" rx="26" ry="17" fill={`url(#${id}-rim)`} />
      <ellipse cx="32" cy="38" rx="21" ry="13.5" fill="#292524" />
      <ellipse cx="32" cy="39" rx="19" ry="12" fill={`url(#${id}-hole)`} />
      <motion.ellipse
        cx="32"
        cy="40"
        rx="10"
        ry="5.5"
        fill="none"
        stroke="#a1a1aa"
        strokeWidth="0.8"
        animate={{ opacity: [0.05, 0.3, 0.05], scale: [0.7, 1.15, 0.7] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={fillBox}
      />
      <path
        d="M9 33q8-13 23-13t23 13"
        stroke="#f5f5f4"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.5"
      />
      <ellipse cx="10.5" cy="38" rx="3.2" ry="2.4" fill="#78716c" />
      <ellipse cx="52" cy="36" rx="3.6" ry="2.6" fill="#a8a29e" />
      <ellipse cx="20" cy="51" rx="3" ry="2" fill="#78716c" />
      <ellipse cx="46" cy="50" rx="2.6" ry="1.8" fill="#a8a29e" />
      <ellipse cx="32" cy="23" rx="3" ry="2" fill="#a8a29e" />
    </svg>
  )
}

export function Breeze({ className }: SpriteProps) {
  const id = useUid()
  const lines = [
    { d: 'M6 22h32a8 8 0 1 0-8-8', delay: 0 },
    { d: 'M6 34h46a9 9 0 1 1-9 9', delay: 0.3 },
    { d: 'M6 46h22a6 6 0 1 1-6 6', delay: 0.6 },
  ]
  return (
    <svg {...base} className={className}>
      <defs>
        <linearGradient id={`${id}-wind`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#bae6fd" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      {lines.map((line) => (
        <motion.path
          key={line.d}
          d={line.d}
          stroke={`url(#${id}-wind)`}
          strokeWidth="4"
          strokeLinecap="round"
          animate={{ x: [0, 4, 0], opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: line.delay }}
        />
      ))}
    </svg>
  )
}

export function Stench({ className }: SpriteProps) {
  const id = useUid()
  const wisps = [
    { d: 'M18 56c-8-8 8-12 0-20s8-12 0-20', delay: 0 },
    { d: 'M32 58c-8-8 8-12 0-20s8-12 0-20', delay: 0.5 },
    { d: 'M46 56c-8-8 8-12 0-20s8-12 0-20', delay: 1 },
  ]
  return (
    <svg {...base} className={className}>
      <defs>
        <linearGradient id={`${id}-gas`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#84cc16" />
          <stop offset="1" stopColor="#d9f99d" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {wisps.map((wisp) => (
        <motion.path
          key={wisp.d}
          d={wisp.d}
          stroke={`url(#${id}-gas)`}
          strokeWidth="4"
          strokeLinecap="round"
          animate={{ y: [4, -4, 4], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: wisp.delay }}
        />
      ))}
    </svg>
  )
}

export function Glitter({ className }: SpriteProps) {
  return (
    <motion.svg
      {...base}
      className={className}
      animate={{ scale: [0.8, 1.1, 0.8], rotate: [0, 20, 0] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path
        d="M32 4c2 15 5 23 28 28-23 5-26 13-28 28-2-15-5-23-28-28 23-5 26-13 28-28z"
        fill="#fbbf24"
      />
      <path
        d="M32 14c1.4 10 4 14 14 18-10 4-12.6 8-14 18-1.4-10-4-14-14-18 10-4 12.6-8 14-18z"
        fill="#fef3c7"
      />
    </motion.svg>
  )
}

export function Gold({ className }: SpriteProps) {
  const bar = (x: number, y: number) => (
    <g key={`${String(x)}-${String(y)}`}>
      <path d={`M${String(x)} ${String(y + 6)}l5-6h18l5 6z`} fill="#fde68a" />
      <rect x={x} y={y + 6} width="28" height="10" rx="2" fill="#f59e0b" />
      <rect x={x} y={y + 6} width="28" height="3" rx="1.5" fill="#fbbf24" />
    </g>
  )
  return (
    <svg {...base} className={className}>
      <ellipse cx="32" cy="56" rx="24" ry="3.5" fill="#000" opacity="0.2" />
      {bar(4, 38)}
      {bar(32, 38)}
      {bar(18, 22)}
      <motion.g
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '48px 14px' }}
      >
        <path d="M48 8v12M42 14h12" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      </motion.g>
    </svg>
  )
}

export function VacuumBot({ className }: SpriteProps) {
  return (
    <svg {...base} className={className}>
      <ellipse cx="32" cy="56" rx="19" ry="3" fill="#000" opacity="0.25" />
      <circle cx="32" cy="32" r="22" fill="#e4e4e7" />
      <circle cx="32" cy="32" r="22" stroke="#a1a1aa" strokeWidth="2" />
      <circle cx="32" cy="32" r="13" fill="#27272a" />
      <motion.circle
        cx="32"
        cy="32"
        r="4"
        fill="#38bdf8"
        animate={{ opacity: [1, 0.35, 1] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
      <path d="M18 14q14-7 28 0" stroke="#71717a" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Dirt({ className }: SpriteProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="22" cy="36" r="5" fill="#a16207" />
      <circle cx="38" cy="30" r="7" fill="#854d0e" />
      <circle cx="44" cy="44" r="4" fill="#a16207" />
      <circle cx="28" cy="46" r="3.5" fill="#713f12" />
      <circle cx="30" cy="24" r="2.5" fill="#a16207" />
    </svg>
  )
}

export function Flag({ className }: SpriteProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 54V10" stroke="#e4e4e7" strokeWidth="4" strokeLinecap="round" />
      <path d="M22 12h26l-7 10 7 10H22z" fill="#f43f5e" />
    </svg>
  )
}

export function Robot({ className }: SpriteProps) {
  return (
    <motion.svg
      {...base}
      className={className}
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ellipse cx="32" cy="58" rx="14" ry="3" fill="#000" opacity="0.25" />
      <path d="M32 6v8" stroke="#a1a1aa" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="6" r="3" fill="#f43f5e" />
      <rect x="14" y="14" width="36" height="28" rx="9" fill="#e4e4e7" />
      <rect x="19" y="20" width="26" height="14" rx="6" fill="#18181b" />
      <circle cx="26" cy="27" r="3" fill="#38bdf8" />
      <circle cx="38" cy="27" r="3" fill="#38bdf8" />
      <rect x="20" y="44" width="24" height="10" rx="5" fill="#a1a1aa" />
    </motion.svg>
  )
}
