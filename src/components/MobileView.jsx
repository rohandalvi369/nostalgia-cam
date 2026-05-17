import { motion, AnimatePresence } from 'framer-motion'
import UploadZone from './UploadZone'
import DevelopingOverlay from './DevelopingOverlay'
import FilterCarousel from './FilterCarousel'
import Sliders from './Sliders'
import CTABar from './CTABar'
import FilmGallery from './FilmGallery'
import { FILTERS } from '../utils/filters'

export default function MobileView({
  rawImage, processedUrl, activeFilter, sliders,
  developing, photos, streak,
  onImage, onFilterSelect, onSliderChange,
  onSurprise, onShare, onSave, onDevelopComplete,
  onPhotoSelect
}) {
  return (
    <div style={{
      position: 'relative', zIndex: 10,
      width: '100%', maxWidth: 420,
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      paddingTop: !rawImage ? 0 : 40
    }}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        style={{
          width: '100%', padding: '0 16px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <h1 style={{
            fontFamily: 'var(--font-hand)',
            fontSize: 28, fontWeight: 700,
            color: 'var(--text)',
            transform: 'rotate(-2deg)'
          }}>
            nostalgia cam
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12, color: 'var(--text-dim)',
            marginTop: 2
          }}>
            est. 2007
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Streak pill */}
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 14px',
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
                fontSize: 16, color: 'var(--text)',
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
              width: 38, height: 38,
              background: 'var(--bg-card)',
              border: '3px solid var(--line)',
              borderRadius: 12,
              boxShadow: '3px 3px 0 var(--shadow)',
              filter: 'url(#sketch)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 16,
              cursor: 'pointer'
            }}
          >
            {'\uD83C\uDFB2'}
          </motion.button>
        </div>
      </motion.header>

      {/* Upload or Preview */}
      <div style={{
        width: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        justifyContent: !rawImage ? 'center' : 'flex-start',
        padding: !rawImage ? '0 16px' : '20px 16px',
        flex: 1
      }}>
        {!rawImage ? (
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <UploadZone onImage={onImage} hasImage={false} compact={false} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!developing && processedUrl && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                  width: '100%', maxWidth: 360,
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
                  position: 'absolute', bottom: 12, right: 12,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10, color: 'var(--text)',
                  opacity: 0.7,
                  background: 'var(--bg-card)',
                  border: '2px solid var(--line)',
                  borderRadius: 4,
                  padding: '2px 6px'
                }}>
                  {new Date().toLocaleDateString('en-US', {
                    month: '2-digit', day: '2-digit',
                    year: '2-digit'
                  })}
                </div>

                <div style={{
                  position: 'absolute', top: 12, left: 12,
                  padding: '4px 10px',
                  background: 'var(--bg-card)',
                  border: '2px solid var(--line)',
                  borderRadius: 4,
                  fontFamily: 'var(--font-body)',
                  fontSize: 12, color: 'var(--text)'
                }}>
                  {FILTERS[activeFilter]?.label || 'select'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {rawImage && !developing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ marginTop: 12 }}
          >
            <UploadZone
              onImage={onImage}
              hasImage={true}
              compact={true}
            />
          </motion.div>
        )}
      </div>

      {/* Developing overlay */}
      {developing && rawImage && (
        <DevelopingOverlay
          image={rawImage}
          onComplete={onDevelopComplete}
        />
      )}

      {/* Filter Carousel */}
      {!developing && rawImage && processedUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ width: '100%', marginTop: 8 }}
        >
          <FilterCarousel
            active={activeFilter}
            onSelect={onFilterSelect}
          />
        </motion.div>
      )}

      {/* Sliders */}
      {!developing && rawImage && processedUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ width: '100%', marginTop: 12 }}
        >
          <Sliders values={sliders} onChange={onSliderChange} />
        </motion.div>
      )}

      {/* CTA */}
      {!developing && (
        <CTABar hasImage={!!processedUrl} onShare={onShare} onSave={onSave} />
      )}

      {/* Film Gallery */}
      {!developing && (
        <FilmGallery photos={photos} onPhotoSelect={onPhotoSelect} />
      )}

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        style={{
          width: '100%', padding: '20px 16px',
          textAlign: 'center'
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
