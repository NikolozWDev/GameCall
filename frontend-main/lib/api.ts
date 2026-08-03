// API Configuration and Helper Functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"

// Token management
export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("access_token")
}

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("refresh_token")
}

export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem("access_token", access)
  localStorage.setItem("refresh_token", refresh)
}

export const clearTokens = () => {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
}

// Guest name management
export const getGuestName = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("guest_name")
}

export const setGuestName = (name: string) => {
  localStorage.setItem("guest_name", name)
}

export const getGuestSessionId = (): string => {
  if (typeof window === "undefined") return ""
  let sessionId = localStorage.getItem("guest_session_id")
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem("guest_session_id", sessionId)
  }
  return sessionId
}

// API Error class
export class APIError extends Error {
  status: number
  data: Record<string, unknown>

  constructor(message: string, status: number, data: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.data = data
  }
}

// Fetch with auth
async function fetchWithAuth(endpoint: string, options: RequestInit = {}, requireAuth = false): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  const accessToken = getAccessToken()
  if (accessToken) {
    ;(headers as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`
  }

  console.log("[v0] API Request:", { url, method: options.method || "GET", hasToken: !!accessToken })

  let response = await fetch(url, { ...options, headers })

  console.log("[v0] API Response:", { url, status: response.status, ok: response.ok })

  // If 401 and we have refresh token, try to refresh
  if (response.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      ;(headers as Record<string, string>)["Authorization"] = `Bearer ${getAccessToken()}`
      response = await fetch(url, { ...options, headers })
    }
  }

  if (!response.ok && requireAuth && response.status === 401) {
    clearTokens()
    throw new APIError("Authentication required", 401)
  }

  return response
}

// Refresh access token
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const response = await fetch(`${API_BASE_URL}/user/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (response.ok) {
      const data = await response.json()
      setTokens(data.access, data.refresh || refreshToken)
      return true
    }
  } catch {
    // Refresh failed
  }

  clearTokens()
  return false
}

// API Types
export interface User {
  id: number
  email: string
  username: string
}

export interface Room {
  id: string
  name: string
  room_code: string
  creator: User
  is_active: boolean
  created_at: string
}

export interface RoomJoinResponse extends Room {
  livekit: {
    url: string
    token: string
    is_admin: boolean
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  username: string
  password: string
  password2: string
}

// API Functions
export const api = {
  // Auth
  async login(credentials: LoginCredentials): Promise<{ access: string; refresh: string }> {
    const response = await fetch(`${API_BASE_URL}/user/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new APIError(data.detail || "Login failed", response.status, data)
    }

    const data = await response.json()
    setTokens(data.access, data.refresh)
    return data
  },

  async register(data: RegisterData): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/user/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new APIError(
        errorData.detail || Object.values(errorData).flat().join(", ") || "Registration failed",
        response.status,
        errorData,
      )
    }

    return response.json()
  },

  async getMe(): Promise<User> {
    const response = await fetchWithAuth("/user/me/", {}, true)

    if (!response.ok) {
      throw new APIError("Failed to get user", response.status)
    }

    return response.json()
  },

  logout() {
    clearTokens()
  },

  // Rooms
  async createRoom(name: string): Promise<Room> {
    const response = await fetchWithAuth(
      "/rooms/create/",
      {
        method: "POST",
        body: JSON.stringify({ name }),
      },
      true,
    )

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new APIError(data.detail || "Failed to create room", response.status, data)
    }

    return response.json()
  },

  async getMyRooms(): Promise<Room[]> {
    const response = await fetchWithAuth("/rooms/", {}, true)

    if (!response.ok) {
      throw new APIError("Failed to get rooms", response.status)
    }

    return response.json()
  },

  async joinRoom(roomCode: string, guestName?: string): Promise<RoomJoinResponse> {
    const accessToken = getAccessToken()
    const body: Record<string, string> = { room_code: roomCode }

    // თუ guest-ია, დაუმატე სახელი და session_id
    if (!accessToken && guestName) {
      body.guest_name = guestName
      body.session_id = getGuestSessionId()
    }

    console.log("[v0] joinRoom called with:", { roomCode, guestName, hasToken: !!accessToken, body })

    const response = await fetchWithAuth("/rooms/join/", {
      method: "POST",
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      console.log("[v0] joinRoom error response:", data)
      throw new APIError(data.detail || "Failed to join room", response.status, data)
    }

    const data = await response.json()
    console.log("[v0] joinRoom success:", data)
    return data
  },

  async getRoomDetail(roomId: string): Promise<Room> {
    const response = await fetchWithAuth(`/rooms/${roomId}/`)

    if (!response.ok) {
      throw new APIError("Room not found", response.status)
    }

    return response.json()
  },
}