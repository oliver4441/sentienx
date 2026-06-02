"use client"

/**
 * Deriv Auth Hook — legacy compatibility re-export.
 *
 * For new code, prefer importing directly from @/contexts/auth-context
 * which provides the full AuthProvider and useAuth hook.
 *
 * This hook wraps useAuth for components that need just the auth actions.
 */
export { useAuth as useDerivAuth } from "@/contexts/auth-context"
