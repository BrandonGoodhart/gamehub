import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router'
import {
  buildFindLinks,
  buildSearchTerm,
  certVerificationLink,
  type CardQuery,
  type Grader,
} from '../cardfinder/sources'
import {
  parseCardText,
  identifyCardImage,
  estimateValue,
  fileToBase64,
  type AiCard,
  type AiValue,
} from '../cardfinder/ai'

const GRADERS: Grader[] = ['PSA', 'BGS', 'SGC']

type Mode = 'graded' | 'raw'

export default function CardFinder() {
  const [mode, setMode] = useState<Mode>('raw')
  const [description, setDescription] = useState('')
  const [grader, setGrader] = useState<Grader>('PSA')
  const [cert, setCert] = useState('')
  const [grade, setGrade] = useState('')
  const [location, setLocation] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // AI state
  const [aiCard, setAiCard] = useState<AiCard | null>(null)
  const [aiValue, setAiValue] = useState<AiValue | null>(null)
  const [aiBusy, setAiBusy] = useState<null | 'parse' | 'identify' | 'estimate'>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const query: CardQuery = useMemo(
    () => ({
      description,
      grader: mode === 'graded' ? grader : undefined,
      cert: mode === 'graded' ? cert : undefined,
      grade: mode === 'graded' ? grade : undefined,
      location,
    }),
    [description, mode, grader, cert, grade, location],
  )

  const effectiveTerm = aiCard?.searchTerm?.trim() || buildSearchTerm(query)
  const certLink = certVerificationLink(query)
  const links = buildFindLinks(query, aiCard?.searchTerm)

  const canSearch = description.trim().length > 0 || (mode === 'graded' && cert.trim().length > 0)

  const applyAiCard = (card: AiCard) => {
    setAiCard(card)
    setAiValue(null)
    // Fold the AI's reading back into the description so the form reflects it.
    const rebuilt = [card.year, card.set, card.player, card.cardNumber && `#${card.cardNumber}`, card.variation]
      .filter(Boolean)
      .join(' ')
      .trim()
    if (rebuilt) setDescription(rebuilt)
  }

  const handleSmartParse = async () => {
    if (!description.trim()) return
    setAiError(null)
    setAiBusy('parse')
    try {
      applyAiCard(await parseCardText(description))
      setSubmitted(true)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setAiBusy(null)
    }
  }

  const handlePhoto = async (file: File | undefined) => {
    if (!file) return
    setAiError(null)
    setAiBusy('identify')
    try {
      const { mimeType, data } = await fileToBase64(file)
      applyAiCard(await identifyCardImage(mimeType, data))
      setSubmitted(true)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Could not identify the card.')
    } finally {
      setAiBusy(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleEstimate = async () => {
    setAiError(null)
    setAiBusy('estimate')
    try {
      setAiValue(await estimateValue(aiCard ?? {}, effectiveTerm))
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Could not estimate value.')
    } finally {
      setAiBusy(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSearch) return
    setSubmitted(true)
  }

  const aiFields: Array<[string, string | undefined]> = aiCard
    ? [
        ['Player', aiCard.player],
        ['Year', aiCard.year],
        ['Set', aiCard.set],
        ['Card #', aiCard.cardNumber],
        ['Variation', aiCard.variation],
        ['Sport', aiCard.sport],
      ]
    : []

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-10 gap-8">
      <div className="flex items-center gap-4 w-full max-w-2xl">
        <Link to="/" className="text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <motion.h1
          className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Card Finder
        </motion.h1>
      </div>

      <motion.p
        className="text-gray-400 text-center max-w-xl -mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Snap a photo, enter a graded slab’s cert number, or just describe the card. We’ll
        jump you straight to live listings on eBay, Amazon, and shops near you.
      </motion.p>

      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Photo identify */}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhoto(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={aiBusy !== null}
            className="w-full py-3 rounded-xl font-medium border border-dashed border-purple-500/50 text-purple-200 hover:bg-purple-950/30 transition-colors disabled:opacity-40 cursor-pointer"
          >
            {aiBusy === 'identify' ? 'Identifying…' : '📷 Identify a card from a photo'}
          </button>
        </div>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-950 rounded-xl">
          {(['raw', 'graded'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                mode === m ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {m === 'raw' ? 'Describe a card' : 'Graded (cert #)'}
            </button>
          ))}
        </div>

        {/* Graded-only fields */}
        <AnimatePresence initial={false}>
          {mode === 'graded' && (
            <motion.div
              className="flex flex-col gap-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-gray-400">Grader</span>
                  <select
                    value={grader}
                    onChange={(e) => setGrader(e.target.value as Grader)}
                    className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 focus:border-purple-500 outline-none cursor-pointer"
                  >
                    {GRADERS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                  <span className="text-gray-400">Cert / serial number</span>
                  <input
                    value={cert}
                    onChange={(e) => setCert(e.target.value)}
                    placeholder="e.g. 12345678"
                    className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-gray-400">Grade (optional)</span>
                <input
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="e.g. 10, 9.5"
                  className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
                />
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Description */}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-400">
            {mode === 'graded' ? 'Describe the card (helps find listings)' : 'Describe the card'}
          </span>
          <div className="flex gap-2">
            <input
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setAiCard(null)
              }}
              placeholder="that shiny Ohtani rookie from a few years back"
              className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
            />
            <button
              type="button"
              onClick={handleSmartParse}
              disabled={!description.trim() || aiBusy !== null}
              className="px-3 rounded-lg text-sm font-medium bg-purple-600/80 hover:bg-purple-600 transition-colors disabled:opacity-40 whitespace-nowrap cursor-pointer"
            >
              {aiBusy === 'parse' ? '…' : '✨ Smart'}
            </button>
          </div>
          <span className="text-xs text-gray-600">
            Tip: “✨ Smart” lets AI turn plain English into the exact card. Or include year, set,
            player, and number yourself.
          </span>
        </label>

        {/* Location */}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-400">Your location (for nearby shops)</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Austin, TX"
            className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={!canSearch}
          className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Find this card
        </button>

        {aiError && (
          <p className="text-sm text-amber-400/90 bg-amber-950/30 border border-amber-500/30 rounded-lg px-3 py-2">
            {aiError}
          </p>
        )}
      </motion.form>

      {/* Results */}
      <AnimatePresence>
        {submitted && canSearch && (
          <motion.div
            className="w-full max-w-2xl flex flex-col gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {/* What the AI understood */}
            {aiCard && aiFields.some(([, v]) => v) && (
              <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-500/30">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-purple-200">✨ Here’s what I found</h3>
                  {aiCard.confidence && (
                    <span className="text-xs text-purple-300/80 uppercase tracking-wide">
                      {aiCard.confidence} confidence
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiFields
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <span key={k} className="text-xs bg-gray-900 border border-gray-700 rounded-full px-3 py-1">
                        <span className="text-gray-500">{k}:</span> <span className="text-gray-200">{v}</span>
                      </span>
                    ))}
                </div>
                {aiCard.notes && <p className="text-sm text-gray-400 mt-3">{aiCard.notes}</p>}
              </div>
            )}

            {effectiveTerm && (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-gray-500">
                  Searching for <span className="text-gray-300 font-medium">“{effectiveTerm}”</span>
                </p>
                <button
                  type="button"
                  onClick={handleEstimate}
                  disabled={aiBusy !== null}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-700 hover:border-purple-500/60 text-gray-300 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {aiBusy === 'estimate' ? 'Estimating…' : '💰 Estimate value'}
                </button>
              </div>
            )}

            {/* Value estimate */}
            {aiValue && (
              <div className="p-5 rounded-2xl bg-gray-900 border border-emerald-500/30">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-semibold text-emerald-300">Rough value</h3>
                  <span className="text-2xl font-bold text-emerald-200">
                    ${Math.round(aiValue.lowUsd ?? 0)}–${Math.round(aiValue.highUsd ?? 0)}
                  </span>
                </div>
                {aiValue.rationale && <p className="text-sm text-gray-400 mt-1">{aiValue.rationale}</p>}
                <p className="text-xs text-gray-600 mt-2">
                  AI estimate only — check the eBay sold comps below for real numbers.
                </p>
              </div>
            )}

            {certLink && (
              <a
                href={certLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-5 rounded-2xl bg-purple-950/40 border border-purple-500/40 hover:border-purple-400 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-purple-200">{certLink.label}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">{certLink.blurb}</p>
                  </div>
                  <span className="text-purple-300 text-xl">↗</span>
                </div>
              </a>
            )}

            <div className="grid grid-cols-1 gap-3">
              {links.map((link, i) => (
                <motion.a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-5 rounded-2xl bg-gray-900 border border-gray-800 hover:border-purple-500/50 transition-colors group"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold group-hover:text-purple-300 transition-colors">
                        {link.label}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">{link.blurb}</p>
                    </div>
                    <span className="text-gray-500 group-hover:text-purple-300 text-xl transition-colors">↗</span>
                  </div>
                </motion.a>
              ))}
            </div>

            <p className="text-xs text-gray-600 text-center mt-2">
              Links open live searches on each site. Live in-store stock uses Google
              Shopping & Maps for now — plug in store APIs later for real-time inventory.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
