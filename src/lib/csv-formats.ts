/**
 * CSV Format Registry
 *
 * Defines parsers for different financial institution CSV exports.
 * To add a new format:
 * 1. Add a new FormatDefinition to CSV_FORMATS
 * 2. Define the expected headers and column mapping
 * 3. The format will be auto-detected on upload
 */

import { RawTransaction } from "@/types";

export interface FormatDefinition {
  id: string;
  name: string;
  /** Headers that must be present (case-insensitive) */
  requiredHeaders: string[];
  /** Map from our standard fields to the institution's column names */
  columnMap: {
    transactionDate: string;
    clearingDate?: string;
    description: string;
    merchant?: string;
    category?: string;
    type?: string;
    amount: string;
  };
  /** Optional: transform amount string to number (default removes $ and parses) */
  parseAmount?: (value: string, row?: Record<string, string>) => number;
  /** Optional: transform date string (default passes through) */
  parseDate?: (value: string) => string;
}

export const CSV_FORMATS: FormatDefinition[] = [
  {
    id: "apple-card",
    name: "Apple Card",
    requiredHeaders: [
      "Transaction Date",
      "Clearing Date",
      "Description",
      "Merchant",
      "Category",
      "Type",
      "Amount (USD)",
    ],
    columnMap: {
      transactionDate: "Transaction Date",
      clearingDate: "Clearing Date",
      description: "Description",
      merchant: "Merchant",
      category: "Category",
      type: "Type",
      amount: "Amount (USD)",
    },
  },
  {
    id: "chase",
    name: "Chase",
    requiredHeaders: ["Transaction Date", "Post Date", "Description", "Category", "Type", "Amount"],
    columnMap: {
      transactionDate: "Transaction Date",
      clearingDate: "Post Date",
      description: "Description",
      category: "Category",
      type: "Type",
      amount: "Amount",
    },
  },
  {
    id: "amex",
    name: "American Express",
    requiredHeaders: ["Date", "Description", "Amount"],
    columnMap: {
      transactionDate: "Date",
      description: "Description",
      amount: "Amount",
    },
    // Amex shows expenses as positive, so we negate
    parseAmount: (value: string, _row?: Record<string, string>) => {
      const num = parseFloat(value.replace(/[^-\d.]/g, "")) || 0;
      return -num;
    },
  },
  {
    id: "capital-one",
    name: "Capital One",
    requiredHeaders: ["Transaction Date", "Posted Date", "Card No.", "Description", "Category", "Debit", "Credit"],
    columnMap: {
      transactionDate: "Transaction Date",
      clearingDate: "Posted Date",
      description: "Description",
      category: "Category",
      amount: "Debit", // We'll handle Credit separately in parseAmount
    },
    parseAmount: (value: string, row?: Record<string, string>) => {
      const debit = parseFloat(value?.replace(/[^-\d.]/g, "") || "0") || 0;
      const credit = parseFloat(row?.["Credit"]?.replace(/[^-\d.]/g, "") || "0") || 0;
      // Debit is expense (negative), Credit is income (positive)
      return credit > 0 ? credit : -debit;
    },
  },
];

/**
 * Detect CSV format by checking headers
 */
export function detectFormat(headers: string[]): FormatDefinition | null {
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());

  for (const format of CSV_FORMATS) {
    const requiredNormalized = format.requiredHeaders.map((h) => h.toLowerCase());
    const allPresent = requiredNormalized.every((required) =>
      normalizedHeaders.includes(required)
    );
    if (allPresent) {
      return format;
    }
  }

  return null;
}

/**
 * Get column value by name (case-insensitive)
 */
function getColumn(row: Record<string, string>, columnName: string): string {
  const normalizedName = columnName.toLowerCase();
  for (const [key, value] of Object.entries(row)) {
    if (key.toLowerCase() === normalizedName) {
      return value;
    }
  }
  return "";
}

/**
 * Parse a single row using the format definition
 */
export function parseRow(
  row: Record<string, string>,
  format: FormatDefinition
): RawTransaction {
  const { columnMap, parseAmount, parseDate } = format;

  const rawAmount = getColumn(row, columnMap.amount);
  let amount: string;

  if (parseAmount) {
    // Custom amount parser (may need full row for multi-column amounts)
    amount = parseAmount(rawAmount, row).toString();
  } else {
    // Default: strip currency symbols and parse
    amount = rawAmount;
  }

  const transactionDate = getColumn(row, columnMap.transactionDate);

  return {
    "Transaction Date": parseDate ? parseDate(transactionDate) : transactionDate,
    "Clearing Date": columnMap.clearingDate
      ? getColumn(row, columnMap.clearingDate)
      : transactionDate,
    Description: getColumn(row, columnMap.description),
    Merchant: columnMap.merchant ? getColumn(row, columnMap.merchant) : "",
    Category: columnMap.category ? getColumn(row, columnMap.category) : "",
    Type: columnMap.type ? getColumn(row, columnMap.type) : "Purchase",
    "Amount (USD)": amount,
  };
}

/**
 * Parse CSV text with format auto-detection
 */
export interface ParseResult {
  success: boolean;
  transactions: RawTransaction[];
  format: FormatDefinition | null;
  error?: string;
}

export function parseCSVWithFormat(csvText: string): ParseResult {
  const lines = csvText.trim().split("\n");

  if (lines.length < 2) {
    return {
      success: false,
      transactions: [],
      format: null,
      error: "CSV file is empty or has no data rows",
    };
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  // Detect format
  const format = detectFormat(headers);

  if (!format) {
    const supportedFormats = CSV_FORMATS.map((f) => f.name).join(", ");
    return {
      success: false,
      transactions: [],
      format: null,
      error: `Unrecognized CSV format. Supported formats: ${supportedFormats}`,
    };
  }

  // Parse data rows
  const transactions: RawTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);

    if (values.length !== headers.length) {
      continue; // Skip malformed rows
    }

    // Build row object
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index];
    });

    transactions.push(parseRow(row, format));
  }

  return {
    success: true,
    transactions,
    format,
  };
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim().replace(/^"|"$/g, ""));

  return values;
}

/**
 * Get list of supported format names for display
 */
export function getSupportedFormats(): string[] {
  return CSV_FORMATS.map((f) => f.name);
}
