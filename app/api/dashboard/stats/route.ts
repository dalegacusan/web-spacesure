import type { NextRequest } from "next/server"
import { query } from "@/lib/database"
import { requireAuth } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  const authResult = await requireAuth()(request)
  if (authResult instanceof Response) return authResult

  const user = authResult as any

  try {
    let stats: any = {}

    if (user.role === "admin") {
      // Admin dashboard stats
      const [
        totalUsersResult,
        totalParkingSpacesResult,
        totalReservationsResult,
        totalRevenueResult,
        activeReservationsResult,
        pendingReservationsResult,
      ] = await Promise.all([
        query("SELECT COUNT(*) FROM users WHERE account_available_at IS NOT NULL"),
        query("SELECT COUNT(*) FROM parking_spaces WHERE isdeleted = false"),
        query("SELECT COUNT(*) FROM reservations"),
        query("SELECT SUM(amount) FROM payments WHERE payment_status = $1", ["completed"]),
        query("SELECT COUNT(*) FROM reservations WHERE status = $1", ["active"]),
        query("SELECT COUNT(*) FROM reservations WHERE status = $1", ["pending"]),
      ])

      stats = {
        total_users: Number.parseInt(totalUsersResult.rows[0].count),
        total_parking_spaces: Number.parseInt(totalParkingSpacesResult.rows[0].count),
        total_reservations: Number.parseInt(totalReservationsResult.rows[0].count),
        total_revenue: Number.parseFloat(totalRevenueResult.rows[0].sum || 0),
        active_reservations: Number.parseInt(activeReservationsResult.rows[0].count),
        pending_reservations: Number.parseInt(pendingReservationsResult.rows[0].count),
      }
    } else if (user.role === "establishment") {
      // Establishment dashboard stats
      const [myParkingSpacesResult, myReservationsResult, myRevenueResult, myActiveReservationsResult] =
        await Promise.all([
          query(
            `SELECT COUNT(*) FROM parking_spaces ps 
               JOIN parking_space_admins psa ON ps.parking_space_id = psa.parking_space_id 
               WHERE psa.user_id = $1 AND ps.isdeleted = false`,
            [user.user_id],
          ),
          query(
            `SELECT COUNT(*) FROM reservations r 
               JOIN parking_spaces ps ON r.parking_space_id = ps.parking_space_id
               JOIN parking_space_admins psa ON ps.parking_space_id = psa.parking_space_id 
               WHERE psa.user_id = $1`,
            [user.user_id],
          ),
          query(
            `SELECT SUM(p.amount) FROM payments p
               JOIN reservations r ON p.reservation_id = r.reservation_id
               JOIN parking_spaces ps ON r.parking_space_id = ps.parking_space_id
               JOIN parking_space_admins psa ON ps.parking_space_id = psa.parking_space_id 
               WHERE psa.user_id = $1 AND p.payment_status = $2`,
            [user.user_id, "completed"],
          ),
          query(
            `SELECT COUNT(*) FROM reservations r 
               JOIN parking_spaces ps ON r.parking_space_id = ps.parking_space_id
               JOIN parking_space_admins psa ON ps.parking_space_id = psa.parking_space_id 
               WHERE psa.user_id = $1 AND r.status = $2`,
            [user.user_id, "active"],
          ),
        ])

      stats = {
        my_parking_spaces: Number.parseInt(myParkingSpacesResult.rows[0].count),
        my_reservations: Number.parseInt(myReservationsResult.rows[0].count),
        my_revenue: Number.parseFloat(myRevenueResult.rows[0].sum || 0),
        my_active_reservations: Number.parseInt(myActiveReservationsResult.rows[0].count),
      }
    } else {
      // Driver dashboard stats
      const [myVehiclesResult, myReservationsResult, myTotalSpentResult, myActiveReservationsResult] =
        await Promise.all([
          query("SELECT COUNT(*) FROM vehicles WHERE user_id = $1", [user.user_id]),
          query("SELECT COUNT(*) FROM reservations WHERE user_id = $1", [user.user_id]),
          query(
            `SELECT SUM(p.amount) FROM payments p
               JOIN reservations r ON p.reservation_id = r.reservation_id
               WHERE r.user_id = $1 AND p.payment_status = $2`,
            [user.user_id, "completed"],
          ),
          query("SELECT COUNT(*) FROM reservations WHERE user_id = $1 AND status = $2", [user.user_id, "active"]),
        ])

      stats = {
        my_vehicles: Number.parseInt(myVehiclesResult.rows[0].count),
        my_reservations: Number.parseInt(myReservationsResult.rows[0].count),
        my_total_spent: Number.parseFloat(myTotalSpentResult.rows[0].sum || 0),
        my_active_reservations: Number.parseInt(myActiveReservationsResult.rows[0].count),
      }
    }

    return Response.json({ stats })
  } catch (error) {
    console.error("Get dashboard stats error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
