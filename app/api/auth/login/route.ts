import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Forward the request to the actual EduTrack API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"}/api/auth/login`, {
      // Use an environment variable for backend URL
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    console.log("Login response body:", data)

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Login failed" }, { status: response.status })
    }

    // Assuming the backend returns accessToken and refreshToken
    const { accessToken, refreshToken, user, school } = data

    if (!accessToken || !refreshToken) {
      return NextResponse.json({ error: "Authentication tokens not received" }, { status: 500 })
    }

    // Add school info to user if school exists
    const userWithSchool = school ? { ...user, schoolId: school.id, schoolName: school.name } : user

    // Create a new NextResponse to set cookies
    const res = NextResponse.json({ user: userWithSchool, accessToken, refreshToken }, { status: 200 })

    // Set accessToken as an HTTP-only cookie
    res.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure in production (HTTPS)
      sameSite: "lax", // Or 'strict' for more security, 'none' for cross-site (requires secure)
      path: "/", // Accessible across the entire application
      maxAge: 60 * 60, // 1 hour (adjust as needed, should match token expiry)
    })

    // Set refreshToken as an HTTP-only cookie (longer expiry)
    res.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days (adjust as needed)
    })

    return res
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
