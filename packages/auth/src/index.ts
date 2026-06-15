export {
  generateSessionToken,
  createSession,
  validateSession,
  invalidateSession,
  invalidateUserSessions,
} from "./session.js"

export {
  decodeIdToken,
  generateCodeVerifier,
  generateState,
  Google,
} from "./oauth.js"

export {
  AuthError,
  requireAuth,
  requireAdmin,
  requireAuthor,
  requireAuthorOrAdmin,
} from "./guards.js"

export type {
  AuthConfig,
  AuthSession,
  AuthUser,
  SessionValidationResult,
  UserRole,
} from "./types.js"
