import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 })
    }

    // Forward the request to the actual EduTrack API
    const response = await fetch(`http://localhost:3000/api/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Token refresh failed" }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Token refresh API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
