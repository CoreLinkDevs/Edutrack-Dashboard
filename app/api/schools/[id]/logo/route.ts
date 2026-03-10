import { type NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authorization = request.headers.get("authorization")
  if (!authorization) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
  }

  try {
    // Await the params before using them
    const { id } = await params
    
    // Get the form data from the request
    const formData = await request.formData()

    // Forward the form data to the backend
    const response = await fetch(`http://localhost:3000/api/schools/${id}/logo`, {
      method: "POST",
      headers: {
        Authorization: authorization,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || "Failed to upload logo" }, 
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Logo upload API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}