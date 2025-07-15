import { type NextRequest, NextResponse } from "next/server"
import { db, logAdminAction } from "@/lib/database"
import { requireAuth } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get("city")
    const establishment = searchParams.get("establishment")
    const available_only = searchParams.get("available_only") === "true"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const offset = (page - 1) * limit

    let query = db.parking_spaces().select("*", { count: "exact" }).eq("isdeleted", false)

    // Apply filters
    if (city) {
      query = query.ilike("city", `%${city}%`)
    }

    if (establishment) {
      query = query.ilike("establishment_name", `%${establishment}%`)
    }

    if (available_only) {
      query = query.eq("availability_status", "available").gt("available_spaces", 0)
    }

    const {
      data: parkingSpaces,
      error,
      count,
    } = await query.range(offset, offset + limit - 1).order("created_at", { ascending: false })

    if (error) {
      console.error("Parking spaces fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch parking spaces" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Parking spaces fetched successfully",
      data: parkingSpaces,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Parking spaces API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(["admin", "establishment"])(request)
  if (authResult instanceof Response) return authResult

  try {
    const {
      city,
      establishment_name,
      address,
      total_spaces,
      hourly_rate,
      whole_day_rate,
      availability_status = "available",
    } = await request.json()

    if (!city || !establishment_name || !address || !total_spaces || !hourly_rate || !whole_day_rate) {
      return NextResponse.json({ error: "All required fields must be provided" }, { status: 400 })
    }

    if (total_spaces <= 0 || hourly_rate <= 0 || whole_day_rate <= 0) {
      return NextResponse.json({ error: "Spaces and rates must be positive numbers" }, { status: 400 })
    }

    const { data: newParkingSpace, error } = await db
      .parking_spaces()
      .insert({
        city,
        establishment_name,
        address,
        total_spaces: Number.parseInt(total_spaces),
        available_spaces: Number.parseInt(total_spaces),
        hourly_rate: Number.parseFloat(hourly_rate),
        whole_day_rate: Number.parseFloat(whole_day_rate),
        availability_status,
      })
      .select("*")
      .single()

    if (error) {
      console.error("Parking space creation error:", error)
      return NextResponse.json({ error: "Failed to create parking space" }, { status: 500 })
    }

    // Log admin action
    await logAdminAction(authResult.user_id, "CREATE_PARKING_SPACE", `Created parking space: ${establishment_name}`)

    return NextResponse.json({
      message: "Parking space created successfully",
      data: newParkingSpace,
    })
  } catch (error) {
    console.error("Parking space creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
