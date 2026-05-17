import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CTABar({ hasImage, onShare, onSave }) {
  const [state, setState] = useState('idle')
  const targetCount = useRef(Math.floor(Math.random() * 140) + 60)
  const [displayCount, setDisplayCount] = useState(0)
  const [confetti, setConfetti] = useState([])
  const confettiId = useRef(0)

  useEffect(() => {
    const target = targetCount.current
    const steps = 20
    let i = 0
    const iv = setInterval(() => {
      i++
      const eased = 1 - Math.pow(1 - i / steps, 3)
      setDisplayCount(Math.floor(eased * target))
      if (i >= steps) clearInterval(iv)
    }, 30)
    return () => clearInterval(iv)
  }, [])

  const spawnConfetti = useCallback(() => {
    const items = []
    const shapes = ['star', 'heart', 'circle']
    for (let i = 0; i < 12; i++) {
      const id = ++confettiId.current
      items.push({
        id,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        x: 40 + Math.random() * 20,
        delay: Math.random() * 0.3,
        color: ['var(--accent)', 'var(--yellow)', 'var(--blue)', 'var(--green)'][Math.floor(Math.random() * 4)]
      })
    }
    setConfetti(items)
    setTimeout(() => setConfetti([]), 1500)
  }, [])

  const handleClick = useCallback(async () => {
    if (state !== 'idle') return
    setState('loading')
    await new Promise(r => setTimeout(r, 800))
    setState('success')
    spawnConfetti()
    onShare?.()
    setTimeout(() => setState('idle'), 3000)
  }, [state, onShare, spawnConfetti])

  if (!hasImage) {
    return (
      <div style={{ height: 100 }} />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      style={{
        width: '100%', maxWidth: 360,
        margin: '0 auto', padding: '0 16px 20px',
        position: 'relative', zIndex: 10
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        style={{
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
          fontSize: 13, color: 'var(--text-dim)',
          marginBottom: 12
        }}
      >
        <motion.span
          key={displayCount}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          style={{ display: 'inline-block' }}
        >
          {displayCount}
        </motion.span>{' '}people exported a Reel today
      </motion.div>

      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
        <motion.button
          onClick={onSave}
          whileHover={{ y: -2, boxShadow: '4px 4px 0 var(--shadow)' }}
          whileTap={{ y: 3, boxShadow: '2px 2px 0 var(--shadow)' }}
          style={{
            flex: 1, height: 52,
            border: '3px solid var(--line)',
            borderRadius: 12,
            cursor: 'pointer',
            fontFamily: 'var(--font-hand)',
            fontSize: 18,
            background: 'var(--bg-card)',
            color: 'var(--text)',
            boxShadow: '3px 3px 0 var(--shadow)',
            filter: 'url(#sketch)'
          }}
        >
          save
        </motion.button>

        <motion.button
          onClick={handleClick}
          disabled={state === 'loading'}
          whileHover={{ y: -2, boxShadow: '7px 7px 0 var(--shadow)' }}
          whileTap={{ y: 4, boxShadow: '2px 2px 0 var(--shadow)' }}
          animate={state === 'idle' ? { scale: [1, 1.015, 1] } : {}}
          transition={state === 'idle' ? { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } : {}}
          style={{
            flex: 2, height: 52,
            border: '3px solid var(--line)',
            borderRadius: 12,
            cursor: state === 'success' ? 'default' : 'pointer',
            fontFamily: 'var(--font-hand)',
            fontSize: 20,
            position: 'relative',
            overflow: 'hidden',
            background: state === 'success' ? 'var(--bg-card)' : 'var(--text)',
            color: state === 'success' ? 'var(--text)' : 'var(--bg)',
            boxShadow: '5px 5px 0 var(--shadow)',
            filter: 'url(#sketch)'
          }}
        >
          <AnimatePresence mode="wait">
            {state === 'idle' && (
              <motion.span
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {'\u2192'} share
              </motion.span>
            )}
            {state === 'loading' && (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                preparing...
              </motion.span>
            )}
            {state === 'success' && (
              <motion.span
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                {'\u2713'} shared!
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Confetti */}
      {confetti.map(item => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0, x: '50%', y: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.5, 1, 0],
            y: [-10, -60, -100, -140],
            x: [`calc(50% + ${item.x - 10}px)`, `calc(50% + ${item.x + 5}px)`, `calc(50% + ${item.x - 5}px)`, `calc(50% + ${item.x + 10}px)`]
          }}
          transition={{ duration: 1, delay: item.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute', bottom: 60, left: 0, right: 0,
            width: 12, height: 12,
            pointerEvents: 'none',
            zIndex: 20,
            color: item.color
          }}
        >
          {item.shape === 'star' && '\u2605'}
          {item.shape === 'heart' && '\u2665'}
          {item.shape === 'circle' && '\u25CF'}
        </motion.div>
      ))}
    </motion.div>
  )
}
