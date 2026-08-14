import test from 'node:test'
import assert from 'node:assert/strict'
import { cacheReport, cacheUsage, canonicalize, stabilizeAssembly } from '../lib/stabilizer.mjs'

function assembly(cwd, persona = 'You are a coding agent. Your working directory is {{cwd}}.') {
  return {
    sections: [{ name: 'deployment:persona', text: persona }],
    contexts: [],
    tools: [{ name: 'write', parameters: { required: ['path'], properties: { z: { type: 'string' }, a: { type: 'string' } }, type: 'object' } }],
    variables: { cwd, model: 'deepseek' },
  }
}

test('moves the known cwd sentence out of the reusable system prefix', () => {
  const first = stabilizeAssembly(assembly('C:/one'))
  const second = stabilizeAssembly(assembly('D:/two'))
  assert.deepEqual(first.sections, second.sections)
  assert.equal(first.contexts[0].text, 'Working directory: {{cwd}}')
  assert.equal(first.variables.cwd, 'C:/one')
  assert.equal(second.variables.cwd, 'D:/two')
})

test('does not guess how to rewrite a custom persona', () => {
  const original = assembly('C:/one', 'Work carefully in {{cwd}} and never leave it.')
  const result = stabilizeAssembly(original)
  assert.deepEqual(result.sections, original.sections)
  assert.deepEqual(result.contexts, [])
})

test('canonicalizes schema object keys while preserving array order', () => {
  assert.deepEqual(canonicalize({ z: 1, a: { y: 2, b: 3 }, rows: [{ z: 1, a: 2 }] }), {
    a: { b: 3, y: 2 },
    rows: [{ a: 2, z: 1 }],
    z: 1,
  })
})

test('reports disjoint provider hit and miss token evidence', () => {
  const events = [
    { type: 'assistant/message', data: { usage: { inputTokens: 100, cacheReadTokens: 300, cacheWriteTokens: 20 } } },
    { type: 'assistant/message', data: { usage: { inputTokens: 50, cacheReadTokens: 450 } } },
    { type: 'assistant/message', data: {} },
    { type: 'assistant/chunk', data: { chunk: { type: 'usage', usage: { inputTokens: 999 } } } },
  ]
  assert.deepEqual(cacheUsage(events), {
    requests: 3,
    reportedRequests: 2,
    hitTokens: 750,
    missTokens: 150,
    writeTokens: 20,
    promptTokens: 900,
    hitRate: 750 / 900,
  })
  assert.match(cacheReport(events).text, /83\.3%/)
})
