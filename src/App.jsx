import { useState, useCallback, useRef, useEffect } from 'react'
import AmbientCanvas from './components/AmbientCanvas'
import SplashScreen from './components/SplashScreen'
import MobileView from './components/MobileView'
import DesktopView from './components/DesktopView'
import { FILTERS, applyVariant, processImage } from './utils/filters'

const STREAK_KEY = 'nostalgia_streak'

function getStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (!raw) return { count: 0, date: '' }
    const data = JSON.parse(raw)
    const today = new Date().toISOString().split('T')[0]
    if (data.date === today) return data
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (data.date === yesterday) return { count: data.count + 1, date: today }
    return { count: 1, date: today }
  } catch {
    return { count: 0, date: '' }
  }
}

function saveStreak(data) {
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(data)) } catch {}
}

function getFilterSliders(filterKey) {
  const base = FILTERS[filterKey]
  if (!base) return { brightness: 1, contrast: 1, saturation: 1, grain: 0.06 }
  const v = applyVariant(base, 'Classic')
  return {
    brightness: v.brightness,
    contrast: v.contrast,
    saturation: v.saturation,
    grain: v.grain
  }
}

const DEFAULT_FILTER = 'flash-iii'
const DEFAULT_SLIDERS = getFilterSliders(DEFAULT_FILTER)

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [rawImage, setRawImage] = useState(null)
  const [processedUrl, setProcessedUrl] = useState(null)
  const [activeFilter, setActiveFilter] = useState(DEFAULT_FILTER)
  const [sliders, setSliders] = useState({ ...DEFAULT_SLIDERS })
  const [developing, setDeveloping] = useState(false)
  const [photos, setPhotos] = useState([])
  const [streak, setStreak] = useState(() => getStreak())
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const editingPhotoIdRef = useRef(null)
  const gallerySavedRef = useRef(false)

  useEffect(() => {
    gallerySavedRef.current = false
  }, [rawImage])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const renderFiltered = useCallback((imgSrc, filterKey, sliderVals, onDone) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      const base = FILTERS[filterKey]
      if (!base) return
      const variant = applyVariant(base, 'Classic')
      const settings = {
        ...variant,
        brightness: sliderVals?.brightness ?? variant.brightness,
        contrast: sliderVals?.contrast ?? variant.contrast,
        saturation: sliderVals?.saturation ?? variant.saturation,
        grain: sliderVals?.grain ?? variant.grain
      }

      processImage(imageData, settings)
      ctx.putImageData(imageData, 0, 0)
      const url = canvas.toDataURL('image/jpeg', 0.92)
      setProcessedUrl(url)
      onDone?.(url, filterKey)
    }
    img.src = imgSrc
  }, [])

  const handleImage = useCallback((dataUrl) => {
    setRawImage(dataUrl)
    setDeveloping(true)
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      const sliderVals = getFilterSliders(activeFilter)
      latestSlidersRef.current = sliderVals
      setSliders(sliderVals)
      renderFiltered(dataUrl, activeFilter, sliderVals)
    }
    img.src = dataUrl
  }, [activeFilter, renderFiltered])

  const handleDevelopComplete = useCallback(() => {
    setDeveloping(false)
    saveStreak({ ...streak, date: new Date().toISOString().split('T')[0] })
    setStreak(getStreak())
  }, [streak])

  useEffect(() => {
    if (!rawImage || !processedUrl || developing || gallerySavedRef.current) return
    gallerySavedRef.current = true
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    editingPhotoIdRef.current = id
    setPhotos(prev => [{
      id,
      dataUrl: processedUrl,
      filter: activeFilter,
      date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
    }, ...prev])
  }, [rawImage, processedUrl, developing, activeFilter])
  const updateCurrentPhoto = useCallback((dataUrl, filterKey) => {
    const id = editingPhotoIdRef.current
    if (!id) return
    setPhotos(prev => prev.map(p =>
      p.id === id ? { ...p, dataUrl, filter: filterKey } : p
    ))
  }, [])

  const saveToGallery = useCallback((id, dataUrl, filterKey) => {
    setPhotos(prev => {
      const exists = prev.some(p => p.id === id)
      if (exists) {
        return prev.map(p => p.id === id ? { ...p, dataUrl, filter: filterKey } : p)
      }
      return [{
        id,
        dataUrl,
        filter: filterKey,
        date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
      }, ...prev]
    })
  }, [])

  const applyAndSave = useCallback((imgSrc, filterKey, sliderVals) => {
    renderFiltered(imgSrc, filterKey, sliderVals, (url, fk) => {
      const id = editingPhotoIdRef.current
      if (id) {
        saveToGallery(id, url, fk)
      }
    })
  }, [renderFiltered, saveToGallery])

  const handleFilterSelect = useCallback((key) => {
    setActiveFilter(key)
    const sliderVals = getFilterSliders(key)
    latestSlidersRef.current = sliderVals
    setSliders(sliderVals)
    if (rawImage) {
      applyAndSave(rawImage, key, sliderVals)
    }
  }, [rawImage, applyAndSave])

  const sliderDebounceRef = useRef(null)
  const latestSlidersRef = useRef({ ...DEFAULT_SLIDERS })
  const activeFilterRef = useRef(activeFilter)
  const rawImageRef = useRef(null)

  activeFilterRef.current = activeFilter
  rawImageRef.current = rawImage

  const handleSliderChange = useCallback((key, value) => {
    latestSlidersRef.current = { ...latestSlidersRef.current, [key]: value }
    setSliders(latestSlidersRef.current)
    clearTimeout(sliderDebounceRef.current)
    sliderDebounceRef.current = setTimeout(() => {
      const img = rawImageRef.current
      if (img) {
        applyAndSave(img, activeFilterRef.current, latestSlidersRef.current)
      }
    }, 40)
  }, [applyAndSave])

  const handleSurprise = useCallback(() => {
    const avail = Object.keys(FILTERS)
    const randomFilter = avail[Math.floor(Math.random() * avail.length)]
    const base = FILTERS[randomFilter]
    const variant = applyVariant(base, 'Classic')
    const randomSliders = {
      brightness: variant.brightness * (0.6 + Math.random() * 0.8),
      contrast: variant.contrast * (0.6 + Math.random() * 0.8),
      saturation: variant.saturation * (0.4 + Math.random() * 1.2),
      grain: variant.grain * (0.3 + Math.random() * 2)
    }
    setActiveFilter(randomFilter)
    setSliders(randomSliders)
    latestSlidersRef.current = randomSliders
    if (rawImage) applyAndSave(rawImage, randomFilter, randomSliders)
  }, [rawImage, applyAndSave])

  const isSavingRef = useRef(false)
  const handleSave = useCallback(() => {
    if (!processedUrl || isSavingRef.current) return
    isSavingRef.current = true
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    editingPhotoIdRef.current = id
    saveToGallery(id, processedUrl, activeFilter)
    const a = document.createElement('a')
    a.href = processedUrl
    a.download = 'nostalgia.jpg'
    a.click()
    setTimeout(() => { isSavingRef.current = false }, 300)
  }, [processedUrl, activeFilter, saveToGallery])

  const handleShare = useCallback(() => {
    if (!processedUrl) return
    if (navigator.share) {
      const byteString = atob(processedUrl.split(',')[1])
      const mimeString = 'image/jpeg'
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
      const blob = new Blob([ab], { type: mimeString })
      const file = new File([blob], 'nostalgia.jpg', { type: 'image/jpeg' })
      navigator.share({
        title: 'Nostalgia Cam',
        text: 'Check out my Nostalgia Cam edit!',
        files: [file]
      }).catch(() => {
        const a = document.createElement('a')
        a.href = processedUrl
        a.download = 'nostalgia.jpg'
        a.click()
      })
    } else {
      const a = document.createElement('a')
      a.href = processedUrl
      a.download = 'nostalgia.jpg'
      a.click()
    }
  }, [processedUrl])

  const handlePhotoSelect = useCallback((photo) => {
    setDeveloping(false)
    editingPhotoIdRef.current = photo.id
    setRawImage(photo.dataUrl)
    setProcessedUrl(photo.dataUrl)
    setActiveFilter(photo.filter || DEFAULT_FILTER)
    latestSlidersRef.current = getFilterSliders(photo.filter || DEFAULT_FILTER)
  }, [])

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false)
  }, [])

  const viewProps = {
    rawImage, processedUrl, activeFilter, sliders,
    developing, photos, streak,
    onImage: handleImage,
    onFilterSelect: handleFilterSelect,
    onSliderChange: handleSliderChange,
    onSurprise: handleSurprise,
    onShare: handleShare,
    onSave: handleSave,
    onDevelopComplete: handleDevelopComplete,
    onPhotoSelect: handlePhotoSelect
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      <AmbientCanvas />

      {isDesktop ? (
        <DesktopView {...viewProps} />
      ) : (
        <MobileView {...viewProps} />
      )}
    </>
  )
}
