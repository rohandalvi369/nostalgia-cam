import { motion } from 'framer-motion'
import { FILTERS } from '../utils/filters'

export default function FilterCarousel({ active, onSelect }) {
  const filterList = Object.entries(FILTERS)

  return (
    <div style={{
      width: '100%',
      maxWidth: 420,
      margin: '0 auto',
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--font-body)',
        fontSize: 14, color: 'var(--text)',
        marginBottom: 12
      }}>
        {FILTERS[active]?.label || 'select filter'}
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
        padding: '0 16px'
      }}>
        {filterList.map(([key, filter], i) => (
          <div key={key} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4
          }}>
            <motion.button
              onClick={() => onSelect(key)}
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
              whileHover={{ scale: 1.08, rotate: [0, -3, 3, -2, 0] }}
              whileTap={{ scale: 0.85, rotate: -5 }}
              style={{
                width: 44, height: 44,
                border: '3px solid var(--line)',
                borderRadius: 12,
                background: key === active ? 'var(--accent)' : (filter.color || 'var(--bg-card)'),
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: key === active ? '3px 3px 0 var(--shadow)' : '2px 2px 0 var(--shadow)',
                filter: 'url(#sketch)'
              }}
            >
              {key === active && (
                <motion.span
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                  style={{
                    fontSize: 18, color: '#fff',
                    lineHeight: '40px'
                  }}
                >
                  {'\u2713'}
                </motion.span>
              )}
            </motion.button>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              color: key === active ? 'var(--text)' : 'var(--text-dim)',
              textAlign: 'center',
              lineHeight: 1.1,
              maxWidth: 44
            }}>
              {filter.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
