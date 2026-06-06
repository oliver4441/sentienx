"use client";

import { useCallback, useRef } from "react";

/**
 * Fetch wrapper that automatically refreshes the access token on 401.
 * Implements a single-flight pattern: if multiple requests fail with 401
 * simultaneously, only one refresh call is made and the rest wait.
 */
export function useAuthFetch() {
  const isRefreshing = useRef(false);
  const refreshPromise = useRef<Promise<boolean> | null>(null);

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      // First attempt
      const response = await fetch(url, {
        ...options,
        credentials: "include", // Always send cookies
      });

      // If not a 401, return as-is
      if (response.status !== 401) {
        return response;
      }

      // If already refreshing, wait for that to complete and retry
      if (isRefreshing.current) {
        if (refreshPromise.current) {
          const refreshed = await refreshPromise.current;
          if (refreshed) {
            return fetch(url, { ...options, credentials: "include" });
          }
        }
        return response; // Refresh failed, return original 401
      }

      // Start refresh
      isRefreshing.current = true;
      refreshPromise.current = (async () => {
        try {
          const refreshResponse = await fetch("/api/auth/deriv/refresh", {
            method: "POST",
            credentials: "include",
          });
          return refreshResponse.ok;
        } catch {
          return false;
        } finally {
          isRefreshing.current = false;
          refreshPromise.current = null;
        }
      })();

      const refreshed = await refreshPromise.current;

      if (refreshed) {
        // Retry the original request with new token
        return fetch(url, { ...options, credentials: "include" });
      }

      // Refresh failed — let the caller handle the 401
      return response;
    },
    []
  );

  return { authFetch };
}
