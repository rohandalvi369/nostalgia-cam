import { useRef, useEffect, useState, useCallback } from 'react'

function solveCatenary(W, sag) {
  let a = W * W / (8 * sag)
  for (let i = 0; i < 20; i++) {
    const z = W / (2 * a)
    const ch = Math.cosh(z)
    const f = a * (ch - 1) - sag
    const fp = ch - 1 - z * Math.sinh(z)
    a = a - f / fp
    if (Math.abs(f) < 0.001) break
  }
  return a
}

function catenaryY(x, W, a, baseY, sag) {
  return -a * Math.cosh((x - W / 2) / a) + baseY + sag + a
}

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
  const falloff = Math.exp(-(dist * dist) / (2 * 200 * 200))
  return maxDeg * falloff
}

const PHOTO_W = 180
const PHOTO_H = 220
const MAX_PER_STRING = 3
const ROW_GAP = 80
const STRING_SAG = 28
const DIP_BETWEEN = 4
const CLIP_W = 18
const CLIP_H = 28
const ROTATIONS = [-4, 3, -2, 5, -3]
const MAIN_COLOR = '#8B6914'
const SHADOW_COLOR = '#6B5335'

export default function DesktopFilmGallery({ photos, onPhotoSelect }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const frameRef = useRef(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const waveRef = useRef({ active: false, originX: 0, startTime: 0, A: 7 })
  const hoverRef = useRef({ active: false, x: -1000 })
  const swingRef = useRef({})
  const layoutRef = useRef({ layouts: [], catA: 0, cats: [] })
  const [swingTick, setSwingTick] = useState(0)
  const [width, setWidth] = useState(700)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.max(200, Math.floor(entry.target.getBoundingClientRect().width)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const findNearestString = useCallback((mx, my) => {
    const data = layoutRef.current
    for (let si = 0; si < data.layouts.length; si++) {
      const baseY = si * (PHOTO_H + ROW_GAP)
      for (let xi = 0; xi <= 100; xi++) {
        const x = (xi / 100) * width
        const y = catenaryY(x, width, data.catA, baseY, STRING_SAG)
        const dx = mx - x
        const dy = my - y
        if (dx * dx + dy * dy < 28 * 28) return x
      }
    }
    return -1
  }, [width])

  const triggerWave = useCallback((originX, A, isTouch) => {
    waveRef.current = { active: true, originX, startTime: performance.now(), A }
    const data = layoutRef.current
    const offsets = {}
    data.cats.forEach(row => row.forEach(item => {
      offsets[item.photo.id] = swingAmount(item.centerX, originX, isTouch ? 1.5 : 1.2)
    }))
    swingRef.current = offsets
    setSwingTick(t => t + 1)
    const ms = isTouch ? 600 : 500
    setTimeout(() => {
      swingRef.current = {}
      setSwingTick(t => t + 1)
    }, ms)
    if (isTouch) {
      try { navigator.vibrate?.([20, 10, 20]) } catch {}
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleMove = (e) => {
      const rect = el.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const handleLeave = () => { mouseRef.current = { x: -1000, y: -1000 } }
    el.addEventListener('mousemove', handleMove)
    el.addEventListener('mouseleave', handleLeave)
    return () => {
      el.removeEventListener('mousemove', handleMove)
      el.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  const stringGroups = []
  for (let i = 0; i < photos.length; i += MAX_PER_STRING) {
    stringGroups.push(photos.slice(i, i + MAX_PER_STRING))
  }

  const PHOTO_POSITIONS = { 1: [0.50], 2: [0.30, 0.70], 3: [0.18, 0.50, 0.82] }

  function computeLayouts(w) {
    return stringGroups.map(group => {
      const positions = PHOTO_POSITIONS[group.length] || []
      return group.map((photo, i) => ({
        photo,
        centerX: positions[i] * w,
        rotation: ROTATIONS[i % ROTATIONS.length]
      }))
    })
  }

  const layouts = computeLayouts(width)
  const catA = solveCatenary(width, STRING_SAG)
  const cats = layouts.map((layout, si) => {
    const baseY = si * (PHOTO_H + ROW_GAP)
    return layout.map(item => ({
      ...item,
      baseY,
      topY: catenaryY(item.centerX, width, catA, baseY, STRING_SAG)
    }))
  })

  layoutRef.current = { layouts, catA, cats }

  const lastRow = cats.length > 0 ? cats[cats.length - 1] : []
  const maxPhotoBottom = lastRow.length > 0
    ? Math.max(...lastRow.map(p => p.topY)) + PHOTO_H
    : 100
  const galleryH = Math.max(maxPhotoBottom + 40, 100)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || width < 200) return
    canvas.width = width
    canvas.height = galleryH
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true

    function draw() {
      if (!running) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const now = performance.now()
      const wave = waveRef.current
      const elapsed = wave.active ? (now - wave.startTime) / 1000 : -1

      if (wave.active && (elapsed > 3 || wave.A * Math.exp(-1.8 * elapsed) < 0.3)) {
        waveRef.current = { ...wave, active: false }
      }

      const data = layoutRef.current

      for (let si = 0; si < data.layouts.length; si++) {
        const layout = data.layouts[si]
        const baseY = si * (PHOTO_H + ROW_GAP)
        const photoXs = layout.map(p => p.centerX)

        const traceString = (yOff) => {
          ctx.beginPath()
          const steps = 40
          for (let i = 0; i <= steps; i++) {
            const x = (i / steps) * width
            let y = catenaryY(x, width, data.catA, baseY, STRING_SAG)

            for (let j = 0; j < photoXs.length - 1; j++) {
              const x1 = photoXs[j]
              const x2 = photoXs[j + 1]
              if (x > x1 && x < x2) {
                const t = (x - x1) / (x2 - x1)
                y += DIP_BETWEEN * Math.sin(Math.PI * t)
              }
            }

            if (wave.active) {
              y += waveOffset(x, elapsed, wave.originX, wave.A)
            }

            // Continuous hover vibration
            const hover = hoverRef.current
            if (hover.active && hover.x > -500) {
              const dist = x - hover.x
              const env = Math.exp(-(dist * dist) / (2 * 60 * 60))
              const osc = Math.sin(x * 0.3 - now * 0.008)
              y += 1.5 * osc * env
            }

            // Jitter
            y += (Math.sin(i * 7.3 + si * 13.7) * 2 + Math.cos(i * 11.1 + si * 5.3) * 2) * 0.4

            y += yOff
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
        }

        traceString(0)
        ctx.strokeStyle = MAIN_COLOR
        ctx.lineWidth = 1.8
        ctx.shadowBlur = 1
        ctx.shadowColor = SHADOW_COLOR
        ctx.stroke()
        ctx.shadowBlur = 0

        traceString(-0.8)
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'
        ctx.lineWidth = 0.4
        ctx.stroke()
      }
    }

    function tick() {
      if (!running) return

      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      let nearX = -1

      if (mx > -500) {
        const data = layoutRef.current
        for (let si = 0; si < data.layouts.length; si++) {
          const baseY = si * (PHOTO_H + ROW_GAP)
          for (let xi = 0; xi <= 100; xi++) {
            const x = (xi / 100) * width
            const y = catenaryY(x, width, data.catA, baseY, STRING_SAG)
            const dx = mx - x
            const dy = my - y
            if (dx * dx + dy * dy < 28 * 28) {
              nearX = x
              break
            }
          }
          if (nearX >= 0) break
        }
      }

      const wave = waveRef.current
      if (nearX >= 0) {
        hoverRef.current = { active: true, x: nearX }
        if (!wave.active) {
          triggerWave(nearX, 7, false)
        }
      } else {
        hoverRef.current = { active: false, x: -1000 }
      }

      draw()
      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      running = false
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [width, galleryH, triggerWave])

  const handleClick = useCallback(() => {
    const nearX = findNearestString(mouseRef.current.x, mouseRef.current.y)
    if (nearX >= 0) triggerWave(nearX, 12, false)
  }, [findNearestString, triggerWave])

  const handleTouchStart = useCallback((e) => {
    const t = e.touches[0]
    if (!t) return
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const tx = t.clientX - rect.left
    const ty = t.clientY - rect.top
    const nearX = findNearestString(tx, ty)
    if (nearX >= 0) triggerWave(nearX, 9, true)
  }, [findNearestString, triggerWave])

  const [cursor, setCursor] = useState('default')
  useEffect(() => {
    const iv = setInterval(() => {
      const nearX = findNearestString(mouseRef.current.x, mouseRef.current.y)
      setCursor(nearX >= 0 ? 'grab' : 'default')
    }, 100)
    return () => clearInterval(iv)
  }, [findNearestString])

  if (!photos || photos.length === 0) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-hand)',
          fontSize: 18, color: 'var(--text)'
        }}>no photos yet</p>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13, color: 'var(--text-dim)', marginTop: 8
        }}>your film roll is empty</p>
      </div>
    )
  }

  const progress = ((photos.length % MAX_PER_STRING) / MAX_PER_STRING) * 100

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12
      }}>
        <div style={{
          fontFamily: 'var(--font-hand)',
          fontSize: 18, color: 'var(--text)'
        }}>
          {'\uD83C\uDFAC'} film roll {'\u2014'} {photos.length}
        </div>
        <div style={{
          width: 120, height: 6, background: 'var(--shadow)',
          borderRadius: 3, position: 'relative',
          filter: 'url(#sketch)'
        }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: 'var(--accent)', transition: 'width 0.4s ease',
            borderRadius: 3
          }} />
        </div>
      </div>

      <div
        ref={containerRef}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        style={{
          position: 'relative', cursor,
          padding: '4px 0',
          minHeight: galleryH
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', pointerEvents: 'none', display: 'block'
          }}
        />

        {cats.map((row, si) =>
          row.map((item) => (
            <div
              key={item.photo.id}
              onClick={() => onPhotoSelect?.(item.photo)}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: PHOTO_W, height: PHOTO_H,
                transform: `translate(${item.centerX - PHOTO_W / 2}px, ${item.topY}px) rotate(${item.rotation + (swingRef.current[item.photo.id] || 0)}deg)`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease-out',
                zIndex: 2,
                cursor: 'pointer'
              }}
            >
              {/* Clothespin */}
              <div style={{
                position: 'absolute', top: -CLIP_H / 2, left: '50%',
                width: CLIP_W, height: CLIP_H,
                transform: 'translateX(-50%)',
                background: '#C8A96E', zIndex: 3,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                borderRadius: 2
              }}>
                <div style={{
                  position: 'absolute', top: -2, left: 1, right: 1,
                  height: 3, border: '1.5px solid #A08040',
                  borderBottom: 'none', borderRadius: '4px 4px 0 0'
                }} />
                <div style={{
                  position: 'absolute', top: 1, left: 0, right: 0,
                  height: 12, background: '#C8A96E'
                }} />
                <div style={{
                  position: 'absolute', top: 13, left: 0, right: 0,
                  height: 1, background: 'rgba(0,0,0,0.15)'
                }} />
                <div style={{
                  position: 'absolute', top: 14, left: 0, right: 0,
                  height: 12, background: '#C8A96E'
                }} />
                <div style={{
                  position: 'absolute', top: 2, left: 2, right: 2,
                  height: 1, background: 'rgba(255,255,255,0.2)'
                }} />
              </div>

              {/* Polaroid */}
              <div style={{
                width: '100%', height: '100%',
                background: 'var(--bg-card)',
                padding: '8px 8px 22px',
                border: '3px solid var(--line)',
                borderRadius: 12,
                boxShadow: '4px 4px 0 var(--shadow)',
                filter: 'url(#sketch)',
                display: 'flex', flexDirection: 'column'
              }}>
                <div style={{
                  flex: 1, overflow: 'hidden',
                  background: 'var(--shadow)', borderRadius: 4
                }}>
                  <img
                    src={item.photo.dataUrl} alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                  />
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9, color: 'var(--accent)',
                  textAlign: 'center', marginTop: 6, letterSpacing: 1
                }}>
                  {item.photo.date || '01.01.07'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
