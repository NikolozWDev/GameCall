let healthCheckPromise: Promise<boolean> | null = null
let lastCheckTime = 0
const CACHE_DURATION = 60000

export type BackendStatus = "checking" | "online" | "offline"

export async function checkBackendHealth(): Promise<boolean> {
  const now = Date.now()
  if (healthCheckPromise && now - lastCheckTime < CACHE_DURATION) {
    return healthCheckPromise
  }

  healthCheckPromise = new Promise<boolean>(async (resolve) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health/`, {
        signal: controller.signal,
        cache: "no-store",
      })
      clearTimeout(timeoutId)
      resolve(res.ok)
    } catch {
      resolve(false)
    }
  })

  lastCheckTime = now
  return healthCheckPromise
}

export async function warmUpBackend(): Promise<void> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health/`, {
      signal: controller.signal,
      cache: "no-store",
    })
    clearTimeout(timeoutId)
  } catch {
  }
}