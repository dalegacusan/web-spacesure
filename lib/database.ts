import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

// Create a Supabase client with service role key for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Helper function for raw SQL queries (for compatibility)
export async function query(sql: string, params: any[] = []) {
  try {
    // For complex queries, we can use Supabase's RPC function
    // or use the built-in query methods
    const { data, error } = await supabase.rpc("execute_sql", {
      query: sql,
      params: params,
    })

    if (error) {
      console.error("Database query error:", error)
      throw error
    }

    return {
      rows: data || [],
      rowCount: data?.length || 0,
    }
  } catch (error) {
    console.error("Database connection error:", error)
    throw error
  }
}

// Database table helpers
export const db = {
  users: () => supabase.from("users"),
  vehicles: () => supabase.from("vehicles"),
  parking_spaces: () => supabase.from("parking_spaces"),
  reservations: () => supabase.from("reservations"),
  payments: () => supabase.from("payments"),
  feedback: () => supabase.from("feedback"),
  notifications: () => supabase.from("notifications"),
  admin_log: () => supabase.from("admin_log"),
  parking_space_admins: () => supabase.from("parking_space_admins"),
}

// Helper function to log admin actions
export async function logAdminAction(adminUserId: number, actionType: string, actionDescription: string) {
  try {
    const { error } = await db.admin_log().insert({
      admin_user_id: adminUserId,
      action_type: actionType,
      action_description: actionDescription,
      timestamp: new Date().toISOString(),
    })

    if (error) {
      console.error("Failed to log admin action:", error)
    }
  } catch (error) {
    console.error("Admin logging error:", error)
  }
}
