import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

import type { ClassValue } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(fullName: string) {
  if (fullName.length === 0) return ""
  const names = fullName.split(" ")
  const initials = names.map((name) => name.charAt(0).toUpperCase()).join("")
  return initials
}

export function remToPx(rem: number) {
  const rootFontSize = parseFloat(
    getComputedStyle(document.documentElement).fontSize
  )
  return rem * rootFontSize
}

export function isActivePathname(
  basePathname: string,
  currentPathname: string,
  exactMatch: boolean = false
) {
  if (typeof basePathname !== "string" || typeof currentPathname !== "string") {
    throw new Error("Both basePathname and currentPathname must be strings")
  }
  if (exactMatch) {
    return basePathname === currentPathname
  }
  return (
    currentPathname.startsWith(basePathname) &&
    (currentPathname.length === basePathname.length ||
      currentPathname[basePathname.length] === "/")
  )
}

export function formatFileSize(bytes: number, decimals: number = 2) {
  if (bytes === 0) return "0 Bytes"
  const k = 1000
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

/**
 * Format a number for dashboard overview cards
 */
export function formatOverviewCardValue(
  value: number,
  formatStyle: "regular" | "currency" | "percent" = "regular"
): string {
  switch (formatStyle) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(value)
    case "percent":
      return new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 2,
      }).format(value / 100)
    default:
      return new Intl.NumberFormat("en-US").format(value)
  }
}

/**
 * Format a percentage value
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    signDisplay: "never",
  }).format(value / 100)
}

/**
 * Check if a number is non-negative
 */
export function isNonNegative(value: number): boolean {
  return value >= 0
}

/**
 * Generate a PKCE code verifier (random string)
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

/**
 * Generate a PKCE code challenge from a verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return base64UrlEncode(new Uint8Array(digest))
}

/**
 * Base64URL encode a Uint8Array
 */
function base64UrlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

/**
 * Generate a random state string for OAuth
 */
export function generateOAuthState(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("")
}
