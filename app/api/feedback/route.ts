import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { requireAuth } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parkingSpaceId = searchParams.get("parking_space_id")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const offset = (page - 1) * limit

    let query = db.feedback().select(
      `
        *,
        users!inner(first_name, last_name),
        parking_spaces!inner(establishment_name, city)
      `,
      { count: "exact" },
    )

    if (parkingSpaceId) {
      query = query.eq("parking_space_id", Number.parseInt(parkingSpaceId))
    }

    const {
      data: feedback,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order("created_at", { ascending: false })

    if (error) {
      console.error("Feedback fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Feedback fetched successfully",
      data: feedback,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Feedback API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth()(request)
  if (authResult instanceof Response) return authResult

  try {
    const { parking_space_id, rating, comment } = await request.json()

    if (!parking_space_id || !rating) {
      return NextResponse.json({ error: "Parking space ID and rating are required" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // Check if parking space exists
    const { data: parkingSpace, error: spaceError } = await db
      .parking_spaces()
      .select("parking_space_id")
      .eq("parking_space_id", parking_space_id)
      .eq("isdeleted", false)
      .single()

    if (spaceError || !parkingSpace) {
      return NextResponse.json({ error: "Parking space not found" }, { status: 404 })
    }

    // Check if user has a completed reservation for this parking space
    const { data: reservation } = await db
      .reservations()
      .select("reservation_id")
      .eq("user_id", authResult.user_id)
      .eq("parking_space_id", parking_space_id)
      .eq("status", "completed")
      .single()

    if (!reservation) {
      return NextResponse.json(
        { error: "You can only provide feedback for parking spaces you have used" },
        { status: 400 },
      )
    }

    // Check if user already provided feedback for this parking space
    const { data: existingFeedback } = await db
      .feedback()
      .select("feedback_id")
      .eq("user_id", authResult.user_id)
      .eq("parking_space_id", parking_space_id)
      .single()

    if (existingFeedback) {
      return NextResponse.json({ error: "You have already provided feedback for this parking space" }, { status: 409 })
    }

    // Create feedback
    const { data: newFeedback, error } = await db
      .feedback()
      .insert({
        user_id: authResult.user_id,
        parking_space_id,
        rating,
        comment,
      })
      .select("*")
      .single()

    if (error) {
      console.error("Feedback creation error:", error)
      return NextResponse.json({ error: "Failed to create feedback" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Feedback submitted successfully",
      data: newFeedback,
    })
  } catch (error) {
    console.error("Feedback creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
