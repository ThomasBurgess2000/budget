import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import dayjs from "dayjs";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

// Add this line to make the route dynamic
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Initialize Supabase client with Auth Helpers
  const supabase = createRouteHandlerClient({ cookies });

  // Get the authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ budgetId: null }, { status: 401 });
  }

  // Get the current month
  const currentMonth = dayjs().startOf("month").format("YYYY-MM-DD");

  // Query the MonthlyBudgets table for the current month and user
  const { data: monthlyBudget, error } = await supabase
    .from("MonthlyBudgets")
    .select("id")
    .eq("month", currentMonth)
    .eq("user_id", user.id) // Ensure we're querying for the authenticated user
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching current month budget:", error);
    return NextResponse.json({ budgetId: null });
  }

  return NextResponse.json({ budgetId: monthlyBudget?.id || null });
}
