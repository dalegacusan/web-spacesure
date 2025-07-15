import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a Supabase client for client-side operations
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Helper function to get the current user session
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser()

  if (error) {
    console.error("Error getting current user:", error)
    return null
  }

  return user
}

// Helper function to sign out
export async function signOut() {
  const { error } = await supabaseClient.auth.signOut()
  if (error) {
    console.error("Error signing out:", error)
  }
  return error
}
