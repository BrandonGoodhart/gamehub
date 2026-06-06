import MuteButton from './MuteButton'
import InfoButton from './InfoButton'
import MusicPicker from './MusicPicker'

interface Props {
  onHelp?: () => void
}

export default function AmbientBg({ onHelp }: Props) {
  return (
    <>
      <div className="fg-bg" />
      <div className="fg-ambient" aria-hidden>
        <div className="fg-orb fg-orb1" />
        <div className="fg-orb fg-orb2" />
        <div className="fg-orb fg-orb3" />
        <div className="fg-orb fg-orb4" />
        <div className="fg-grain" />
      </div>
      <div
        style={{
          position: 'fixed',
          top: 12,
          right: 12,
          zIndex: 300,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        {onHelp && <InfoButton onClick={onHelp} />}
        <MusicPicker />
        <MuteButton />
      </div>
    </>
  )
}
