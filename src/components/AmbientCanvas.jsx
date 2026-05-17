import { useRef, useEffect } from 'react'

export default function AmbientCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w, h, animId
    const dots = []

    function resize() {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w
      canvas.height = h
      initDots()
    }

    function initDots() {
      dots.length = 0
      for (let i = 0; i < 36; i++) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 1 + Math.random() * 2,
          dx: (Math.random() - 0.5) * 0.15,
          dy: (Math.random() - 0.5) * 0.15,
          life: 400 + Math.random() * 600
        })
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h)

      for (const d of dots) {
        d.x += d.x + d.dx > 0 && d.x + d.dx < w ? d.dx : -d.dx
        d.y += d.y + d.dy > 0 && d.y + d.dy < h ? d.dy : -d.dy
        d.life--
        if (d.life <= 0) {
          d.x = Math.random() * w
          d.y = Math.random() * h
          d.life = 400 + Math.random() * 600
        }

        const alpha = Math.min(1, (d.life / 1000) * 2) * 0.12
        ctx.fillStyle = `rgba(180,165,140,${alpha})`
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    resize()
    animId = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        width: '100vw', height: '100vh',
        zIndex: 0, pointerEvents: 'none'
      }}
    />
  )
}
