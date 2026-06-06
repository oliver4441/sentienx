import { NextRequest } from "next/server";

/**
 * Crash Game WebSocket endpoint.
 * This is a placeholder — in production, you'd use a separate WebSocket server
 * or a service like Pusher, Ably, or Socket.io with a custom server.
 *
 * For Next.js on Render, we'll use a polling-based approach as fallback.
 */

export async function GET(request: NextRequest) {
  return new Response("WebSocket server running", { status: 200 });
}
