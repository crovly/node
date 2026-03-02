export class CrovlyError extends Error {
  readonly code: string
  readonly statusCode?: number

  constructor(message: string, code: string, statusCode?: number) {
    super(message)
    this.name = 'CrovlyError'
    this.code = code
    this.statusCode = statusCode
  }
}

export class AuthenticationError extends CrovlyError {
  constructor(message = 'Invalid or missing secret key') {
    super(message, 'authentication_error', 401)
    this.name = 'AuthenticationError'
  }
}

export class ValidationError extends CrovlyError {
  readonly details?: Array<{ code: string; path?: string[]; message: string }>

  constructor(
    message: string,
    details?: Array<{ code: string; path?: string[]; message: string }>,
  ) {
    super(message, 'validation_error', 400)
    this.name = 'ValidationError'
    this.details = details
  }
}

export class RateLimitError extends CrovlyError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 'rate_limit_error', 429)
    this.name = 'RateLimitError'
  }
}

export class NetworkError extends CrovlyError {
  constructor(message = 'Network request failed') {
    super(message, 'network_error')
    this.name = 'NetworkError'
  }
}

export class TimeoutError extends CrovlyError {
  constructor(message = 'Request timed out') {
    super(message, 'timeout_error')
    this.name = 'TimeoutError'
  }
}
