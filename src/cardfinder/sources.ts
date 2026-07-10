// Card Finder — builds real, live search links for a sports card.
// No API keys or backend needed: we construct deep-links that drop the user
// straight onto live results at each marketplace.

export type Grader = 'PSA' | 'BGS' | 'SGC'

export interface CardQuery {
  /** Free-text description, e.g. "2018 Topps Chrome Shohei Ohtani RC #150". */
  description: string
  /** Grading company, when the card is graded. */
  grader?: Grader
  /** Certification / serial number printed on the graded slab. */
  cert?: string
  /** Numeric grade, e.g. "10", "9.5". */
  grade?: string
  /** Optional location for finding nearby card shops, e.g. "Austin, TX". */
  location?: string
}

export interface FindLink {
  id: string
  label: string
  /** Short line describing what the user will see. */
  blurb: string
  url: string
}

/** A concise search phrase built from the structured fields. */
export function buildSearchTerm(q: CardQuery): string {
  const parts = [q.description.trim()]
  if (q.grader) parts.push(q.grader)
  if (q.grade) parts.push(q.grade)
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

const enc = (s: string) => encodeURIComponent(s)

/** Direct cert-verification link for the grader, when a cert number is given. */
export function certVerificationLink(q: CardQuery): FindLink | null {
  if (!q.cert) return null
  const cert = q.cert.trim().replace(/\s+/g, '')
  if (!q.grader) return null

  switch (q.grader) {
    case 'PSA':
      return {
        id: 'psa-cert',
        label: `Verify PSA cert #${cert}`,
        blurb: 'Opens the exact card on the official PSA population report.',
        url: `https://www.psacard.com/cert/${enc(cert)}`,
      }
    case 'SGC':
      return {
        id: 'sgc-cert',
        label: `Verify SGC cert #${cert}`,
        blurb: 'Opens the exact card in SGC’s official cert lookup.',
        url: `https://gosgc.com/cert/${enc(cert)}`,
      }
    case 'BGS':
      return {
        id: 'bgs-cert',
        label: `Verify BGS serial #${cert}`,
        blurb: 'Opens Beckett’s grade lookup — enter the serial to confirm.',
        url: `https://www.beckett.com/grading/card-lookup`,
      }
  }
}

/** All the marketplaces we can point the user to for this card. */
export function buildFindLinks(q: CardQuery): FindLink[] {
  const term = buildSearchTerm(q)
  const t = enc(term)
  const links: FindLink[] = []

  // eBay active listings — sports trading card singles category (261328).
  links.push({
    id: 'ebay-active',
    label: 'eBay — buy it now & auctions',
    blurb: 'Live listings you can bid on or buy right now.',
    url: `https://www.ebay.com/sch/i.html?_nkw=${t}&_sacat=261328`,
  })

  // eBay sold/completed — the go-to for real market value.
  links.push({
    id: 'ebay-sold',
    label: 'eBay — recent sold prices (comps)',
    blurb: 'What this card actually sold for lately — the truest value.',
    url: `https://www.ebay.com/sch/i.html?_nkw=${t}&_sacat=261328&LH_Sold=1&LH_Complete=1`,
  })

  // Amazon.
  links.push({
    id: 'amazon',
    label: 'Amazon',
    blurb: 'Check Amazon sellers for this card or sealed product.',
    url: `https://www.amazon.com/s?k=${t}&i=toys-and-games`,
  })

  // Google Shopping — aggregates in-stock retail from many stores.
  links.push({
    id: 'google-shopping',
    label: 'Google Shopping — in stock at stores',
    blurb: 'Pulls in-stock results from retailers and card shops across the web.',
    url: `https://www.google.com/search?tbm=shop&q=${t}`,
  })

  // COMC — a large graded/raw single-card marketplace.
  links.push({
    id: 'comc',
    label: 'COMC — huge single-card marketplace',
    blurb: 'Browse thousands of individual raw & graded singles for sale.',
    url: `https://www.comc.com/Cards?Search=${t}`,
  })

  // Local card shops near the user.
  const near = q.location?.trim()
    ? `sports card shops near ${q.location.trim()}`
    : 'sports card shops near me'
  links.push({
    id: 'local',
    label: 'Local card shops near you',
    blurb: 'Find brick-and-mortar shops on the map to call about stock.',
    url: `https://www.google.com/maps/search/${enc(near)}`,
  })

  return links
}
