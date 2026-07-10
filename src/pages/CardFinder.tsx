import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router'
import {
  buildFindLinks,
  buildSearchTerm,
  certVerificationLink,
  type CardQuery,
  type Grader,
} from '../cardfinder/sources'

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

  const term = buildSearchTerm(query)
  const certLink = certVerificationLink(query)
  const links = buildFindLinks(query)

  const canSearch = description.trim().length > 0 || (mode === 'graded' && cert.trim().length > 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSearch) return
    setSubmitted(true)
  }

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
        Enter a graded slab’s cert number, or just describe the card. We’ll jump you
        straight to live listings on eBay, Amazon, and shops near you.
      </motion.p>

      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-950 rounded-xl">
          {(['raw', 'graded'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                mode === m
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
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
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="2018 Topps Chrome Shohei Ohtani RC #150"
            className="bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 focus:border-purple-500 outline-none"
          />
          <span className="text-xs text-gray-600">
            Tip: include year, set, player, and card number for the best matches.
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
            {term && (
              <p className="text-sm text-gray-500">
                Searching for <span className="text-gray-300 font-medium">“{term}”</span>
              </p>
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
