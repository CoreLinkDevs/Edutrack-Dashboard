import { type NextRequest, NextResponse } from "next/server"
import { API_CONFIG } from "@/lib/config"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
  }

  try {
    const queryString = searchParams.toString()
    const url = `${API_CONFIG.BASE_URL}/api/schools${queryString ? `?${queryString}` : ""}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ error: errorData.message || "Failed to fetch schools" }, { status: response.status })
    }

    const data = await response.json()
    console.log("Fetched schools data:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Schools API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    console.log('Received FormData with entries:', Array.from(formData.entries()).map(([key, value]) => ({
      key,
      value: value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value
    })))

    // Create new FormData to forward to backend
    const backendFormData = new FormData()

    // Extract and append all form fields
    for (const [key, value] of formData.entries()) {
      backendFormData.append(key, value)
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/schools`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        // Don't set Content-Type for FormData - let browser set it with boundary
      },
      body: backendFormData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ error: errorData.message || "Failed to create school" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Create school API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
