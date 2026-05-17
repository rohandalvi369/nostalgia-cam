import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DRAW_LINES = [
  'drawing a circle...',
  'adding some magic...',
  'almost there...',
  'done!'
]

export default function DevelopingOverlay({ image, onComplete }) {
  const [phase, setPhase] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const phases = [
      { at: 0, action: () => setPhase(0) },
      { at: 500, action: () => setPhase(1) },
      { at: 1000, action: () => setPhase(2) },
      { at: 1500, action: () => setPhase(3) },
      { at: 1800, action: () => {
        setPhase(4)
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.setValueAtTime(800, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08)
          gain.gain.setValueAtTime(0.3, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.1)
        } catch {}
      }},
      { at: 2000, action: () => {
        setPhase(5)
        setTimeout(() => onComplete?.(), 400)
      }}
    ]

    const timeouts = []
    const progressIv = setInterval(() => {
      setProgress(p => Math.min(100, p + 2.5))
    }, 40)

    phases.forEach(({ at, action }) => {
      timeouts.push(setTimeout(action, at))
    })

    return () => {
      timeouts.forEach(clearTimeout)
      clearInterval(progressIv)
    }
  }, [onComplete])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg)'
        }}
      >
        {/* Hatching background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 8px,
            rgba(180,165,140,0.08) 8px,
            rgba(180,165,140,0.08) 9px
          )`,
          animation: 'hatchMove 0.8s linear infinite',
          zIndex: 0
        }} />

        {/* Polaroid card */}
        <motion.div
          initial={{ y: 100, opacity: 0, rotate: -5 }}
          animate={{
            y: 0, opacity: 1,
            rotate: phase >= 4 ? 0 : [-5, -4, -6, -3, -5],
            scale: phase >= 4 ? 1.05 : 1
          }}
          transition={{
            type: 'spring', stiffness: 200, damping: 20,
            scale: { type: 'spring', stiffness: 400, damping: 15 }
          }}
          style={{
            width: 240, padding: '14px 14px 44px',
            background: 'var(--bg-card)',
            border: '3px solid var(--line)',
            borderRadius: 12,
            boxShadow: '4px 4px 0 var(--shadow)',
            filter: 'url(#sketch)',
            position: 'relative',
            zIndex: 1
          }}
        >
          <div style={{
            width: '100%', aspectRatio: '1',
            background: 'var(--shadow)',
            overflow: 'hidden', position: 'relative',
            borderRadius: 4
          }}>
            {image && (
              <motion.img
                src={image}
                alt=""
                initial={{ filter: 'blur(20px) brightness(0.8)' }}
                animate={{
                  filter: phase >= 3
                    ? 'blur(0px) brightness(1)'
                    : phase >= 1
                      ? 'blur(8px) brightness(0.85)'
                      : 'blur(20px) brightness(0.8)'
                }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover'
                }}
              />
            )}
          </div>

          {/* Scribing line animation */}
          <svg
            style={{
              position: 'absolute', bottom: 14, left: 14, right: 14,
              height: 6
            }}
            viewBox="0 0 212 6"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M0,3 Q26,0 53,3 T106,3 T159,3 T212,3"
              stroke="var(--shadow)"
              strokeWidth="3"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: progress / 100 }}
              transition={{ duration: 0.04, ease: 'linear' }}
            />
            <motion.path
              d="M0,3 Q26,0 53,3 T106,3 T159,3 T212,3"
              stroke="var(--accent)"
              strokeWidth="3"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: progress / 100 }}
              transition={{ duration: 0.04, ease: 'linear' }}
            />
          </svg>
        </motion.div>

        {/* Scribble loading text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.5], y: [0, -5, 0] }}
          transition={{ opacity: { duration: 0.5 }, y: { duration: 0.3, delay: 0.2 } }}
          style={{
            fontFamily: 'var(--font-hand)',
            fontSize: 20, color: 'var(--text)',
            marginTop: 24,
            opacity: phase >= 4 ? 0.3 : 0.6,
            position: 'relative', zIndex: 1
          }}
        >
          {phase < 1 && DRAW_LINES[0]}
          {phase >= 1 && phase < 2 && DRAW_LINES[1]}
          {phase >= 2 && phase < 3 && DRAW_LINES[2]}
          {phase >= 3 && phase < 4 && DRAW_LINES[3]}
          {phase >= 4 && '\u2713 done!'}
        </motion.p>

        {/* Bouncing dot */}
        <motion.div
          animate={{
            y: [0, -8, 0],
            opacity: phase >= 4 ? 0 : 1
          }}
          transition={{ repeat: Infinity, duration: 0.6 }}
          style={{
            width: 8, height: 8,
            background: 'var(--accent)',
            borderRadius: '50%',
            marginTop: 8,
            position: 'relative', zIndex: 1
          }}
        />
      </motion.div>
    </AnimatePresence>
  )
}
