/**
 * Keep-Alive System
 * 
 * Prevents server hibernation and ensures bot stays responsive
 * by sending periodic health checks and self-pings.
 */

import { ENV } from "./_core/env";

const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes
const HEALTH_CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes

let lastSuccessfulPing = Date.now();
let consecutiveFailures = 0;

/**
 * Send a ping to keep the server alive
 */
async function sendKeepAlivePing(): Promise<boolean> {
  try {
    const response = await fetch(`https://3000-in77ue6pwa0mxr69upg56-f19f248a.sg1.manus.computer/api/health`, {
      method: "GET",
      headers: {
        "User-Agent": "KeepAlive/1.0",
      },
    });

    if (response.ok) {
      lastSuccessfulPing = Date.now();
      consecutiveFailures = 0;
      console.log("[KeepAlive] ✅ Ping successful");
      return true;
    } else {
      consecutiveFailures++;
      console.warn(`[KeepAlive] ⚠️ Ping failed with status ${response.status}`);
      return false;
    }
  } catch (error) {
    consecutiveFailures++;
    console.error("[KeepAlive] ❌ Ping error:", error);
    return false;
  }
}

/**
 * Check if server needs attention
 */
function checkHealth(): void {
  const timeSinceLastPing = Date.now() - lastSuccessfulPing;
  const minutesSinceLastPing = Math.floor(timeSinceLastPing / 60000);

  if (consecutiveFailures >= 3) {
    console.error(
      `[KeepAlive] 🚨 CRITICAL: ${consecutiveFailures} consecutive failures! Server may be down.`
    );
  } else if (minutesSinceLastPing > 10) {
    console.warn(
      `[KeepAlive] ⚠️ WARNING: No successful ping for ${minutesSinceLastPing} minutes`
    );
  } else {
    console.log(
      `[KeepAlive] ✅ Health OK (last ping: ${minutesSinceLastPing}m ago, failures: ${consecutiveFailures})`
    );
  }
}

/**
 * Start the keep-alive system
 */
export function startKeepAliveSystem(): void {
  console.log("[KeepAlive] 🚀 Starting keep-alive system...");
  console.log(`[KeepAlive] Ping interval: ${PING_INTERVAL / 1000}s`);
  console.log(`[KeepAlive] Health check interval: ${HEALTH_CHECK_INTERVAL / 1000}s`);

  // Initial ping
  sendKeepAlivePing();

  // Periodic pings
  setInterval(() => {
    sendKeepAlivePing();
  }, PING_INTERVAL);

  // Periodic health checks
  setInterval(() => {
    checkHealth();
  }, HEALTH_CHECK_INTERVAL);

  console.log("[KeepAlive] ✅ Keep-alive system started");
}

/**
 * Get current status
 */
export function getKeepAliveStatus() {
  return {
    lastSuccessfulPing: new Date(lastSuccessfulPing).toISOString(),
    timeSinceLastPing: `${Math.floor((Date.now() - lastSuccessfulPing) / 60000)} minutes`,
    consecutiveFailures,
  };
}
