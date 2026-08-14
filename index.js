import { cacheReport, stabilizeAssembly } from './lib/stabilizer.mjs'

export const name = 'dsh-cache-stabilizer'
export const inject = ['commands']

export function apply(ctx, config = {}) {
  ctx.on('system-prompt/assemble', async (_assembly, _context, next) => {
    const assembled = await next()
    return stabilizeAssembly(assembled, config)
  })

  ctx.commands.register({
    name: 'cache',
    description: 'Show provider-reported prompt cache hits and misses for this session',
    handler: ({ agent }) => ({
      kind: 'success',
      text: cacheReport(agent.session.events).text,
    }),
  })
}
