import { type NextRequest, NextResponse } from "next/server"
import { db, logAdminAction } from "@/lib/database"
import { requireAuth } from "@/lib/auth-middleware"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const parkingSpaceId = Number.parseInt(params.id)

    const { data: parkingSpace, error } = await db
      .parking_spaces()
      .select("*")
      .eq("parking_space_id", parkingSpaceId)
      .eq("isdeleted", false)
      .single()

    if (error || !parkingSpace) {
      return NextResponse.json({ error: "Parking space not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Parking space fetched successfully",
      data: parkingSpace,
    })
  } catch (error) {
    console.error("Parking space fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth(["admin", "establishment"])(request)
  if (authResult instanceof Response) return authResult

  try {
    const parkingSpaceId = Number.parseInt(params.id)
    const { city, establishment_name, address, total_spaces, hourly_rate, whole_day_rate, availability_status } =
      await request.json()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (city) updateData.city = city
    if (establishment_name) updateData.establishment_name = establishment_name
    if (address) updateData.address = address
    if (total_spaces) {
      updateData.total_spaces = Number.parseInt(total_spaces)
      // Adjust available spaces if total spaces changed
      const { data: currentSpace } = await db
        .parking_spaces()
        .select("total_spaces, available_spaces")
        .eq("parking_space_id", parkingSpaceId)
        .single()
      if (currentSpace) {
        const difference = Number.parseInt(total_spaces) - currentSpace.total_spaces
        updateData.available_spaces = Math.max(0, currentSpace.available_spaces + difference)
      }
    }
    if (hourly_rate) updateData.hourly_rate = Number.parseFloat(hourly_rate)
    if (whole_day_rate) updateData.whole_day_rate = Number.parseFloat(whole_day_rate)
    if (availability_status) updateData.availability_status = availability_status

    const { data: updatedParkingSpace, error } = await db
      .parking_spaces()
      .update(updateData)
      .eq("parking_space_id", parkingSpaceId)
      .select("*")
      .single()

    if (error) {
      console.error("Parking space update error:", error)
      return NextResponse.json({ error: "Failed to update parking space" }, { status: 500 })
    }

    // Log admin action
    await logAdminAction(authResult.user_id, "UPDATE_PARKING_SPACE", `Updated parking space ID: ${parkingSpaceId}`)

    return NextResponse.json({
      message: "Parking space updated successfully",
      data: updatedParkingSpace,
    })
  } catch (error) {
    console.error("Parking space update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth(["admin"])(request)
  if (authResult instanceof Response) return authResult

  try {
    const parkingSpaceId = Number.parseInt(params.id)

    // Check for active reservations
    const { data: activeReservations } = await db
      .reservations()
      .select("reservation_id")
      .eq("parking_space_id", parkingSpaceId)
      .in("status", ["confirmed", "active"])

    if (activeReservations && activeReservations.length > 0) {
      return NextResponse.json({ error: "Cannot delete parking space with active reservations" }, { status: 400 })
    }

    // Soft delete
    const { error } = await db
      .parking_spaces()
      .update({ isdeleted: true, updated_at: new Date().toISOString() })
      .eq("parking_space_id", parkingSpaceId)

    if (error) {
      console.error("Parking space deletion error:", error)
      return NextResponse.json({ error: "Failed to delete parking space" }, { status: 500 })
    }

    // Log admin action
    await logAdminAction(authResult.user_id, "DELETE_PARKING_SPACE", `Deleted parking space ID: ${parkingSpaceId}`)

    return NextResponse.json({
      message: "Parking space deleted successfully",
    })
  } catch (error) {
    console.error("Parking space deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
