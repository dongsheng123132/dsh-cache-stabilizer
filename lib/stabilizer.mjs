const DEFAULT_CWD_SENTENCE = 'Your working directory is {{cwd}}.'
const STABLE_CWD_SENTENCE = 'Your working directory is provided in the runtime context.'
const PERSONA_SECTION = 'deployment:persona'
const CWD_CONTEXT = 'dsh-cache-stabilizer:cwd'

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/** Return an equivalent JSON-like value with object keys in code-unit order. */
export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!isPlainObject(value)) return value
  const sorted = {}
  for (const key of Object.keys(value).sort()) sorted[key] = canonicalize(value[key])
  return sorted
}

/**
 * Stabilize only semantics-preserving parts of a DSH prompt assembly.
 * Unknown/custom personas are deliberately left untouched.
 */
export function stabilizeAssembly(assembly, config = {}) {
  const relocateCwd = config.relocateCwd !== false
  const canonicalizeTools = config.canonicalizeTools !== false
  let relocated = false

  const sections = assembly.sections.map((section) => {
    if (!relocateCwd || section.name !== PERSONA_SECTION || !section.text.includes(DEFAULT_CWD_SENTENCE)) {
      return section
    }
    relocated = true
    return {
      ...section,
      text: section.text.replace(DEFAULT_CWD_SENTENCE, STABLE_CWD_SENTENCE),
    }
  })

  const contexts = relocated && !assembly.contexts.some((entry) => entry.name === CWD_CONTEXT)
    ? [...assembly.contexts, { name: CWD_CONTEXT, text: 'Working directory: {{cwd}}' }]
    : assembly.contexts

  return {
    ...assembly,
    sections,
    contexts,
    tools: canonicalizeTools ? assembly.tools.map(canonicalize) : assembly.tools,
  }
}

/** Fold finalized assistant usage records without double-counting stream chunks. */
export function cacheUsage(events) {
  let requests = 0
  let hitTokens = 0
  let missTokens = 0
  let writeTokens = 0
  let reportedRequests = 0

  for (const event of events) {
    if (event?.type !== 'assistant/message') continue
    requests += 1
    const usage = event.data?.usage
    if (usage === undefined) continue
    reportedRequests += 1
    hitTokens += Number.isFinite(usage.cacheReadTokens) ? usage.cacheReadTokens : 0
    missTokens += Number.isFinite(usage.inputTokens) ? usage.inputTokens : 0
    writeTokens += Number.isFinite(usage.cacheWriteTokens) ? usage.cacheWriteTokens : 0
  }

  const promptTokens = hitTokens + missTokens
  return {
    requests,
    reportedRequests,
    hitTokens,
    missTokens,
    writeTokens,
    promptTokens,
    hitRate: promptTokens === 0 ? undefined : hitTokens / promptTokens,
  }
}

export function cacheReport(events) {
  const usage = cacheUsage(events)
  if (usage.reportedRequests === 0) {
    return {
      usage,
      text: 'Cache: no provider cache metrics yet. Send at least one message; the selected provider must report cacheReadTokens/inputTokens.',
    }
  }
  const percent = usage.hitRate === undefined ? 'n/a' : `${(usage.hitRate * 100).toFixed(1)}%`
  return {
    usage,
    text: [
      `Cache hit rate: ${percent}`,
      `Hit tokens: ${usage.hitTokens}`,
      `Miss tokens: ${usage.missTokens}`,
      `Cache-write tokens: ${usage.writeTokens}`,
      `Usage-bearing responses: ${usage.reportedRequests}/${usage.requests}`,
    ].join('\n'),
  }
}
