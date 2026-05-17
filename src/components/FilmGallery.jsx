import { useRef, useEffect, useState } from 'react'

function waveOffset(x, elapsed, originX, A) {
  if (elapsed < 0) return 0
  const k = 0.035
  const w = 3.5
  const decay = 1.8
  const speed = w / k
  const spread = speed * elapsed + 15
  const dist = x - originX
  const env = Math.exp(-(dist * dist) / (2 * spread * spread))
  const osc = Math.sin(k * x - w * elapsed)
  const damp = Math.exp(-decay * elapsed)
  return A * osc * env * damp
}

function swingAmount(photoX, originX, maxDeg) {
  const dist = Math.abs(photoX - originX)
  const falloff = Math.exp(-(dist * dist) / (2 * 120 * 120))
  return maxDeg * falloff
}

function createChain(x1, y1, x2, y2, count) {
  const nodes = []
  const dx = x2 - x1
  const dy = y2 - y1
  const segLen = Math.sqrt(dx * dx + dy * dy) / (count - 1)
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    nodes.push({
      x: x1 + dx * t, y: y1 + dy * t,
      px: x1 + dx * t, py: y1 + dy * t,
      pinned: i === 0 || i === count - 1
    })
  }
  return { nodes, segLen }
}

function stepChain(nodes, segLen, gravity, iterations) {
  for (const n of nodes) {
    if (n.pinned) continue
    const vx = (n.x - n.px) * 0.985
    const vy = (n.y - n.py) * 0.985
    n.px = n.x
    n.py = n.y
    n.x += vx
    n.y += vy + gravity
  }
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i]
      const b = nodes[i + 1]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 0.001) continue
      const diff = (dist - segLen) / dist
      const ox = dx * diff * 0.5
      const oy = dy * diff * 0.5
      if (!a.pinned) { a.x -= ox; a.y -= oy }
      if (!b.pinned) { b.x += ox; b.y += oy }
    }
  }
}

function getPhotoNodeIndices(nodeCount, photoCount) {
  if (photoCount <= 1) return [Math.floor(nodeCount / 2)]
  const indices = []
  const interior = nodeCount - 2
  for (let i = 0; i < photoCount; i++) {
    const t = (i + 1) / (photoCount + 1)
    indices.push(Math.min(Math.max(1, Math.floor(1 + t * (interior - 1))), nodeCount - 2))
  }
  return indices
}

const PHOTO_W = 100
const ROW_H = 220
const STR_Y = 26
const STR_PAD = 6
const MAIN_COLOR = '#8B6914'

function StringRow({ photos: rowPhotos, width, mouseRef, rowIndex, onPhotoSelect }) {
  const canvasRef = useRef(null)
  const photoRefs = useRef({})
  const chainRef = useRef(null)
  const frameRef = useRef(null)
  const rowRef = useRef(null)
  const rowPhotosRef = useRef(rowPhotos)
  const waveRef = useRef(null)
  const swingRef = useRef({})
  const hoverRef = useRef({ active: false, x: -1000 })

  rowPhotosRef.current = rowPhotos

  useEffect(() => {
    if (width < 80 || rowPhotos.length === 0) return
    const nodeCount = Math.max(rowPhotos.length * 2 + 4, 8)
    chainRef.current = createChain(STR_PAD, STR_Y, width - STR_PAD, STR_Y, nodeCount)
  }, [width, rowPhotos.length])

  useEffect(() => {
    const chain = chainRef.current
    if (!chain || width < 80 || rowPhotos.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function triggerWave(originX, A, isTouch) {
      waveRef.current = { originX, startTime: performance.now(), A }
      const photos = rowPhotosRef.current
      const nodeCount = chainRef.current?.nodes.length || 0
      const indices = getPhotoNodeIndices(nodeCount, photos.length)
      const offsets = {}
      photos.forEach((photo, i) => {
        const ni = indices[i]
        const node = chainRef.current?.nodes[ni]
        if (node) offsets[photo.id] = swingAmount(node.x, originX, isTouch ? 1.5 : 1.2)
      })
      swingRef.current = offsets
      const ms = isTouch ? 600 : 500
      if (window.swingTimer) clearTimeout(window.swingTimer)
      window.swingTimer = setTimeout(() => { swingRef.current = {} }, ms)
      if (isTouch) try { navigator.vibrate?.([20, 10, 20]) } catch {}
    }

    function tick() {
      const c = chainRef.current
      if (!c) return

      const el = rowRef.current
      let localX = -1000, localY = -1000
      if (el && mouseRef.current.x > -500) {
        const rect = el.getBoundingClientRect()
        localX = mouseRef.current.x - rect.left
        localY = mouseRef.current.y - rect.top
      }

      if (localX > -500) {
        let nearX = -1
        for (const n of c.nodes) {
          const dx = localX - n.x
          const dy = localY - n.y
          if (dx * dx + dy * dy < 28 * 28) {
            nearX = n.x
            break
          }
        }
        if (nearX >= 0) {
          hoverRef.current = { active: true, x: nearX }
          if (!waveRef.current) {
            triggerWave(nearX, 7)
          }
        } else {
          hoverRef.current = { active: false, x: -1000 }
        }
      } else {
        hoverRef.current = { active: false, x: -1000 }
      }

      if (localX > -500) {
        for (const n of c.nodes) {
          if (n.pinned) continue
          const dx = localX - n.x
          const dy = localY - n.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 140) {
            const force = (1 - dist / 140) * 2.0
            n.x += dx * 0.006 * force
            n.y += 0.5 * force
          }
        }
      }

      stepChain(c.nodes, c.segLen, 0.24, 12)

      const wave = waveRef.current
      let waveElapsed = -1
      if (wave) {
        waveElapsed = (performance.now() - wave.startTime) / 1000
        if (waveElapsed > 3 || 7 * Math.exp(-1.8 * waveElapsed) < 0.3) {
          waveRef.current = null
          waveElapsed = -1
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Continuous hover vibration
      const hover = hoverRef.current
      const now = performance.now()

      // Draw string with jitter (40 segments)
      const drawNodes = (yOff, seed) => {
        ctx.beginPath()
        const steps = 40
        for (let i = 0; i <= steps; i++) {
          const idx = Math.floor((i / steps) * c.nodes.length)
          const n = c.nodes[Math.min(idx, c.nodes.length - 1)]
          let y = n.y + yOff
          if (waveElapsed >= 0) {
            y += waveOffset(n.x, waveElapsed, wave.originX, wave.A)
          }
          // Hover vibration
          if (hover.active && hover.x > -500) {
            const dist = n.x - hover.x
            const env = Math.exp(-(dist * dist) / (2 * 60 * 60))
            const osc = Math.sin(n.x * 0.3 - now * 0.008)
            y += 1.5 * osc * env
          }
          // Jitter
          y += (Math.sin(i * 7.3 + seed * 13.7) * 2 + Math.cos(i * 11.1 + seed * 5.3) * 2) * 0.4
          if (i === 0) ctx.moveTo(n.x, y)
          else ctx.lineTo(n.x, y)
        }
      }

      drawNodes(2, rowIndex)
      ctx.strokeStyle = 'rgba(139,105,20,0.08)'
      ctx.lineWidth = 5
      ctx.lineCap = 'butt'
      ctx.stroke()

      drawNodes(0, rowIndex)
      ctx.strokeStyle = MAIN_COLOR
      ctx.lineWidth = 2.5
      ctx.stroke()

      for (const n of c.nodes) {
        if (!n.pinned) continue
        ctx.fillStyle = MAIN_COLOR
        ctx.beginPath()
        ctx.arc(n.x, n.y, 3.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#555'
        ctx.beginPath()
        ctx.arc(n.x - 0.5, n.y - 0.5, 1.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = MAIN_COLOR
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(n.x, n.y, 5, 0, Math.PI * 2)
        ctx.stroke()
      }

      const photos = rowPhotosRef.current
      const indices = getPhotoNodeIndices(c.nodes.length, photos.length)
      photos.forEach((photo, i) => {
        const ni = indices[i]
        const node = c.nodes[ni]
        if (!node) return
        const el = photoRefs.current[photo.id]
        if (!el) return

        const prev = c.nodes[Math.max(0, ni - 1)]
        const next = c.nodes[Math.min(c.nodes.length - 1, ni + 1)]
        const slope = Math.atan2(next.y - prev.y, next.x - prev.x)

        let photoY = node.y + 2
        if (waveElapsed >= 0) {
          photoY += waveOffset(node.x, waveElapsed, wave.originX, wave.A)
        }
        // Hover vibration on photo
        if (hover.active && hover.x > -500) {
          const dist = node.x - hover.x
          const env = Math.exp(-(dist * dist) / (2 * 60 * 60))
          const osc = Math.sin(node.x * 0.3 - now * 0.008)
          photoY += 1.5 * osc * env
        }

        const x = node.x - PHOTO_W / 2
        const swing = swingRef.current[photo.id] || 0
        el.style.transform = `translate(${x}px, ${photoY}px) rotate(${slope + swing}rad)`
      })

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [width, rowPhotos.length, mouseRef, rowIndex])

  return (
    <div ref={rowRef} style={{
      position: 'relative', height: ROW_H, width: '100%',
      overflow: 'hidden'
    }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={ROW_H}
        style={{ position: 'absolute', left: 0, top: 0, width, height: ROW_H, pointerEvents: 'none', display: 'block' }}
      />
      {rowPhotos.map(photo => (
        <div
          key={photo.id}
          ref={el => { if (el) photoRefs.current[photo.id] = el }}
          onClick={() => onPhotoSelect?.(photo)}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: PHOTO_W,
            background: 'var(--bg-card)',
            border: '3px solid var(--line)',
            borderRadius: 12,
            boxShadow: '4px 4px 0 var(--shadow)',
            filter: 'url(#sketch)',
            padding: '4px 4px 18px',
            transformOrigin: 'top center',
            willChange: 'transform',
            zIndex: 2,
            cursor: 'pointer'
          }}
        >
          {/* Clothespin */}
          <div style={{
            position: 'absolute', top: -9, left: '50%',
            width: 16, height: 12,
            background: '#222',
            transform: 'translateX(-50%)',
            zIndex: 3,
            borderRadius: 2
          }}>
            <div style={{
              position: 'absolute', top: 1, left: 3, right: 3,
              height: 1, background: 'rgba(255,255,255,0.1)'
            }} />
            <div style={{
              position: 'absolute', top: 5, left: 2, right: 2,
              height: 1, background: 'rgba(255,255,255,0.07)'
            }} />
            <div style={{
              position: 'absolute', top: 4, left: 2, right: 2,
              height: 2.5, background: '#888',
              borderRadius: 0
            }} />
            <div style={{
              position: 'absolute', top: 4, left: 4, right: 4,
              height: 1, background: 'rgba(255,255,255,0.3)'
            }} />
            <div style={{
              position: 'absolute', top: 0, left: 6,
              width: 2, height: 12,
              background: 'var(--bg-card)'
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 4,
              width: 6, height: 3.5,
              background: 'var(--bg-card)'
            }} />
          </div>

          {/* Photo image */}
          <div style={{
            width: '100%', aspectRatio: '1',
            overflow: 'hidden',
            background: 'var(--shadow)',
            border: '2px solid var(--line)',
            borderRadius: 4
          }}>
            <img
              src={photo.dataUrl}
              alt=""
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', display: 'block'
              }}
              loading="lazy"
            />
          </div>

          {/* Date */}
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 7, color: 'var(--accent)',
            marginTop: 3, letterSpacing: 0.3
          }}>
            {photo.date || '01.01.07'}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FilmGallery({ photos, onPhotoSelect }) {
  const containerRef = useRef(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const [width, setWidth] = useState(388)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.max(100, Math.floor(entry.contentRect.width)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const handleMouse = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    const handleTouch = (e) => {
      const t = e.touches[0]
      if (t) mouseRef.current = { x: t.clientX, y: t.clientY }
    }
    const handleEnd = () => { mouseRef.current = { x: -1000, y: -1000 } }

    document.addEventListener('mousemove', handleMouse)
    document.addEventListener('touchmove', handleTouch, { passive: true })
    document.addEventListener('mouseleave', handleEnd)
    document.addEventListener('touchend', handleEnd)
    document.addEventListener('touchcancel', handleEnd)
    return () => {
      document.removeEventListener('mousemove', handleMouse)
      document.removeEventListener('touchmove', handleTouch)
      document.removeEventListener('mouseleave', handleEnd)
      document.removeEventListener('touchend', handleEnd)
      document.removeEventListener('touchcancel', handleEnd)
    }
  }, [])

  const photosPerRow = Math.max(1, Math.floor((width - STR_PAD * 2 + 12) / (PHOTO_W + 18)))
  const rows = []
  for (let i = 0; i < photos.length; i += photosPerRow) {
    rows.push(photos.slice(i, i + photosPerRow))
  }

  if (!photos || photos.length === 0) {
    return (
      <div style={{
        width: '100%', maxWidth: 360, margin: '0 auto',
        padding: '40px 16px', textAlign: 'center'
      }}>
        <p style={{
          fontFamily: 'var(--font-hand)',
          fontSize: 18, color: 'var(--text)'
        }}>
          no photos yet
        </p>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13, color: 'var(--text-dim)',
          marginTop: 8
        }}>
          your film roll is empty
        </p>
      </div>
    )
  }

  return (
    <div style={{
      width: '100%', maxWidth: 420, margin: '0 auto',
      padding: '20px 16px 40px',
      userSelect: 'none'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 6
      }}>
        <div style={{
          width: 24, height: 24,
          border: '3px solid var(--line)',
          borderRadius: 4,
          display: 'flex', alignItems: 'center',
          justifyContent: 'center',
          filter: 'url(#sketch)'
        }}>
          <div style={{ width: 8, height: 8, background: 'var(--line)' }} />
        </div>
        <span style={{
          fontFamily: 'var(--font-hand)',
          fontSize: 18, color: 'var(--text)'
        }}>
          film roll {'\u2014'} {photos.length}
        </span>
      </div>

      {/* Rows */}
      <div ref={containerRef}>
        {rows.map((row, i) => (
          <StringRow
            key={i}
            rowIndex={i}
            photos={row}
            width={width}
            mouseRef={mouseRef}
            onPhotoSelect={onPhotoSelect}
          />
        ))}
      </div>
    </div>
  )
}
