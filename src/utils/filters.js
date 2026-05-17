const FILTERS = {
  'flash-iii': { brightness: 1.6, contrast: 1.3, saturation: 0.9, rgbShift: { r: 1.05, g: 0.92, b: 0.78 }, vignette: 0.35, grain: 0.06, label: 'Flash III', color: '#e8748a' },
  dirty: { brightness: 1.15, contrast: 1.4, saturation: 0.65, rgbShift: { r: 1.12, g: 0.88, b: 0.72 }, vignette: 0.55, grain: 0.15, label: 'Dirty', color: '#8a7b6b' },
  y2k: { brightness: 1.3, contrast: 1.5, saturation: 0.4, rgbShift: { r: 0.85, g: 0.9, b: 1.2 }, vignette: 0.5, grain: 0.1, label: 'Y2K', color: '#6b8ab5' },
  'night-club': { brightness: 0.7, contrast: 1.8, saturation: 0.5, rgbShift: { r: 1.3, g: 0.6, b: 0.8 }, vignette: 0.7, grain: 0.08, label: 'Night Club', color: '#8a4b6b' },
  paparazzi: { brightness: 1.8, contrast: 1.1, saturation: 0.7, rgbShift: { r: 0.95, g: 1.0, b: 1.05 }, vignette: 0.2, grain: 0.04, label: 'Paparazzi', color: '#d4af37' },
  'lo-fi': { brightness: 1.0, contrast: 1.6, saturation: 0.5, rgbShift: { r: 1.0, g: 0.8, b: 1.1 }, vignette: 0.6, grain: 0.2, label: 'Lo-Fi', color: '#7b8a6b' },
  vhs: { brightness: 1.0, contrast: 1.4, saturation: 0.4, rgbShift: { r: 0.9, g: 0.95, b: 1.15 }, vignette: 0.3, grain: 0.18, label: 'VHS', color: '#55aacc' },
  polaroid: { brightness: 1.3, contrast: 0.9, saturation: 0.8, rgbShift: { r: 1.08, g: 1.0, b: 0.92 }, vignette: 0.45, grain: 0.08, label: 'Polaroid', color: '#ddaa88' },
  disposable: { brightness: 1.4, contrast: 1.2, saturation: 1.3, rgbShift: { r: 1.02, g: 0.98, b: 0.88 }, vignette: 0.6, grain: 0.12, label: 'Disposable', color: '#eedd88' },
  sepia: { brightness: 0.9, contrast: 1.2, saturation: 0.3, rgbShift: { r: 1.2, g: 1.05, b: 0.7 }, vignette: 0.4, grain: 0.1, label: 'Sepia', color: '#cc9966' },
  mono: { brightness: 0.8, contrast: 1.8, saturation: 0, rgbShift: { r: 1.0, g: 1.0, b: 1.0 }, vignette: 0.5, grain: 0.22, label: 'Mono', color: '#666666' },
  'toy-cam': { brightness: 1.1, contrast: 1.1, saturation: 0.7, rgbShift: { r: 1.1, g: 0.88, b: 0.75 }, vignette: 0.7, grain: 0.15, label: 'Toy Cam', color: '#bb8866' }
}

const VARIANTS = {
  Mild: { brightness: 0.9, contrast: 0.85, saturation: 0.9, rgbShift: 0.5, grain: 0.5, vignette: 0.6 },
  Classic: { brightness: 1.0, contrast: 1.0, saturation: 1.0, rgbShift: 1.0, grain: 1.0, vignette: 1.0 },
  Intense: { brightness: 1.1, contrast: 1.2, saturation: 1.15, rgbShift: 1.5, grain: 1.8, vignette: 1.4 }
}

export { FILTERS, VARIANTS }

export function processImage(imageData, settings) {
  const data = imageData.data
  const w = imageData.width
  const h = imageData.height
  const cx = w / 2
  const cy = h / 2
  const { brightness, contrast, saturation, rgbShift, vignette, grain } = settings
  const seed = Date.now() & 0xffff

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      r = (r - 128) * contrast + 128 + (brightness - 1) * 128
      g = (g - 128) * contrast + 128 + (brightness - 1) * 128
      b = (b - 128) * contrast + 128 + (brightness - 1) * 128

      const gray = 0.299 * r + 0.587 * g + 0.114 * b
      r = gray + (r - gray) * saturation
      g = gray + (g - gray) * saturation
      b = gray + (b - gray) * saturation

      r *= rgbShift.r
      g *= rgbShift.g
      b *= rgbShift.b

      const dx = (x - cx) / cx
      const dy = (y - cy) / cy
      const distFactor = Math.sqrt(dx * dx + dy * dy)
      const vig = 1 - vignette * distFactor * distFactor
      r *= vig
      g *= vig
      b *= vig

      const grainVal = (Math.sin(x * 127.1 + y * 311.7 + seed) * 0.5 + 0.5) * grain * 255
      r += grainVal - grain * 127
      g += grainVal - grain * 127
      b += grainVal - grain * 127

      data[i] = clamp(r)
      data[i + 1] = clamp(g)
      data[i + 2] = clamp(b)
    }
  }
  return imageData
}

function clamp(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0
}

export function applyVariant(base, variantName) {
  const v = VARIANTS[variantName] || VARIANTS.Classic
  return {
    brightness: base.brightness * v.brightness,
    contrast: base.contrast * v.contrast,
    saturation: base.saturation * v.saturation,
    rgbShift: {
      r: 1 + (base.rgbShift.r - 1) * v.rgbShift,
      g: 1 + (base.rgbShift.g - 1) * v.rgbShift,
      b: 1 + (base.rgbShift.b - 1) * v.rgbShift
    },
    vignette: base.vignette * v.vignette,
    grain: base.grain * v.grain
  }
}

export function getRandomVariant() {
  const names = Object.keys(VARIANTS)
  return names[Math.floor(Math.random() * names.length)]
}
