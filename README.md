# dsh-cache-stabilizer

An MIT-licensed DeepSeek Harness plugin that improves the chance of provider prompt-cache reuse without hiding stale state.

It makes two semantics-preserving changes:

- Moves the working directory out of DSH's known default persona sentence and into the runtime-context snapshot. Different projects can then share the same system-prompt prefix while each request still receives the correct `cwd`.
- Canonicalizes object-key order inside tool schemas. Tool order itself is already deterministic in DSH.

It also adds `/cache`, a human-only command that reports the provider's durable `cacheReadTokens`, uncached `inputTokens`, and cache-write tokens. It never invents a cache hit.

## Install

```sh
dsh plugin --profile web add dsh-cache-stabilizer
```

Restart DSH, send a few messages, then enter `/cache` in a command-capable client.

For a custom profile, replace `web` with its profile name. To disable either optimization in a profile patch:

```yaml
- id: dsh-cache-stabilizer
  config:
    relocateCwd: false
    canonicalizeTools: false
```

## Safety boundary

Only the exact sentence used by DSH's standard/headless coding persona is relocated. A custom persona that mentions `{{cwd}}` in another form is left unchanged because blindly moving arbitrary prose can change meaning. The plugin does not freeze tool catalogs, reuse stale context, proxy model responses, or implement a second cache.

DeepSeek's provider cache is automatic and depends on an exact prefix match from token zero. Storage and eviction remain provider-controlled.

## Development

```sh
npm test
npm run check
```
