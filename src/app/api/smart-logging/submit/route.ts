import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import type {
  SmartLoggingSubmitRequest,
  SmartLoggingSubmitResponse,
} from "@/types/smart-logging";

export const dynamic = "force-dynamic";

type CategoryWithBudgetRow = {
  id: string;
  title: string;
  type: string;
  monthly_budget: string;
  MonthlyBudgets: {
    id: string;
    month: string;
    user_id: string;
  } | null;
};

const getMonthStart = (date: string) => `${date.slice(0, 7)}-01`;

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

  const categoryIds = Array.from(new Set(transactions.map((t) => t.category_id)));
  const { data: categoryRows, error: categoriesError } = await supabase
    .from("Categories")
    .select("id, title, type, monthly_budget, MonthlyBudgets!inner(id, month, user_id)")
    .in("id", categoryIds);

  if (categoriesError) {
    console.error("Failed to load categories for smart logging submit:", categoriesError);
    return NextResponse.json(
      { success: false, error: "Failed to validate categories" } as SmartLoggingSubmitResponse,
      { status: 500 }
    );
  }

  const categories = (categoryRows || []) as unknown as CategoryWithBudgetRow[];
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  if (categoryById.size !== categoryIds.length) {
    return NextResponse.json(
      { success: false, error: "One or more categories could not be found" } as SmartLoggingSubmitResponse,
      { status: 400 }
    );
  }

  const mismatchedTransactions = transactions
    .map((transaction) => {
      const category = categoryById.get(transaction.category_id)!;
      const categoryMonth = category.MonthlyBudgets?.month;
      const transactionMonth = getMonthStart(transaction.transaction_date);

      if (!categoryMonth || categoryMonth === transactionMonth) {
        return null;
      }

      return {
        transaction,
        category,
        transactionMonth,
      };
    })
    .filter(Boolean) as {
      transaction: SmartLoggingSubmitRequest["transactions"][number];
      category: CategoryWithBudgetRow;
      transactionMonth: string;
    }[];

  const resolvedCategoryIds = transactions.map((transaction) => transaction.category_id);

  if (mismatchedTransactions.length > 0) {
    const targetMonths = Array.from(
      new Set(mismatchedTransactions.map(({ transactionMonth }) => transactionMonth))
    );
    const userIds = Array.from(
      new Set(
        mismatchedTransactions
          .map(({ category }) => category.MonthlyBudgets?.user_id)
          .filter((value): value is string => Boolean(value))
      )
    );
    const titles = Array.from(
      new Set(mismatchedTransactions.map(({ category }) => category.title))
    );

    const { data: targetBudgets, error: budgetsError } = await supabase
      .from("MonthlyBudgets")
      .select("id, month, user_id")
      .in("user_id", userIds)
      .in("month", targetMonths);

    if (budgetsError) {
      console.error("Failed to load monthly budgets for smart logging submit:", budgetsError);
      return NextResponse.json(
        { success: false, error: "Failed to validate transaction months" } as SmartLoggingSubmitResponse,
        { status: 500 }
      );
    }

    const budgetByUserMonth = new Map(
      (targetBudgets || []).map((budget) => [`${budget.user_id}:${budget.month}`, budget])
    );
    const targetBudgetIds = (targetBudgets || []).map((budget) => budget.id);

    const { data: targetCategoryRows, error: targetCategoriesError } = targetBudgetIds.length
      ? await supabase
          .from("Categories")
          .select("id, title, type, monthly_budget")
          .in("monthly_budget", targetBudgetIds)
          .in("title", titles)
      : { data: [], error: null };

    if (targetCategoriesError) {
      console.error("Failed to load remapped categories for smart logging submit:", targetCategoriesError);
      return NextResponse.json(
        { success: false, error: "Failed to resolve categories for transaction month" } as SmartLoggingSubmitResponse,
        { status: 500 }
      );
    }

    const targetCategoryByBudgetAndTitle = new Map(
      (targetCategoryRows || []).map((category) => [
        `${category.monthly_budget}:${category.title}:${category.type}`,
        category.id,
      ])
    );

    const unresolvedTransactions = mismatchedTransactions
      .map(({ transaction, category, transactionMonth }) => {
        const userId = category.MonthlyBudgets?.user_id;
        const targetBudget = userId
          ? budgetByUserMonth.get(`${userId}:${transactionMonth}`)
          : undefined;

        if (!targetBudget) {
          return {
            title: transaction.title,
            date: transaction.transaction_date,
            category: category.title,
            reason: `No monthly budget exists for ${transactionMonth}`,
          };
        }

        const replacementCategoryId = targetCategoryByBudgetAndTitle.get(
          `${targetBudget.id}:${category.title}:${category.type}`
        );

        if (!replacementCategoryId) {
          return {
            title: transaction.title,
            date: transaction.transaction_date,
            category: category.title,
            reason: `No matching category exists in the ${transactionMonth} budget`,
          };
        }

        const transactionIndex = transactions.indexOf(transaction);
        resolvedCategoryIds[transactionIndex] = replacementCategoryId;
        return null;
      })
      .filter(Boolean);

    if (unresolvedTransactions.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Some transactions could not be matched to the correct month: ${JSON.stringify(unresolvedTransactions)}`,
        } as SmartLoggingSubmitResponse,
        { status: 400 }
      );
    }
  }

  const transactionsToInsert = transactions.map((t, index) => ({
    title: t.title,
    amount: t.amount,
    category: resolvedCategoryIds[index],
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
