const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ---- Token helpers ----
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

// ---- Guest helpers ----
export const getGuestName = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("guest_name")
}
export const setGuestName = (name: string) => localStorage.setItem("guest_name", name)

export const getGuestSessionId = (): string => {
  if (typeof window === "undefined") return ""
  let sessionId = localStorage.getItem("guest_session_id")
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem("guest_session_id", sessionId)
  }
  return sessionId
}

// ---- Error class ----
export class APIError extends Error {
  status: number
  data: Record<string, unknown>
  constructor(message: string, status: number, data: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.data = data
  }
}

// ---- Fetch with auth ----
async function fetchWithAuth(endpoint: string, options: RequestInit = {}, requireAuth = false): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`
  const headers: HeadersInit = { ...options.headers as Record<string, string> }

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json"
  }
  if (options.body instanceof FormData) {
    delete headers["Content-Type"]
  }

  const accessToken = getAccessToken()
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }

  let response = await fetch(url, { ...options, headers })

  if (response.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      headers["Authorization"] = `Bearer ${getAccessToken()}`
      response = await fetch(url, { ...options, headers })
    }
  }

  if (!response.ok && requireAuth && response.status === 401) {
    clearTokens()
    throw new APIError("Authentication required", 401)
  }

  return response
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  try {
    const res = await fetch(`${API_BASE_URL}/user/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    })
    if (res.ok) {
      const data = await res.json()
      setTokens(data.access, data.refresh || refreshToken)
      return true
    }
  } catch {}
  clearTokens()
  return false
}

// ---- Types ----
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
  duration?: string
}

export interface RoomJoinResponse extends Room {
  livekit: {
    url: string
    token: string
    is_admin: boolean
  }
  participants?: Array<{
    identity: string
    display_name: string
    is_muted: boolean
    profile_picture_url: string | null
  }>
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

// ---- Supabase Storage ----
export async function uploadProfilePicture(file: File): Promise<string> {
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/profile-pictures/${fileName}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "apikey": SUPABASE_ANON_KEY,
      },
      body: file,
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Upload failed")
  }

  // Return the full public URL using the known file name
  return `${SUPABASE_URL}/storage/v1/object/public/profile-pictures/${fileName}`
}

// ---- API functions ----
export const api = {
  async login(creds: LoginCredentials) {
    const res = await fetch(`${API_BASE_URL}/user/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new APIError(data.detail || "Login failed", res.status, data)
    }
    const data = await res.json()
    setTokens(data.access, data.refresh)
    return data
  },

  async register(data: RegisterData): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/user/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new APIError(
        errData.detail || Object.values(errData).flat().join(", ") || "Registration failed",
        res.status,
        errData,
      )
    }
    return res.json()
  },

  async getMe(): Promise<User> {
    const res = await fetchWithAuth("/user/me/", {}, true)
    if (!res.ok) throw new APIError("Failed to get user", res.status)
    return res.json()
  },

  logout() { clearTokens() },

  async createRoom(name: string): Promise<Room> {
    const res = await fetchWithAuth("/rooms/create/", {
      method: "POST",
      body: JSON.stringify({ name }),
    }, true)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new APIError(data.detail || "Failed to create room", res.status, data)
    }
    return res.json()
  },

  async getMyRooms(): Promise<Room[]> {
    const res = await fetchWithAuth("/rooms/", {}, true)
    if (!res.ok) throw new APIError("Failed to get rooms", res.status)
    return res.json()
  },

  async joinRoom(roomCode: string, guestName?: string): Promise<RoomJoinResponse> {
    const accessToken = getAccessToken()
    const body: Record<string, string> = { room_code: roomCode }
    if (!accessToken && guestName) {
      body.guest_name = guestName
      body.session_id = getGuestSessionId()
    }
    const res = await fetchWithAuth("/rooms/join/", {
      method: "POST",
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new APIError(data.detail || "Failed to join room", res.status, data)
    }
    return res.json()
  },

  async getRoomDetail(roomId: string): Promise<Room> {
    const res = await fetchWithAuth(`/rooms/${roomId}/`)
    if (!res.ok) throw new APIError("Room not found", res.status)
    return res.json()
  },

  async muteParticipant(roomId: string, identity: string) {
    const res = await fetchWithAuth(`/rooms/${roomId}/mute/`, {
      method: "POST",
      body: JSON.stringify({ identity }),
    }, true)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new APIError(data.detail || "Failed to mute participant", res.status, data)
    }
    return res.json()
  },

  async disconnectParticipant(roomId: string, identity: string) {
    const res = await fetchWithAuth(`/rooms/${roomId}/disconnect/`, {
      method: "POST",
      body: JSON.stringify({ identity }),
    }, true)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new APIError(data.detail || "Failed to disconnect participant", res.status, data)
    }
    return res.json()
  },

  async muteAll(roomId: string) {
    const res = await fetchWithAuth(`/rooms/${roomId}/mute-all/`, {
      method: "POST",
    }, true)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new APIError(data.detail || "Failed to mute all", res.status, data)
    }
    return res.json()
  },

  async endRoom(roomId: string) {
    const res = await fetchWithAuth(`/rooms/${roomId}/end/`, {
      method: "POST",
    }, true)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new APIError(data.detail || "Failed to end room", res.status, data)
    }
    return res.json()
  },

  async leaveRoom(roomId: string, identity: string) {
    const res = await fetchWithAuth(`/rooms/${roomId}/leave/`, {
      method: "POST",
      body: JSON.stringify({ identity }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new APIError(data.detail || "Failed to leave room", res.status, data)
    }
    return res.json()
  },
}

// ---- Profile Types & API ----
export interface UserProfile {
  id: string
  email: string
  username: string
  profile_picture_url: string | null
}

export interface PasswordChangePayload {
  old_password: string
  new_password: string
  new_password2: string
}

export const profileApi = {
  async getProfile(): Promise<UserProfile> {
    const res = await fetchWithAuth("/user/me/", {}, true)
    if (!res.ok) throw new APIError("Failed to load profile", res.status)
    return res.json()
  },

  async updateProfile(data: { username?: string; profile_picture_url?: string }): Promise<UserProfile> {
    const res = await fetchWithAuth("/user/me/update/", {
      method: "PATCH",
      body: JSON.stringify(data),
    }, true)
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new APIError(errData.detail || "Failed to update profile", res.status, errData)
    }
    return res.json()
  },

  async changePassword(data: PasswordChangePayload): Promise<{ detail: string }> {
    const res = await fetchWithAuth("/user/me/change-password/", {
      method: "POST",
      body: JSON.stringify(data),
    }, true)
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new APIError(errData.detail || "Failed to change password", res.status, errData)
    }
    return res.json()
  },
}

// ---- Forgot Password API ----
export const forgotPasswordApi = {
  async requestCode(email: string): Promise<{ detail: string }> {
    const res = await fetch(`${API_BASE_URL}/user/forgot-password/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new APIError(errData.detail || Object.values(errData).flat().join(", ") || "Failed to send code", res.status, errData)
    }
    return res.json()
  },

  async verifyCode(email: string, code: string): Promise<{ reset_token: string }> {
    const res = await fetch(`${API_BASE_URL}/user/verify-reset-code/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new APIError(errData.detail || Object.values(errData).flat().join(", ") || "Invalid code", res.status, errData)
    }
    return res.json()
  },

  async resetPassword(token: string, newPassword: string, newPassword2: string): Promise<{ detail: string }> {
    const res = await fetch(`${API_BASE_URL}/user/reset-password/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password: newPassword, new_password2: newPassword2 }),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new APIError(errData.detail || Object.values(errData).flat().join(", ") || "Failed to reset password", res.status, errData)
    }
    return res.json()
  }
}