import type { CrovlyOptions, VerifyOptions, VerifyResponse, ApiErrorBody } from './types'
import {
  CrovlyError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  NetworkError,
  TimeoutError,
} from './errors'

const DEFAULT_API_URL = 'https://api.crovly.com'
const DEFAULT_TIMEOUT = 10_000
const SDK_VERSION = '1.0.2'

export class Crovly {
  private readonly secretKey: string
  private readonly apiUrl: string
  private readonly timeout: number

  constructor(options: CrovlyOptions & { secretKey: string }) {
    if (!options.secretKey) {
      throw new CrovlyError(
        'Secret key is required. Pass your crvl_secret_xxx key.',
        'configuration_error',
      )
    }

    this.secretKey = options.secretKey
    this.apiUrl = (options.apiUrl ?? DEFAULT_API_URL).replace(/\/+$/, '')
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT
  }

  /**
   * Verify a captcha token returned by the Crovly widget.
   *
   * @param options - Token and optional expected IP
   * @returns Verification result with success status, score, IP, and solve time
   * @throws {AuthenticationError} Invalid or missing secret key (401)
   * @throws {ValidationError} Invalid request body (400)
   * @throws {RateLimitError} Too many requests (429)
   * @throws {TimeoutError} Request timed out
   * @throws {NetworkError} Network failure
   * @throws {CrovlyError} Any other API error
   */
  async verify(options: VerifyOptions): Promise<VerifyResponse> {
    const url = `${this.apiUrl}/verify-token`

    const body: Record<string, string> = {
      token: options.token,
    }
    if (options.expectedIp) {
      body.expectedIp = options.expectedIp
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
          'User-Agent': `@crovly/node/${SDK_VERSION}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (response.ok) {
        return (await response.json()) as VerifyResponse
      }

      await this.throwApiError(response)
    } catch (err) {
      // Re-throw our own errors
      if (err instanceof CrovlyError) {
        throw err
      }

      // Handle AbortError (timeout)
      if (err instanceof Error && err.name === 'TimeoutError') {
        throw new TimeoutError(
          `Request to ${url} timed out after ${this.timeout}ms`,
        )
      }

      // Handle AbortError from older Node versions
      if (err instanceof Error && err.name === 'AbortError') {
        throw new TimeoutError(
          `Request to ${url} timed out after ${this.timeout}ms`,
        )
      }

      // Network errors
      throw new NetworkError(
        err instanceof Error ? err.message : 'Network request failed',
      )
    }

    // TypeScript: unreachable, but satisfies return type
    throw new CrovlyError('Unexpected error', 'unknown_error')
  }

  private async throwApiError(response: Response): Promise<never> {
    let body: ApiErrorBody
    try {
      body = (await response.json()) as ApiErrorBody
    } catch {
      body = { error: response.statusText || 'Unknown error' }
    }

    const message = body.error ?? 'Unknown error'

    switch (response.status) {
      case 400:
        throw new ValidationError(message, body.details)
      case 401:
        throw new AuthenticationError(message)
      case 429:
        throw new RateLimitError(message)
      default:
        throw new CrovlyError(message, 'api_error', response.status)
    }
  }
}
