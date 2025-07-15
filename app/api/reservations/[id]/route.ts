import { type NextRequest, NextResponse } from "next/server"
import { db, logAdminAction } from "@/lib/database"
import { requireAuth } from "@/lib/auth-middleware"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth()(request)
  if (authResult instanceof Response) return authResult

  try {
    const reservationId = Number.parseInt(params.id)

    let query = db
      .reservations()
      .select(`
        *,
        users!inner(first_name, last_name, email),
        parking_spaces!inner(establishment_name, city, address),
        vehicles!inner(vehicle_type, year_make_model, plate_number)
      `)
      .eq("reservation_id", reservationId)

    // Non-admin users can only see their own reservations
    if (authResult.role !== "admin") {
      query = query.eq("user_id", authResult.user_id)
    }

    const { data: reservation, error } = await query.single()

    if (error || !reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Reservation fetched successfully",
      data: reservation,
    })
  } catch (error) {
    console.error("Reservation fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth()(request)
  if (authResult instanceof Response) return authResult

  try {
    const reservationId = Number.parseInt(params.id)
    const { status, start_time, end_time } = await request.json()

    // Get current reservation
    const { data: currentReservation, error: fetchError } = await db
      .reservations()
      .select("*")
      .eq("reservation_id", reservationId)
      .single()

    if (fetchError || !currentReservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    // Check permissions
    if (authResult.role !== "admin" && currentReservation.user_id !== authResult.user_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (status) {
      updateData.status = status

      // If cancelling, free up the parking space
      if (status === "cancelled" && currentReservation.status !== "cancelled") {
        const { data: parkingSpace } = await db
          .parking_spaces()
          .select("available_spaces")
          .eq("parking_space_id", currentReservation.parking_space_id)
          .single()

        if (parkingSpace) {
          await db
            .parking_spaces()
            .update({ available_spaces: parkingSpace.available_spaces + 1 })
            .eq("parking_space_id", currentReservation.parking_space_id)
        }
      }
    }

    if (start_time) updateData.start_time = start_time
    if (end_time) updateData.end_time = end_time

    const { data: updatedReservation, error } = await db
      .reservations()
      .update(updateData)
      .eq("reservation_id", reservationId)
      .select("*")
      .single()

    if (error) {
      console.error("Reservation update error:", error)
      return NextResponse.json({ error: "Failed to update reservation" }, { status: 500 })
    }

    // Log admin action if admin updated the reservation
    if (authResult.role === "admin" && authResult.user_id !== currentReservation.user_id) {
      await logAdminAction(authResult.user_id, "UPDATE_RESERVATION", `Updated reservation ID: ${reservationId}`)
    }

    return NextResponse.json({
      message: "Reservation updated successfully",
      data: updatedReservation,
    })
  } catch (error) {
    console.error("Reservation update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireAuth()(request)
  if (authResult instanceof Response) return authResult

  try {
    const reservationId = Number.parseInt(params.id)

    // Get current reservation
    const { data: currentReservation, error: fetchError } = await db
      .reservations()
      .select("*")
      .eq("reservation_id", reservationId)
      .single()

    if (fetchError || !currentReservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    // Check permissions
    if (authResult.role !== "admin" && currentReservation.user_id !== authResult.user_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Only allow deletion of pending reservations
    if (currentReservation.status !== "pending") {
      return NextResponse.json({ error: "Can only delete pending reservations" }, { status: 400 })
    }

    const { error } = await db.reservations().delete().eq("reservation_id", reservationId)

    if (error) {
      console.error("Reservation deletion error:", error)
      return NextResponse.json({ error: "Failed to delete reservation" }, { status: 500 })
    }

    // Free up the parking space
    const { data: parkingSpace } = await db
      .parking_spaces()
      .select("available_spaces")
      .eq("parking_space_id", currentReservation.parking_space_id)
      .single()

    if (parkingSpace) {
      await db
        .parking_spaces()
        .update({ available_spaces: parkingSpace.available_spaces + 1 })
        .eq("parking_space_id", currentReservation.parking_space_id)
    }

    // Log admin action if admin deleted the reservation
    if (authResult.role === "admin" && authResult.user_id !== currentReservation.user_id) {
      await logAdminAction(authResult.user_id, "DELETE_RESERVATION", `Deleted reservation ID: ${reservationId}`)
    }

    return NextResponse.json({
      message: "Reservation deleted successfully",
    })
  } catch (error) {
    console.error("Reservation deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
