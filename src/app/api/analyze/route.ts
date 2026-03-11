import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { RawTransaction, Transaction, Category, CATEGORIES } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { transactions }: { transactions: RawTransaction[] } =
      await request.json();

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: "Invalid transactions data" },
        { status: 400 }
      );
    }

    // Prepare transactions for categorization
    const transactionSummaries = transactions.map((t, index) => ({
      index,
      merchant: t.Merchant,
      description: t.Description,
      originalCategory: t.Category,
      amount: t["Amount (USD)"],
      type: t.Type,
    }));

    // Call Claude to categorize transactions
    const categorizationResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are a financial transaction categorizer. Analyze these transactions and assign each one to exactly one of these categories: ${CATEGORIES.join(", ")}.

Here are the transactions to categorize:
${JSON.stringify(transactionSummaries, null, 2)}

Respond with ONLY a JSON array where each element has "index" (the transaction index) and "category" (one of the allowed categories). No other text.

Example response format:
[{"index": 0, "category": "Food & Drink"}, {"index": 1, "category": "Transport"}]`,
        },
      ],
    });

    // Parse categorization response
    const categorizationText =
      categorizationResponse.content[0].type === "text"
        ? categorizationResponse.content[0].text
        : "";

    let categorizations: { index: number; category: Category }[] = [];
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = categorizationText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        categorizations = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error("Failed to parse categorization response");
    }

    // Build categorized transactions
    const categorizedTransactions: Transaction[] = transactions.map(
      (t, index) => {
        const categorization = categorizations.find((c) => c.index === index);
        const category: Category =
          categorization?.category &&
          CATEGORIES.includes(categorization.category)
            ? categorization.category
            : "Other";

        return {
          id: `txn-${index}-${Date.now()}`,
          transactionDate: t["Transaction Date"],
          clearingDate: t["Clearing Date"],
          description: t.Description,
          merchant: t.Merchant,
          originalCategory: t.Category,
          category,
          type: t.Type,
          amount: parseFloat(t["Amount (USD)"].replace(/[^-\d.]/g, "")) || 0,
        };
      }
    );

    // Calculate spending by category for insights
    const spendingByCategory = categorizedTransactions.reduce(
      (acc, t) => {
        if (t.amount < 0) {
          // Negative amounts are expenses in Apple Card format
          acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
        }
        return acc;
      },
      {} as Record<Category, number>
    );

    const totalSpending = Object.values(spendingByCategory).reduce(
      (a, b) => a + b,
      0
    );

    // Generate insights with Claude
    const insightsResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze this spending data and provide exactly 3 brief, plain-English insights about the spending patterns. Be specific and actionable.

Spending by category:
${Object.entries(spendingByCategory)
  .map(([cat, amount]) => `- ${cat}: $${amount.toFixed(2)}`)
  .join("\n")}

Total spending: $${totalSpending.toFixed(2)}
Number of transactions: ${categorizedTransactions.length}

Respond with ONLY a JSON array of 3 strings, each being one insight. No other text.
Example: ["Insight 1", "Insight 2", "Insight 3"]`,
        },
      ],
    });

    const insightsText =
      insightsResponse.content[0].type === "text"
        ? insightsResponse.content[0].text
        : "";

    let insights: string[] = [];
    try {
      const jsonMatch = insightsText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      }
    } catch {
      insights = [
        "Unable to generate insights. Please try again.",
      ];
    }

    return NextResponse.json({
      transactions: categorizedTransactions,
      insights,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze transactions" },
      { status: 500 }
    );
  }
}
