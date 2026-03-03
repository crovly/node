// ── Client Options ──

export interface CrovlyOptions {
  /** API base URL. Default: https://api.crovly.com */
  apiUrl?: string
  /** Request timeout in ms. Default: 10000 */
  timeout?: number
}

// ── Verify ──

export interface VerifyOptions {
  /** The captcha token returned by the Crovly widget */
  token: string
  /** Expected client IP address. Enables IP binding validation. */
  expectedIp?: string
}

export interface VerifyResponse {
  /** Whether the verification passed */
  success: boolean
  /** Risk score from 0.0 (bot) to 1.0 (human) */
  score: number
  /** IP address that solved the challenge */
  ip: string
  /** Unix timestamp in milliseconds when the challenge was solved */
  solvedAt: number
}

// ── API Error Shape ──

export interface ApiErrorBody {
  error: string
  details?: Array<{ code: string; path?: string[]; message: string }>
}
