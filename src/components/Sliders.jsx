import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SLIDERS = [
  { key: 'brightness', label: 'brightness', min: 0.3, max: 2.5, step: 0.01 },
  { key: 'contrast', label: 'contrast', min: 0.3, max: 2.5, step: 0.01 },
  { key: 'saturation', label: 'saturation', min: 0, max: 2.0, step: 0.01 },
  { key: 'grain', label: 'grain', min: 0, max: 0.4, step: 0.005 }
]

export default function Sliders({ values, onChange }) {
  return (
    <div style={{
      width: '100%', maxWidth: 360,
      display: 'flex', flexDirection: 'column',
      gap: 16, padding: '0 16px',
      margin: '0 auto', position: 'relative', zIndex: 10
    }}>
      {SLIDERS.map((s) => (
        <SliderItem
          key={s.key}
          {...s}
          value={values[s.key] ?? 1}
          onChange={(v) => onChange(s.key, v)}
        />
      ))}
    </div>
  )
}

function SliderItem({ key: k, label, min, max, step, value, onChange }) {
  const [isDragging, setIsDragging] = useState(false)
  const [showVal, setShowVal] = useState(false)
  const trackRef = useRef(null)
  const valTimeout = useRef(null)

  const pct = ((value - min) / (max - min)) * 100

  const updateFromEvent = useCallback((clientX) => {
    const el = trackRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    let p = (clientX - rect.left) / rect.width
    p = Math.max(0, Math.min(1, p))
    const newVal = min + p * (max - min)
    const stepped = Math.round(newVal / step) * step
    onChange(Math.round(stepped * 1000) / 1000)

    setShowVal(true)
    clearTimeout(valTimeout.current)
    valTimeout.current = setTimeout(() => setShowVal(false), 1200)
  }, [min, max, step, onChange])

  const handlePointerDown = (e) => {
    setIsDragging(true)
    updateFromEvent(e.clientX)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (!isDragging) return
    updateFromEvent(e.clientX)
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 6
      }}>
        <motion.span
          animate={isDragging ? { x: [-2, 2, -1, 1, 0], rotate: [-2, 2, -1, 1, 0] } : {}}
          transition={{ duration: 0.3 }}
          style={{
            fontFamily: 'var(--font-hand)',
            fontSize: 16, color: 'var(--text)',
            display: 'inline-block'
          }}
        >
          {label}
        </motion.span>
        <AnimatePresence>
          {showVal && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 4 }}
              transition={{ duration: 0.15 }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10, color: 'var(--text)',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {k === 'grain' ? (value * 100).toFixed(0) : value.toFixed(2)}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          width: '100%', height: 24,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center',
          position: 'relative',
          touchAction: 'none'
        }}
      >
        {/* Track */}
        <div style={{
          width: '100%', height: 6,
          background: 'var(--shadow)',
          borderRadius: 3,
          position: 'relative',
          filter: 'url(#sketch)'
        }}>
          <motion.div
            style={{
              height: '100%',
              background: 'var(--accent)',
              borderRadius: 3
            }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.05, ease: 'linear' }}
          />
        </div>

        {/* Thumb */}
        <motion.div
          animate={{
            left: `${pct}%`,
            scale: isDragging ? 1.5 : [1.15, 1.25, 1.15],
            rotate: isDragging ? [0, -5, 5, 0] : 0
          }}
          transition={{
            left: { duration: 0.05, ease: 'linear' },
            scale: isDragging ? { type: 'spring', stiffness: 500, damping: 20 } : { repeat: Infinity, duration: 2.5, ease: 'easeInOut' },
            rotate: { duration: 0.3 }
          }}
          style={{
            position: 'absolute', top: '50%',
            width: 24, height: 24,
            marginLeft: -12, marginTop: -12,
            background: 'var(--bg-card)',
            border: '3px solid var(--line)',
            borderRadius: '50%',
            boxShadow: '2px 2px 0 var(--shadow)',
            pointerEvents: 'none',
            filter: 'url(#sketch)'
          }}
        />
      </div>
    </div>
  )
}
