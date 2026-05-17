import { motion, AnimatePresence } from 'framer-motion'
import UploadZone from './UploadZone'
import DevelopingOverlay from './DevelopingOverlay'
import FilterCarousel from './FilterCarousel'
import Sliders from './Sliders'
import CTABar from './CTABar'
import DesktopFilmGallery from './DesktopFilmGallery'
import { FILTERS } from '../utils/filters'

export default function DesktopView({
  rawImage, processedUrl, activeFilter, sliders,
  developing, photos, streak,
  onImage, onFilterSelect, onSliderChange,
  onSurprise, onShare, onSave, onDevelopComplete,
  onPhotoSelect
}) {
  return (
    <div style={{
      position: 'relative', zIndex: 10,
      width: '100%', maxWidth: 1100,
      minHeight: '100vh',
      margin: '0 auto',
      padding: '40px 24px'
    }}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 32
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{
            fontFamily: 'var(--font-hand)',
            fontSize: 34, fontWeight: 700,
            color: 'var(--text)',
            transform: 'rotate(-2deg)',
            position: 'relative'
          }}>
            nostalgia cam
            {/* Wavy underline */}
            <svg
              style={{ position: 'absolute', bottom: -4, left: 0, width: '100%', height: 8 }}
              viewBox="0 0 100 8"
              preserveAspectRatio="none"
            >
              <path
                d="M0,4 Q12.5,0 25,4 T50,4 T75,4 T100,4"
                stroke="var(--accent)"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </h1>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14, color: 'var(--text-dim)'
          }}>
            est. 2007
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Streak pill */}
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '8px 16px',
              background: 'var(--yellow)',
              border: '3px solid var(--line)',
              borderRadius: 20,
              boxShadow: '3px 3px 0 var(--shadow)',
              filter: 'url(#sketch)'
            }}
          >
            <motion.span
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 1 }}
              style={{ fontSize: 14, display: 'inline-block' }}
            >{'\uD83D\uDD25'}</motion.span>
            <motion.span
              key={streak.count}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
              style={{
                fontFamily: 'var(--font-hand)',
                fontSize: 18, color: 'var(--text)',
                display: 'inline-block'
              }}
            >
              {streak.count}
            </motion.span>
          </motion.div>

          {/* Surprise dice */}
          <motion.button
            onClick={onSurprise}
            whileHover={{ rotate: 180 }}
            whileTap={{ scale: 0.8 }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 2 }}
            style={{
              width: 42, height: 42,
              background: 'var(--bg-card)',
              border: '3px solid var(--line)',
              borderRadius: 12,
              boxShadow: '3px 3px 0 var(--shadow)',
              filter: 'url(#sketch)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 18,
              cursor: 'pointer'
            }}
          >
            {'\uD83C\uDFB2'}
          </motion.button>
        </div>
      </motion.header>

      {!rawImage ? (
        /* ── Centered upload (no photo) ── */
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          minHeight: 'calc(100vh - 200px)'
        }}>
          <UploadZone onImage={onImage} hasImage={false} compact={false} />
        </div>
      ) : (
        /* ── Main two-column layout ── */
        <div style={{
          display: 'flex', gap: 32,
          alignItems: 'flex-start'
        }}>
          {/* Left: Preview + Gallery */}
          <div style={{ flex: '1 1 65%', minWidth: 0 }}>
            <AnimatePresence mode="wait">
              {!developing && processedUrl && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{
                    maxWidth: 600,
                    overflow: 'hidden',
                    border: '3px solid var(--line)',
                    borderRadius: 12,
                    boxShadow: '4px 4px 0 var(--shadow)',
                    filter: 'url(#sketch)',
                    background: 'var(--bg-card)',
                    position: 'relative'
                  }}
                >
                  <img
                    src={processedUrl}
                    alt="processed"
                    style={{
                      width: '100%', height: 'auto',
                      display: 'block'
                    }}
                  />

                  <div style={{
                    position: 'absolute', bottom: 14, right: 14,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11, color: 'var(--text)',
                    opacity: 0.7,
                    background: 'var(--bg-card)',
                    border: '2px solid var(--line)',
                    borderRadius: 4,
                    padding: '3px 8px'
                  }}>
                    {new Date().toLocaleDateString('en-US', {
                      month: '2-digit', day: '2-digit',
                      year: '2-digit'
                    })}
                  </div>

                  <div style={{
                    position: 'absolute', top: 14, left: 14,
                    padding: '4px 10px',
                    background: 'var(--bg-card)',
                    border: '2px solid var(--line)',
                    borderRadius: 4,
                    fontFamily: 'var(--font-body)',
                    fontSize: 13, color: 'var(--text)'
                  }}>
                    {FILTERS[activeFilter]?.label || 'select'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ marginTop: 16 }}
            >
              <UploadZone
                onImage={onImage}
                hasImage={true}
                compact={true}
              />
            </motion.div>

            {/* Gallery below preview */}
            {!developing && (
              <div style={{ marginTop: 40 }}>
                <DesktopFilmGallery photos={photos} onPhotoSelect={onPhotoSelect} />
              </div>
            )}
          </div>

          {/* Right: Controls (sticky) */}
          <div style={{
            flex: '0 0 320px',
            position: 'sticky', top: 24,
            display: 'flex', flexDirection: 'column', gap: 20
          }}>
            {/* Filters */}
            {!developing && rawImage && processedUrl && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{
                  border: '3px solid var(--line)',
                  borderRadius: 12,
                  boxShadow: '4px 4px 0 var(--shadow)',
                  filter: 'url(#sketch)',
                  background: 'var(--bg-card)',
                  padding: 16
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: 18, color: 'var(--text)',
                  marginBottom: 12
                }}>
                  filter
                </div>
                <FilterCarousel
                  active={activeFilter}
                  onSelect={onFilterSelect}
                />
              </motion.div>
            )}

            {/* Sliders */}
            {!developing && rawImage && processedUrl && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                style={{
                  border: '3px solid var(--line)',
                  borderRadius: 12,
                  boxShadow: '4px 4px 0 var(--shadow)',
                  filter: 'url(#sketch)',
                  background: 'var(--bg-card)',
                  padding: 16
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: 18, color: 'var(--text)',
                  marginBottom: 12
                }}>
                  adjust
                </div>
                <Sliders values={sliders} onChange={onSliderChange} />
              </motion.div>
            )}

            {/* CTA */}
            {!developing && (
              <CTABar hasImage={!!processedUrl} onShare={onShare} onSave={onSave} />
            )}
          </div>
        </div>
      )}

      {/* Developing overlay */}
      {developing && rawImage && (
        <DevelopingOverlay
          image={rawImage}
          onComplete={onDevelopComplete}
        />
      )}

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        style={{
          textAlign: 'center',
          padding: '40px 16px 20px'
        }}
      >
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11, color: 'var(--text-dim)'
        }}>
          {'\u00A9'} 2007-2025 nostalgia cam
        </p>
      </motion.footer>
    </div>
  )
}
