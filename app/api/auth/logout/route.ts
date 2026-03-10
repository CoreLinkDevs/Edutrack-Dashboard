import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 })
    }

    // Forward the request to the actual EduTrack API
    const response = await fetch(`http://localhost:3000/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    })

    // Logout should succeed even if the backend request fails
    // since we're clearing local auth data anyway
    try {
      const data = await response.json()
      return NextResponse.json(data)
    } catch {
      // If response parsing fails, return a generic success
      return NextResponse.json({ message: "Logged out successfully" })
    }
  } catch (error) {
    console.error("Logout API error:", error)
    // Still return success since we're clearing local auth data
    return NextResponse.json({ message: "Logged out successfully" })
  }
}
