import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Forward the request to the actual EduTrack API
    const response = await fetch(`http://localhost:3000/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Registration failed" }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Registration API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
