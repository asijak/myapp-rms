/**
 * Master Eligibility List (DO 007, s. 2023)
 */
export const ELIGIBILITY_LIST = [
  { code: 'CSP',        title: 'Career Service (Professional)',                       short: 'CS Prof',           category: 'Second Level' },
  { code: 'CSSP',       title: 'Career Service (Sub-Professional)',                   short: 'CS Sub-Prof',       category: 'First Level' },
  { code: 'PRC',        title: 'PRC Board (Licensed Professional)',                   short: 'PRC License',       category: 'Second Level' },
  { code: 'RA1080-LET', title: 'RA 1080 — Registered Professional Teacher (LET)',     short: 'LET/LEPT',          category: 'Second Level' },
  { code: 'HONOR-GRAD', title: 'Honor Graduate (PD 907)',                             short: 'PD 907',            category: 'Second Level' },
  { code: 'BAR',        title: 'Philippine Bar (RA 1080)',                            short: 'BAR',               category: 'Second Level' },
  
  // ── Other / Catch-all ──────────────────────────────────────────────────────
  { code: 'OTHER-2ND',  title: '2nd Level Eligibility (Other)',                       short: '2nd Level (Other)', category: 'Other / Catch-all' },
  { code: 'OTHER-1ST',  title: '1st Level Eligibility (Other)',                       short: '1st Level (Other)', category: 'Other / Catch-all' },
  { code: 'NONE',       title: 'None Required',                                       short: 'None',              category: 'N/A' },
  { code: 'NOSBE',      title: 'Not Specified by Board Eligibility',                  short: 'N/A',               category: 'N/A' },
]

export const ELIGIBILITY_MAP = ELIGIBILITY_LIST.reduce((acc, curr) => {
  acc[curr.code] = curr
  return acc
}, {})

export const LEVEL_2_CODES = new Set(['CSP', 'PRC', 'RA1080-LET', 'HONOR-GRAD', 'BAR', 'OTHER-2ND'])
export const LEVEL_1_CODES = new Set(['CSSP', 'OTHER-1ST'])

export const getEligibilityTitle = (code) => ELIGIBILITY_MAP[code]?.title ?? code
export const getEligibilityShort = (code) => ELIGIBILITY_MAP[code]?.short ?? code
