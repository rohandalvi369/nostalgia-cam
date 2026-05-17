import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function UploadZone({ onImage, hasImage, compact }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const maxDim = 1600
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = (height / width) * maxDim; width = maxDim }
          else { width = (width / height) * maxDim; height = maxDim }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        onImage(canvas.toDataURL('image/jpeg', 0.92))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }, [onImage])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }, [handleFile])

  const handleClick = () => inputRef.current?.click()
  const handleChange = (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0])
  }

  if (compact) {
    return (
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'relative', zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px',
          background: 'var(--bg-card)',
          border: '3px solid var(--line)',
          color: 'var(--text)',
          fontFamily: 'var(--font-hand)',
          fontSize: 16, cursor: 'pointer',
          borderRadius: 12,
          boxShadow: '4px 4px 0 var(--shadow)',
          filter: 'url(#sketch)'
        }}
      >
        <CameraIcon />
        <span>upload new</span>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={handleClick}
      whileHover={{ scale: 1.01 }}
      style={{
        position: 'relative', zIndex: 10,
        width: 280, height: 340,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 20, cursor: 'pointer',
        background: dragging ? 'var(--accent)' : 'var(--bg-card)',
        border: `3px dashed var(--line)`,
        borderRadius: 12,
        boxShadow: '4px 4px 0 var(--shadow)',
        filter: 'url(#sketch)',
        transition: 'background 0.3s'
      }}
    >
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />

      {/* Camera doodle */}
      <motion.div
        className={dragging ? 'wobble' : ''}
        animate={dragging ? { rotate: [-5, 5, -5], scale: 1.1 } : { y: [0, -3, 0] }}
        transition={dragging ? { duration: 0.6 } : { repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        style={{ position: 'relative', width: 100, height: 80 }}
      >
        <svg viewBox="0 0 100 80" fill="none" style={{ width: '100%', height: '100%' }}>
          <rect x="5" y="20" width="90" height="58"
            stroke="var(--line)" strokeWidth="3" fill="none" />
          <rect x="35" y="12" width="30" height="10"
            stroke="var(--line)" strokeWidth="3" fill="none" />
          <circle cx="50" cy="48" r="20"
            stroke="var(--line)" strokeWidth="3" fill="none" />
          <circle cx="50" cy="48" r="8"
            stroke="var(--line)" strokeWidth="3" fill="none" />
          <circle cx="76" cy="32" r="4"
            fill="var(--line)" />
        </svg>
      </motion.div>

      {/* Text */}
      <div style={{ textAlign: 'center' }}>
        <motion.p
          animate={dragging ? { scale: [1, 1.05, 1] } : { y: [0, -2, 0] }}
          transition={dragging ? { duration: 0.3 } : { repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          style={{
            fontFamily: 'var(--font-hand)',
            fontSize: 22, color: 'var(--text)',
            marginBottom: 4
          }}
        >
          {dragging ? 'drop it!' : 'drop a memory here!'}
        </motion.p>
        <motion.p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14, color: 'var(--text-dim)'
          }}
        >
          or click to browse
        </motion.p>
      </div>
    </motion.div>
  )
}

function CameraIcon() {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
      <rect x="0.5" y="2" width="15" height="11" stroke="var(--line)" strokeWidth="2" fill="none"/>
      <rect x="5" y="0" width="6" height="3" stroke="var(--line)" strokeWidth="2" fill="none"/>
      <circle cx="8" cy="7.5" r="3.5" stroke="var(--line)" strokeWidth="2" fill="none"/>
    </svg>
  )
}
