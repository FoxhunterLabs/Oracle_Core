/**
 * Minimal base44 client stub.
 *
 * Your component expects:
 * base44.integrations.Core.predict()
 *
 * By default this uses a mock response.
 * If VITE_BASE44_API_URL is set, it will call `${VITE_BASE44_API_URL}/predict`.
 */

const API_URL = import.meta.env.VITE_BASE44_API_URL

async function predict() {
  if (!API_URL) {
    // Mock response for demo/local
    return {
      confidence: 0.86,
      signal: "GREEN",
      narrative: "Trajectory stable. No proximate collisions detected.",
      timestamp: new Date().toISOString(),
      vectors: Array.from({ length: 12 }).map((_, i) => ({
        id: i + 1,
        magnitude: Math.random(),
        azimuth: Math.random() * 360,
        elevation: (Math.random() * 2 - 1) * 45,
      })),
    }
  }

  const res = await fetch(`${API_URL.replace(/\/$/, '')}/predict`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`Predict request failed: ${res.status}`)
  }

  return res.json()
}

export const base44 = {
  integrations: {
    Core: { predict },
  },
}

export default base44
