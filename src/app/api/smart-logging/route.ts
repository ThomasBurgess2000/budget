import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GoogleGenerativeAI, SchemaType, type FunctionDeclarationsTool, type FunctionResponsePart } from "@google/generative-ai";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import type {
  SmartLoggingRequest,
  SmartLoggingResponse,
  SuggestedTransaction,
  Category,
  Transaction,
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
      { error: "Unauthorized" } as SmartLoggingResponse,
      { status: 401 }
    );
  }

  let body: SmartLoggingRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" } as SmartLoggingResponse,
      { status: 400 }
    );
  }

  const { images, monthly_budget_id } = body;

  if (!images || images.length === 0) {
    return NextResponse.json(
      { error: "No images provided" } as SmartLoggingResponse,
      { status: 400 }
    );
  }

  if (!monthly_budget_id) {
    return NextResponse.json(
      { error: "Monthly budget ID is required" } as SmartLoggingResponse,
      { status: 400 }
    );
  }

  // Fetch categories from Supabase
  const { data: categoriesData, error: categoriesError } = await supabase
    .from("Categories")
    .select("id, title, amount_budgeted")
    .eq("monthly_budget", monthly_budget_id);

  if (categoriesError) {
    console.error("Failed to fetch categories:", categoriesError);
    return NextResponse.json(
      { error: "Failed to fetch categories" } as SmartLoggingResponse,
      { status: 500 }
    );
  }

  const categories: Category[] = (categoriesData || []).map((c) => ({
    id: String(c.id),
    title: c.title,
    budgeted: c.amount_budgeted,
    monthly_budget: monthly_budget_id,
  }));

  // Fetch transactions for these categories
  const categoryIds = categories.map((c) => c.id);
  let transactions: Transaction[] = [];

  if (categoryIds.length > 0) {
    const { data: transactionsData, error: transactionsError } = await supabase
      .from("Transactions")
      .select("id, title, amount, category, created_at, description")
      .in("category", categoryIds);

    if (transactionsError) {
      console.error("Failed to fetch transactions:", transactionsError);
      return NextResponse.json(
        { error: "Failed to fetch transactions" } as SmartLoggingResponse,
        { status: 500 }
      );
    }

    transactions = (transactionsData || []).map((t) => ({
      id: String(t.id),
      title: t.title,
      amount: t.amount,
      category: String(t.category),
      created_at: t.created_at,
      description: t.description,
    }));
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured" } as SmartLoggingResponse,
      { status: 500 }
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const tools: FunctionDeclarationsTool[] = [
    {
      functionDeclarations: [
        {
          name: "get_categories_for_month",
          description:
            "Get the list of budget categories for the current month. Use this to understand what categories are available for categorizing transactions.",
        },
        {
          name: "get_transactions_for_month",
          description:
            "Get the list of existing transactions for the current month. Use this to avoid suggesting duplicate transactions.",
        },
        {
          name: "suggest_transactions",
          description:
            "Submit the final list of suggested transactions extracted from the receipt images. Call this after analyzing the images and determining the appropriate categories.",
          parameters: {
            type: SchemaType.OBJECT,
            properties: {
              transactions: {
                type: SchemaType.ARRAY,
                description: "List of suggested transactions",
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    title: {
                      type: SchemaType.STRING,
                      description: "Title/description of the transaction (e.g., store name or item)",
                    },
                    amount: {
                      type: SchemaType.NUMBER,
                      description: "Transaction amount as a positive number",
                    },
                    category_id: {
                      type: SchemaType.STRING,
                      description: "ID of the category this transaction belongs to (use the exact id string from the categories list)",
                    },
                    category_name: {
                      type: SchemaType.STRING,
                      description: "Name of the category for display purposes",
                    },
                    transaction_date: {
                      type: SchemaType.STRING,
                      description: "Date of the transaction in YYYY-MM-DD format",
                    },
                    description: {
                      type: SchemaType.STRING,
                      description: "Optional additional details about the transaction",
                    },
                    confidence: {
                      type: SchemaType.STRING,
                      description: "Confidence level of the suggestion: high, medium, or low",
                    },
                  },
                  required: ["title", "amount", "category_id", "category_name", "transaction_date", "confidence"],
                },
              },
            },
            required: ["transactions"],
          },
        },
      ],
    },
  ];

  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    tools,
  });

  // Prepare image parts for the request
  const imageParts = images.map((base64Image) => {
    // Handle data URLs or raw base64
    const base64Data = base64Image.includes(",")
      ? base64Image.split(",")[1]
      : base64Image;
    const mimeType = base64Image.includes("data:")
      ? base64Image.split(";")[0].split(":")[1]
      : "image/jpeg";

    return {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    };
  });

  const systemPrompt = `You are a helpful assistant that analyzes receipt images and extracts transaction information.

Your task:
1. First, call get_categories_for_month to see what budget categories are available
2. Then, call get_transactions_for_month to see existing transactions and avoid duplicates
3. Analyze the receipt images to extract transaction details
4. Match each transaction to the most appropriate category
5. Finally, call suggest_transactions with your suggestions

Guidelines:
- Extract the store/merchant name as the title
- Use the total amount from the receipt
- Parse the date from the receipt, or use today's date if not visible
- Choose the most appropriate category based on the merchant type and items purchased
- Set confidence to "high" if the receipt is clear and category match is obvious, "medium" if somewhat uncertain, "low" if guessing
- Do NOT suggest transactions that already exist (check amounts and dates for duplicates)`;

  try {
    const chat = model.startChat({
      history: [],
    });

    let result = await chat.sendMessage([
      { text: systemPrompt },
      ...imageParts,
      { text: "Please analyze these receipt images and suggest transactions to log." },
    ]);

    let response = result.response;
    let suggestions: SuggestedTransaction[] = [];
    let maxIterations = 10;
    let iteration = 0;

    // Tool call loop
    while (iteration < maxIterations) {
      iteration++;
      const functionCalls = response.functionCalls();

      if (!functionCalls || functionCalls.length === 0) {
        break;
      }

      const functionResponses: FunctionResponsePart[] = [];

      for (const call of functionCalls) {
        let responseData: object;

        switch (call.name) {
          case "get_categories_for_month":
            responseData = {
              categories: categories.map((c) => ({
                id: c.id,
                title: c.title,
                budgeted: c.budgeted,
              })),
            };
            break;

          case "get_transactions_for_month":
            responseData = {
              transactions: transactions.map((t) => ({
                id: t.id,
                title: t.title,
                amount: t.amount,
                date: t.created_at,
              })),
            };
            break;

          case "suggest_transactions":
            const args = call.args as { transactions: Array<{
              title: string;
              amount: number;
              category_id: string;
              category_name: string;
              transaction_date: string;
              description?: string;
              confidence: string;
            }> };
            suggestions = (args.transactions || []).map(
              (t, index) => ({
                id: `suggestion-${index}-${Date.now()}`,
                title: t.title,
                amount: t.amount,
                category_id: String(t.category_id),
                category_name: t.category_name,
                transaction_date: t.transaction_date,
                description: t.description,
                confidence: (t.confidence as "high" | "medium" | "low") || "medium",
                status: "pending" as const,
              })
            );
            responseData = { success: true, message: "Suggestions recorded" };
            break;

          default:
            responseData = { error: "Unknown function" };
        }

        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: responseData,
          },
        });
      }

      // If we got suggestions, we're done
      if (suggestions.length > 0) {
        break;
      }

      // Send function responses back to continue the conversation
      result = await chat.sendMessage(functionResponses);
      response = result.response;
    }

    return NextResponse.json({
      suggestions,
    } as SmartLoggingResponse);
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to analyze images" } as SmartLoggingResponse,
      { status: 500 }
    );
  }
}
