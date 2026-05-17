import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState(0)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 600)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase !== 1) return
    const t = setTimeout(() => {
      setFlash(true)
      setPhase(2)
      setTimeout(() => setFlash(false), 300)
    }, 1200)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 2) return
    const t = setTimeout(() => onComplete?.(), 1000)
    return () => clearTimeout(t)
  }, [phase, onComplete])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg)',
          overflow: 'hidden'
        }}
      >
        {flash && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              position: 'absolute', inset: 0,
              background: 'var(--accent)', zIndex: 100
            }}
          />
        )}

        {/* Hand-drawn title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: -2 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            fontFamily: 'var(--font-hand)',
            fontSize: 48, color: 'var(--text)',
            position: 'relative', zIndex: 1
          }}
        >
          nostalgia cam
          <svg
            style={{ position: 'absolute', bottom: -6, left: 0, width: '100%', height: 10 }}
            viewBox="0 0 100 10"
            preserveAspectRatio="none"
          >
            <path
              d="M0,5 Q12.5,0 25,5 T50,5 T75,5 T100,5"
              stroke="var(--accent)"
              strokeWidth="2.5"
              fill="none"
            />
          </svg>
        </motion.h1>

        {/* Sketchy progress bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: phase >= 1 ? 200 : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{
            height: 8,
            background: 'var(--bg-card)',
            border: '3px solid var(--line)',
            borderRadius: 4,
            boxShadow: '3px 3px 0 var(--shadow)',
            filter: 'url(#sketch)',
            marginTop: 40,
            position: 'relative',
            zIndex: 1,
            overflow: 'hidden'
          }}
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: phase >= 1 ? '100%' : '0%' }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            style={{
              height: '100%',
              background: 'var(--accent)'
            }}
          />
        </motion.div>

        {/* Film strip frames */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          style={{
            display: 'flex', gap: 6, marginTop: 30,
            filter: 'url(#sketch)', zIndex: 1
          }}
        >
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{
              width: 32, height: 32,
              border: '2px solid var(--line)',
              background: 'var(--bg-card)',
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 16, height: 16,
                background: 'var(--accent)',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.3 + i * 0.15
              }} />
            </div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          style={{
            fontFamily: 'var(--font-body)', fontSize: 16,
            color: 'var(--text)', marginTop: 12,
            zIndex: 1
          }}
        >
          est. 2007
        </motion.p>

        {/* Doodle accents */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'absolute', zIndex: 0,
            color: 'rgba(0,0,0,0.06)',
            fontSize: 24,
            pointerEvents: 'none',
            animation: 'float-drift 8s ease-in-out infinite'
          }}
        >
          <motion.span
            animate={{ y: [0, -15, 5, -8, 0], rotate: [0, 10, -5, 8, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: -120, left: -160, display: 'inline-block' }}
          >{'\u2605'}</motion.span>
          <motion.span
            animate={{ y: [0, 12, -8, 5, 0], rotate: [0, -8, 12, -5, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut', delay: 0.5 }}
            style={{ position: 'absolute', top: -100, right: -140, display: 'inline-block' }}
          >{'\u2665'}</motion.span>
          <motion.span
            animate={{ y: [0, -10, 15, -5, 0], rotate: [0, 15, -10, 5, 0] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut', delay: 1 }}
            style={{ position: 'absolute', bottom: -100, left: -120, display: 'inline-block' }}
          >{'\u2744'}</motion.span>
          <motion.span
            animate={{ y: [0, 8, -12, 10, 0], rotate: [0, -12, 8, -10, 0] }}
            transition={{ repeat: Infinity, duration: 5.5, ease: 'easeInOut', delay: 0.3 }}
            style={{ position: 'absolute', bottom: -80, right: -160, display: 'inline-block' }}
          >{'\u2606'}</motion.span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
