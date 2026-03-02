import { Crovly } from './client'

export { Crovly }
export default Crovly

// Error classes
export {
  CrovlyError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  NetworkError,
  TimeoutError,
} from './errors'

// Types
export type {
  CrovlyOptions,
  VerifyOptions,
  VerifyResponse,
  ApiErrorBody,
} from './types'
