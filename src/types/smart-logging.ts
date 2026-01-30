export interface SuggestedTransaction {
  id: string;
  title: string;
  amount: number;
  category_id: string;
  category_name: string;
  transaction_date: string;
  description?: string;
  confidence: "high" | "medium" | "low";
  status: "pending" | "approved" | "rejected";
}

export interface SmartLoggingRequest {
  images: string[]; // base64 encoded images
  monthly_budget_id: string;
}

export interface SmartLoggingResponse {
  suggestions: SuggestedTransaction[];
  error?: string;
}

export interface SmartLoggingSubmitRequest {
  transactions: {
    title: string;
    amount: number;
    category_id: string;
    transaction_date: string;
    description?: string;
  }[];
}

export interface SmartLoggingSubmitResponse {
  success: boolean;
  error?: string;
}

export interface Category {
  id: string;
  title: string;
  budgeted: number;
  monthly_budget: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  created_at: string;
  description?: string;
}
