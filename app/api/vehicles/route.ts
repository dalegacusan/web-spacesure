import type { NextRequest } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  const authResult = await requireAuth()(request)
  if (authResult instanceof Response) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    let query = db.vehicles().select("*")

    // If not admin, only show user's own vehicles
    if (authResult.role !== "admin") {
      query = query.eq("user_id", authResult.id)
    } else if (userId) {
      query = query.eq("user_id", Number.parseInt(userId))
    }

    const { data: vehicles, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Vehicles fetch error:", error)
      return Response.json({ error: "Failed to fetch vehicles" }, { status: 500 })
    }

    return Response.json({
      message: "Vehicles fetched successfully",
      data: vehicles,
    })
  } catch (error) {
    console.error("Vehicles API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth()(request)
  if (authResult instanceof Response) return authResult

  try {
    const { vehicleType, yearMakeModel, color, plateNumber, userId } = await request.json()

    // Validation
    if (!vehicleType || !yearMakeModel || !color || !plateNumber) {
      return Response.json({ error: "All vehicle fields are required" }, { status: 400 })
    }

    // Determine the user ID (admin can create for others, users create for themselves)
    const targetUserId = authResult.role === "admin" && userId ? Number.parseInt(userId) : authResult.id

    // Check if plate number already exists
    const { data: existingVehicle } = await db
      .vehicles()
      .select("plate_number")
      .eq("plate_number", plateNumber.toUpperCase())
      .single()

    if (existingVehicle) {
      return Response.json({ error: "Vehicle with this plate number already exists" }, { status: 409 })
    }

    const { data: newVehicle, error } = await db
      .vehicles()
      .insert({
        user_id: targetUserId,
        vehicle_type: vehicleType,
        year_make_model: yearMakeModel,
        color: color,
        plate_number: plateNumber.toUpperCase(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single()

    if (error) {
      console.error("Vehicle creation error:", error)
      return Response.json({ error: "Failed to create vehicle" }, { status: 500 })
    }

    return Response.json({
      message: "Vehicle created successfully",
      data: { vehicle: newVehicle },
    })
  } catch (error) {
    console.error("Vehicle creation error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
