import { useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  onHost: () => void
  onJoin: () => void
  onStudy: () => void
  onViewShared: (code: string) => void
}

// If the user pasted a full share URL, pull out just the share token.
function extractCode(input: string): string {
  const t = input.trim()
  if (!t) return ''
  try {
    const u = new URL(t)
    const fromQuery = u.searchParams.get('share')
    if (fromQuery) return fromQuery
  } catch {
    // not a URL — fall through
  }
  return t
}

export default function StartScreen({ onHost, onJoin, onStudy, onViewShared }: Props) {
  const [shareCode, setShareCode] = useState('')
  const [shareError, setShareError] = useState('')

  function submitShare() {
    const c = extractCode(shareCode)
    if (c.length < 6) {
      setShareError('Paste the full share link or code.')
      return
    }
    onViewShared(c)
  }

  return (
    <div className="max-w-[440px] mx-auto w-full text-center pb-5 pt-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1
          className="fg-display"
          style={{ fontSize: 'clamp(2.6rem, 9.5vw, 4.8rem)', padding: '0 8px' }}
        >
          Cracked-Heist
        </h1>
        <p className="fg-sub text-[0.95rem] mt-2">
          Answer fast. Steal coins. Don't get caught.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3.5 mt-7 mx-auto" style={{ maxWidth: 380 }}>
        <ModeCard
          delay={0.12}
          tag="teacher"
          big="HOST"
          title="Host a game"
          desc="Open a room. Pick a category. Run the class."
          onClick={onHost}
        />
        <ModeCard
          delay={0.2}
          tag="student"
          big="JOIN"
          title="Join with code"
          desc="Got a 6-char code? Drop in and play."
          onClick={onJoin}
        />
      </div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={onStudy}
        className="fg-mode-card mt-4"
        style={{
          maxWidth: 380,
          margin: '16px auto 0',
          padding: '18px 16px',
          display: 'block',
          width: '100%',
        }}
      >
        <div className="fg-lbl mb-1">solo</div>
        <div className="text-white" style={{ fontWeight: 800, fontSize: '1.05rem' }}>
          Study Mode
        </div>
        <div className="fg-sub mt-1" style={{ fontSize: '0.74rem' }}>
          Practice on your own. Answer questions for coins. No actions, no joining.
        </div>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="fg-panel mt-5 p-4 text-left"
        style={{ maxWidth: 380, margin: '20px auto 0' }}
      >
        <div className="fg-lbl mb-2">view a leaderboard</div>
        <p className="fg-sub text-xs mb-3">
          Paste a share link or code from a finished game to see who won.
        </p>
        <div className="flex gap-2">
          <input
            value={shareCode}
            onChange={(e) => {
              setShareError('')
              setShareCode(e.target.value)
            }}
            onKeyDown={(e) => e.key === 'Enter' && submitShare()}
            placeholder="paste link or code"
            className="fg-inp"
            style={{
              padding: '12px 14px',
              fontSize: '0.9rem',
              flex: 1,
            }}
          />
          <button
            onClick={submitShare}
            disabled={shareCode.trim().length < 6}
            className="fg-btn fg-btn-grad"
            style={{ width: 'auto', padding: '12px 20px', fontSize: '0.9rem' }}
          >
            View
          </button>
        </div>
        {shareError && (
          <div className="text-[var(--red)] text-xs mt-2 font-semibold">
            {shareError}
          </div>
        )}
      </motion.div>
    </div>
  )
}

function ModeCard({
  tag,
  big,
  title,
  desc,
  onClick,
  delay,
}: {
  tag: string
  big: string
  title: string
  desc: string
  onClick: () => void
  delay: number
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="fg-mode-card text-center"
      style={{ padding: '26px 16px' }}
    >
      <div className="fg-lbl mb-3">{tag}</div>
      <div
        className="fg-display"
        style={{
          fontSize: '2rem',
          lineHeight: 1,
          marginBottom: 12,
          padding: 0,
          letterSpacing: '-0.04em',
        }}
      >
        {big}
      </div>
      <div className="text-white" style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 5 }}>
        {title}
      </div>
      <div className="fg-sub" style={{ fontSize: '0.74rem', lineHeight: 1.4 }}>
        {desc}
      </div>
    </motion.button>
  )
}
