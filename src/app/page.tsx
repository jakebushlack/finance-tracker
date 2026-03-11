"use client";

import { useState, useCallback } from "react";
import {
  Transaction,
  RawTransaction,
  CategorySummary,
  AnalysisResult,
  CATEGORIES,
  Category,
} from "@/types";

const CATEGORY_COLORS: Record<Category, string> = {
  Housing: "bg-blue-500",
  "Food & Drink": "bg-orange-500",
  Transport: "bg-green-500",
  Health: "bg-red-500",
  Shopping: "bg-purple-500",
  Entertainment: "bg-pink-500",
  Income: "bg-emerald-500",
  Transfer: "bg-gray-500",
  Other: "bg-slate-500",
};

function parseCSV(csvText: string): RawTransaction[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const transactions: RawTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length === headers.length) {
      const transaction: Record<string, string> = {};
      headers.forEach((header, index) => {
        transaction[header] = values[index];
      });
      transactions.push(transaction as unknown as RawTransaction);
    }
  }

  return transactions;
}

function calculateSummary(transactions: Transaction[]): CategorySummary[] {
  const summaryMap = new Map<Category, { total: number; count: number }>();

  CATEGORIES.forEach((cat) => summaryMap.set(cat, { total: 0, count: 0 }));

  transactions.forEach((t) => {
    const existing = summaryMap.get(t.category)!;
    // For expenses (negative amounts), we show as positive spend
    const amount = t.amount < 0 ? Math.abs(t.amount) : -t.amount;
    existing.total += amount;
    existing.count += 1;
  });

  return CATEGORIES.map((category) => ({
    category,
    ...summaryMap.get(category)!,
  })).filter((s) => s.total > 0 || s.count > 0);
}

export default function Home() {
  const [rawTransactions, setRawTransactions] = useState<RawTransaction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      setError(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsed = parseCSV(text);
          if (parsed.length === 0) {
            setError("No valid transactions found in the CSV file.");
            return;
          }
          setRawTransactions(parsed);
          setTransactions([]);
          setInsights([]);
        } catch {
          setError("Failed to parse CSV file. Please check the format.");
        }
      };
      reader.readAsText(file);
    },
    []
  );

  const analyzeTransactions = useCallback(async () => {
    if (rawTransactions.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: rawTransactions }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze transactions");
      }

      const result: AnalysisResult = await response.json();
      setTransactions(result.transactions);
      setInsights(result.insights);
    } catch {
      setError("Failed to analyze transactions. Please check your API key and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [rawTransactions]);

  const summary = calculateSummary(transactions);
  const maxTotal = Math.max(...summary.map((s) => s.total), 1);
  const totalSpend = summary
    .filter((s) => s.category !== "Income")
    .reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Personal Finance Tracker
          </h1>
          <p className="text-gray-600 mt-2">
            Upload your Apple Card CSV to analyze your spending
          </p>
        </header>

        {/* Upload Section */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Upload Transactions
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <label className="flex-1">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="text-gray-600">
                  {fileName ? (
                    <span className="text-green-600 font-medium">{fileName}</span>
                  ) : (
                    <>
                      <span className="font-medium">Click to upload</span> or drag
                      and drop
                      <br />
                      <span className="text-sm text-gray-500">
                        Apple Card CSV format
                      </span>
                    </>
                  )}
                </div>
              </div>
            </label>
            <button
              onClick={analyzeTransactions}
              disabled={rawTransactions.length === 0 || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Analyzing..." : "Analyze with Claude"}
            </button>
          </div>
          {rawTransactions.length > 0 && transactions.length === 0 && (
            <p className="mt-3 text-sm text-gray-600">
              {rawTransactions.length} transactions loaded. Click analyze to
              categorize them.
            </p>
          )}
          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </section>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow p-12 mb-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Claude is analyzing your transactions...
            </p>
          </div>
        )}

        {/* Results */}
        {transactions.length > 0 && !isLoading && (
          <>
            {/* Dashboard Summary */}
            <section className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Spending Dashboard
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">
                    Total Transactions
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {transactions.length}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">
                    Total Spending
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    ${totalSpend.toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium">
                    Categories Used
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {summary.filter((s) => s.count > 0).length}
                  </p>
                </div>
              </div>

              {/* Bar Chart */}
              <h3 className="text-md font-medium text-gray-700 mb-3">
                Spending by Category
              </h3>
              <div className="space-y-3">
                {summary
                  .filter((s) => s.total > 0)
                  .sort((a, b) => b.total - a.total)
                  .map((s) => (
                    <div key={s.category} className="flex items-center gap-3">
                      <div className="w-28 text-sm text-gray-600 truncate">
                        {s.category}
                      </div>
                      <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${CATEGORY_COLORS[s.category]} transition-all duration-500`}
                          style={{ width: `${(s.total / maxTotal) * 100}%` }}
                        />
                      </div>
                      <div className="w-24 text-sm font-medium text-gray-800 text-right">
                        ${s.total.toFixed(2)}
                      </div>
                      <div className="w-16 text-xs text-gray-500 text-right">
                        {s.count} txns
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            {/* Insights */}
            {insights.length > 0 && (
              <section className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  AI Insights
                </h2>
                <div className="space-y-3">
                  {insights.map((insight, index) => (
                    <div
                      key={index}
                      className="flex gap-3 p-4 bg-amber-50 rounded-lg"
                    >
                      <span className="text-amber-500 font-bold">
                        {index + 1}.
                      </span>
                      <p className="text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Transactions Table */}
            <section className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  Transactions
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Merchant
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {t.transactionDate}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                          {t.merchant || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                          {t.description}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full text-white ${CATEGORY_COLORS[t.category]}`}
                          >
                            {t.category}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-medium text-right whitespace-nowrap ${
                            t.amount >= 0 ? "text-green-600" : "text-gray-900"
                          }`}
                        >
                          {t.amount >= 0 ? "+" : ""}${Math.abs(t.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
