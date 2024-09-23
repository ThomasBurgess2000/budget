import { updateSession } from "@/utils/supabase/middleware";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Handle session update
  const sessionResult = await updateSession(request);

  // Handle /current-budget redirection
  if (request.nextUrl.pathname === "/current-budget") {
    // Use an environment variable for the internal API base URL
    const internalApiBaseUrl = process.env.INTERNAL_API_BASE_URL || "http://localhost:3000";
    const internalURL = `${internalApiBaseUrl}/api/current-budget`;

    try {
      const response = await fetch(internalURL, {
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
      });

      if (!response.ok) {
        throw new Error(`API response not ok: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.budgetId) {
        return NextResponse.redirect(
          new URL(`/monthly-budgets/show/${data.budgetId}`, request.url)
        );
      } else {
        return NextResponse.redirect(new URL("/monthly-budgets", request.url));
      }
    } catch (error) {
      console.error("Middleware fetch error:", error);
      return NextResponse.redirect(new URL("/error", request.url));
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
