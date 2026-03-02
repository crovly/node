# @crovly/node

Official server-side SDK for [Crovly](https://crovly.com) -- privacy-first captcha verification.

Verify Crovly captcha tokens from your Node.js backend with a single method call. Zero runtime dependencies.

## Installation

```bash
npm install @crovly/node
```

Requires Node.js 18+. Zero runtime dependencies.

## Quick Start

```typescript
import Crovly from '@crovly/node'

const crovly = new Crovly({ secretKey: 'crvl_secret_xxx' })

// In your form handler / API route
const result = await crovly.verify({
  token: req.body.crovlyToken,
  expectedIp: req.ip, // optional but recommended
})

if (result.success && result.score >= 0.5) {
  // Human -- allow the action
} else {
  // Bot -- reject
}
```

## Configuration

```typescript
const crovly = new Crovly({
  secretKey: 'crvl_secret_xxx', // required
  apiUrl: 'https://api.crovly.com', // default
  timeout: 10000, // default 10s
})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `secretKey` | `string` | -- | Your site's secret key (required) |
| `apiUrl` | `string` | `https://api.crovly.com` | API base URL |
| `timeout` | `number` | `10000` | Request timeout in milliseconds |

## API Reference

### `crovly.verify(options)`

Verifies a captcha token returned by the Crovly widget.

```typescript
const result = await crovly.verify({
  token: 'crvl_token_xxx', // required -- from widget
  expectedIp: '1.2.3.4', // optional -- enables IP binding
})
```

#### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | `string` | Yes | Captcha token from the Crovly widget |
| `expectedIp` | `string` | No | Expected client IP. Enables IP binding validation. |

#### Response

```typescript
{
  success: boolean  // true if verification passed
  score: number     // 0.0 (bot) to 1.0 (human)
  ip: string        // IP that solved the challenge
  solvedAt: string  // ISO 8601 timestamp
}
```

## Error Handling

All errors extend `CrovlyError` with `code` and optional `statusCode`:

```typescript
import { CrovlyError, AuthenticationError, ValidationError, TimeoutError } from '@crovly/node'

try {
  const result = await crovly.verify({ token })
} catch (err) {
  if (err instanceof AuthenticationError) {
    // Invalid secret key (401)
  } else if (err instanceof ValidationError) {
    // Invalid request body (400)
    console.log(err.details) // field-level errors
  } else if (err instanceof TimeoutError) {
    // Request timed out
  } else if (err instanceof CrovlyError) {
    console.log(err.code, err.statusCode, err.message)
  }
}
```

### Error Classes

| Class | Status | When |
|-------|--------|------|
| `AuthenticationError` | 401 | Invalid or missing secret key |
| `ValidationError` | 400 | Invalid request body |
| `RateLimitError` | 429 | Too many requests |
| `TimeoutError` | -- | Request timed out |
| `NetworkError` | -- | Network failure (DNS, connection refused, etc.) |

## Framework Examples

### Express

```typescript
import express from 'express'
import Crovly from '@crovly/node'

const app = express()
const crovly = new Crovly({ secretKey: process.env.CROVLY_SECRET_KEY! })

app.post('/contact', async (req, res) => {
  const { crovlyToken, name, email, message } = req.body

  const result = await crovly.verify({
    token: crovlyToken,
    expectedIp: req.ip,
  })

  if (!result.success || result.score < 0.5) {
    return res.status(403).json({ error: 'Captcha verification failed' })
  }

  // Process the form...
  res.json({ success: true })
})
```

### Next.js (App Router)

```typescript
import Crovly from '@crovly/node'
import { NextRequest, NextResponse } from 'next/server'

const crovly = new Crovly({ secretKey: process.env.CROVLY_SECRET_KEY! })

export async function POST(req: NextRequest) {
  const { token, ...formData } = await req.json()

  const result = await crovly.verify({
    token,
    expectedIp: req.headers.get('x-forwarded-for') ?? undefined,
  })

  if (!result.success || result.score < 0.5) {
    return NextResponse.json({ error: 'Bot detected' }, { status: 403 })
  }

  // Process the form...
  return NextResponse.json({ success: true })
}
```

### Fastify

```typescript
import Fastify from 'fastify'
import Crovly from '@crovly/node'

const app = Fastify()
const crovly = new Crovly({ secretKey: process.env.CROVLY_SECRET_KEY! })

app.post('/submit', async (request, reply) => {
  const { crovlyToken } = request.body as { crovlyToken: string }

  const result = await crovly.verify({
    token: crovlyToken,
    expectedIp: request.ip,
  })

  if (!result.success || result.score < 0.5) {
    return reply.status(403).send({ error: 'Captcha verification failed' })
  }

  return { success: true }
})
```

## Score Interpretation

| Score Range | Interpretation | Recommended Action |
|-------------|----------------|-------------------|
| 0.8 -- 1.0 | Very likely human | Allow |
| 0.5 -- 0.8 | Probably human | Allow (default threshold) |
| 0.3 -- 0.5 | Suspicious | Challenge or rate limit |
| 0.0 -- 0.3 | Very likely bot | Block |

The default threshold is 0.5. You can adjust this per site in the Crovly dashboard.

## See Also

- [Documentation](https://docs.crovly.com) -- Full guides and API reference
- [Dashboard](https://app.crovly.com) -- Manage sites and view analytics
- [Widget Integration](https://docs.crovly.com/widget) -- Client-side setup

## License

MIT
