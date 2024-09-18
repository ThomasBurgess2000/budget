import { updateSession } from "@/utils/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Handle session update
  const sessionResult = await updateSession(request);

  // Handle /current-budget redirection
  if (request.nextUrl.pathname === "/current-budget") {
    const response = await fetch(new URL("/api/current-budget", request.url), {
      headers: {
        // Forward the cookies to the API route
        Cookie: request.headers.get("cookie") || "",
      },
    });
    const data = await response.json();

    if (data.budgetId) {
      return NextResponse.redirect(
        new URL(`/monthly-budgets/show/${data.budgetId}`, request.url)
      );
    } else {
      return NextResponse.redirect(new URL("/monthly-budgets", request.url));
    }
  }

  return sessionResult;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/current-budget",
  ],
};
