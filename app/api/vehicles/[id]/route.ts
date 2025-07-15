import type { NextRequest } from "next/server"
import { requireAuth } from "@/lib/auth-middleware"
import { db } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth()(request)
  if (authResult instanceof Response) return authResult

  try {
    const vehicleId = Number.parseInt(params.id)

    const { data: vehicle, error } = await db.vehicles().select("*").eq("vehicle_id", vehicleId).single()

    if (error || !vehicle) {
      return Response.json({ error: "Vehicle not found" }, { status: 404 })
    }

    // Users can only view their own vehicles unless they're admin
    if (authResult.role !== "admin" && vehicle.user_id !== authResult.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    return Response.json({
      message: "Vehicle fetched successfully",
      data: { vehicle },
    })
  } catch (error) {
    console.error("Vehicle fetch error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth()(request)
  if (authResult instanceof Response) return authResult

  try {
    const vehicleId = Number.parseInt(params.id)
    const { vehicleType, yearMakeModel, color, plateNumber } = await request.json()

    // Get existing vehicle to check ownership
    const { data: existingVehicle, error: fetchError } = await db
      .vehicles()
      .select("*")
      .eq("vehicle_id", vehicleId)
      .single()

    if (fetchError || !existingVehicle) {
      return Response.json({ error: "Vehicle not found" }, { status: 404 })
    }

    // Users can only update their own vehicles unless they're admin
    if (authResult.role !== "admin" && existingVehicle.user_id !== authResult.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    // Validation
    if (!vehicleType || !yearMakeModel || !color || !plateNumber) {
      return Response.json({ error: "All vehicle fields are required" }, { status: 400 })
    }

    // Check if plate number already exists (excluding current vehicle)
    const { data: plateCheck } = await db
      .vehicles()
      .select("vehicle_id")
      .eq("plate_number", plateNumber.toUpperCase())
      .neq("vehicle_id", vehicleId)
      .single()

    if (plateCheck) {
      return Response.json({ error: "Vehicle with this plate number already exists" }, { status: 409 })
    }

    const { data: updatedVehicle, error } = await db
      .vehicles()
      .update({
        vehicle_type: vehicleType,
        year_make_model: yearMakeModel,
        color: color,
        plate_number: plateNumber.toUpperCase(),
        updated_at: new Date().toISOString(),
      })
      .eq("vehicle_id", vehicleId)
      .select("*")
      .single()

    if (error) {
      console.error("Vehicle update error:", error)
      return Response.json({ error: "Failed to update vehicle" }, { status: 500 })
    }

    return Response.json({
      message: "Vehicle updated successfully",
      data: { vehicle: updatedVehicle },
    })
  } catch (error) {
    console.error("Vehicle update error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth()(request)
  if (authResult instanceof Response) return authResult

  try {
    const vehicleId = Number.parseInt(params.id)

    // Get existing vehicle to check ownership
    const { data: existingVehicle, error: fetchError } = await db
      .vehicles()
      .select("*")
      .eq("vehicle_id", vehicleId)
      .single()

    if (fetchError || !existingVehicle) {
      return Response.json({ error: "Vehicle not found" }, { status: 404 })
    }

    // Users can only delete their own vehicles unless they're admin
    if (authResult.role !== "admin" && existingVehicle.user_id !== authResult.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const { error } = await db.vehicles().delete().eq("vehicle_id", vehicleId)

    if (error) {
      console.error("Vehicle deletion error:", error)
      return Response.json({ error: "Failed to delete vehicle" }, { status: 500 })
    }

    return Response.json({
      message: "Vehicle deleted successfully",
    })
  } catch (error) {
    console.error("Vehicle deletion error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
