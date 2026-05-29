import { motion } from 'framer-motion'

interface Props {
  onHost: () => void
  onJoin: () => void
}

export default function StartScreen({ onHost, onJoin }: Props) {
  return (
    <div className="max-w-[440px] mx-auto w-full text-center pb-5 pt-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1
          className="fg-display"
          style={{
            fontSize: 'clamp(2.6rem, 9.5vw, 4.8rem)',
            padding: '0 8px',
          }}
        >
          Cracked-Heist
        </h1>
        <p className="fg-sub text-[0.95rem] mt-2">
          Answer fast. Steal coins. Don't get caught.
        </p>
      </motion.div>

      <div
        className="grid grid-cols-2 gap-3.5 mt-7 mx-auto"
        style={{ maxWidth: 380 }}
      >
        <ModeCard
          delay={0.12}
          tag="teacher"
          icon="⚡"
          title="Host"
          desc="Open a room. Pick a category. Run the class."
          onClick={onHost}
        />
        <ModeCard
          delay={0.2}
          tag="student"
          icon="→"
          title="Join"
          desc="Got a 6-char code? Drop in and play."
          onClick={onJoin}
        />
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
          className="fg-mode-card col-span-2 py-4 px-5 flex items-center justify-center gap-2"
          onClick={() =>
            window.alert(
              'How to play:\n\n' +
                '1) Host opens a room — students enter the 6-char code.\n' +
                '2) Build your hacker (hair, hat, face).\n' +
                '3) Answer trivia to earn coins (+25 each).\n' +
                '4) Spend coins on actions: Hack (steal coins, leaves a trace), Spy (catch a recent hacker), Crack Password (pick 1 of 3).\n' +
                '5) Most coins at the end wins.',
            )
          }
        >
          <span className="fg-sub text-sm font-bold">How to play</span>
          <span className="text-[var(--green-l)]">?</span>
        </motion.button>
      </div>
    </div>
  )
}

function ModeCard({
  tag,
  icon,
  title,
  desc,
  onClick,
  delay,
}: {
  tag: string
  icon: string
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
      style={{ padding: '30px 18px' }}
    >
      <div className="fg-lbl mb-2">{tag}</div>
      <div
        className="fg-display"
        style={{
          fontSize: '3.2rem',
          lineHeight: 1,
          marginBottom: 10,
          padding: 0,
        }}
      >
        {icon}
      </div>
      <div
        className="text-white"
        style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 5 }}
      >
        {title}
      </div>
      <div className="fg-sub" style={{ fontSize: '0.78rem', lineHeight: 1.4 }}>
        {desc}
      </div>
    </motion.button>
  )
}
