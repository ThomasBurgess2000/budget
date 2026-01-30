import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import type {
  SmartLoggingSubmitRequest,
  SmartLoggingSubmitResponse,
} from "@/types/smart-logging";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" } as SmartLoggingSubmitResponse,
      { status: 401 }
    );
  }

  let body: SmartLoggingSubmitRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" } as SmartLoggingSubmitResponse,
      { status: 400 }
    );
  }

  const { transactions } = body;

  if (!transactions || transactions.length === 0) {
    return NextResponse.json(
      { success: false, error: "No transactions provided" } as SmartLoggingSubmitResponse,
      { status: 400 }
    );
  }

  // Transform transactions to match Supabase schema
  const transactionsToInsert = transactions.map((t) => ({
    title: t.title,
    amount: t.amount,
    category: t.category_id,
    created_at: t.transaction_date,
    description: t.description || "",
  }));

  const { error: insertError } = await supabase
    .from("Transactions")
    .insert(transactionsToInsert);

  if (insertError) {
    console.error("Failed to create transactions:", insertError);
    return NextResponse.json(
      { success: false, error: "Failed to create transactions" } as SmartLoggingSubmitResponse,
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true } as SmartLoggingSubmitResponse);
}
