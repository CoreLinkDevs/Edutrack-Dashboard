import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get("studentId")
  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 })
  }

  if (!studentId) {
    return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
  }

  try {
    const formData = await request.formData()

    const response = await fetch(
      `http://localhost:3000/api/assignments/${params.id}/submit?studentId=${studentId}`,
      {
        method: "POST",
        headers: {
          Authorization: authorization,
        },
        body: formData,
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || "Failed to submit assignment" },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Submit assignment API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
