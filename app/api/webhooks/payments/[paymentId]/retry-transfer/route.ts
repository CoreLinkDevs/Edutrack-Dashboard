import { type NextRequest, NextResponse } from "next/server"
import { API_CONFIG } from "@/lib/config"

export async function POST(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/webhooks/payments/${params.paymentId}/retry-transfer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ error: errorData.message || "Failed to retry transfer" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Retry transfer API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}