export interface RawTransaction {
  "Transaction Date": string;
  "Clearing Date": string;
  Description: string;
  Merchant: string;
  Category: string;
  Type: string;
  "Amount (USD)": string;
}

export interface Transaction {
  id: string;
  transactionDate: string;
  clearingDate: string;
  description: string;
  merchant: string;
  originalCategory: string;
  category: Category;
  type: string;
  amount: number;
}

export type Category =
  | "Housing"
  | "Food & Drink"
  | "Transport"
  | "Health"
  | "Shopping"
  | "Entertainment"
  | "Income"
  | "Transfer"
  | "Other";

export const CATEGORIES: Category[] = [
  "Housing",
  "Food & Drink",
  "Transport",
  "Health",
  "Shopping",
  "Entertainment",
  "Income",
  "Transfer",
  "Other",
];

export interface CategorySummary {
  category: Category;
  total: number;
  count: number;
}

export interface AnalysisResult {
  transactions: Transaction[];
  insights: string[];
}
