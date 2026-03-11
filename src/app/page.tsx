"use client";

import { useState, useCallback, useEffect } from "react";
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

interface DriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
}

interface DriveFolder {
  id: string;
  name: string;
}

interface DriveTokens {
  accessToken: string;
  refreshToken?: string;
}

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
  const [loadedFiles, setLoadedFiles] = useState<string[]>([]);

  // Google Drive state
  const [driveTokens, setDriveTokens] = useState<DriveTokens | null>(null);
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([]);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);

  // Check for OAuth callback tokens on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const authError = params.get("auth_error");

    if (authError) {
      setError(`Google authentication failed: ${authError}`);
      window.history.replaceState({}, "", "/");
      return;
    }

    if (accessToken) {
      const tokens: DriveTokens = { accessToken, refreshToken: refreshToken || undefined };
      setDriveTokens(tokens);
      localStorage.setItem("drive_tokens", JSON.stringify(tokens));
      window.history.replaceState({}, "", "/");
    } else {
      // Check localStorage for existing tokens
      const stored = localStorage.getItem("drive_tokens");
      if (stored) {
        try {
          setDriveTokens(JSON.parse(stored));
        } catch {
          localStorage.removeItem("drive_tokens");
        }
      }

      // Load saved folder preference
      const savedFolderId = localStorage.getItem("drive_folder_id");
      const savedFolderName = localStorage.getItem("drive_folder_name");
      if (savedFolderId) {
        setSelectedFolderId(savedFolderId);
        setSelectedFolderName(savedFolderName);
      }
    }
  }, []);

  // Load folders when authenticated
  useEffect(() => {
    if (driveTokens) {
      loadFolders();
    }
  }, [driveTokens]);

  // Auto-load files when folder is selected and we have tokens
  useEffect(() => {
    if (driveTokens && selectedFolderId) {
      loadDriveFiles();
    }
  }, [driveTokens, selectedFolderId]);

  const connectToDrive = async () => {
    try {
      const response = await fetch("/api/auth/google");
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch {
      setError("Failed to connect to Google Drive");
    }
  };

  const disconnectDrive = () => {
    setDriveTokens(null);
    setDriveFolders([]);
    setDriveFiles([]);
    setSelectedFolderId(null);
    setSelectedFolderName(null);
    localStorage.removeItem("drive_tokens");
    localStorage.removeItem("drive_folder_id");
    localStorage.removeItem("drive_folder_name");
  };

  const loadFolders = async () => {
    if (!driveTokens) return;

    try {
      const response = await fetch("/api/drive/folders", {
        headers: {
          Authorization: `Bearer ${driveTokens.accessToken}`,
          "X-Refresh-Token": driveTokens.refreshToken || "",
        },
      });

      if (response.status === 401) {
        disconnectDrive();
        setError("Google Drive session expired. Please reconnect.");
        return;
      }

      const data = await response.json();
      setDriveFolders(data.folders || []);
    } catch {
      setError("Failed to load Drive folders");
    }
  };

  const loadDriveFiles = async () => {
    if (!driveTokens || !selectedFolderId) return;

    setIsLoadingDrive(true);
    setError(null);

    try {
      // Get list of CSV files in folder
      const filesResponse = await fetch(
        `/api/drive/files?folderId=${selectedFolderId}`,
        {
          headers: {
            Authorization: `Bearer ${driveTokens.accessToken}`,
            "X-Refresh-Token": driveTokens.refreshToken || "",
          },
        }
      );

      if (filesResponse.status === 401) {
        disconnectDrive();
        setError("Google Drive session expired. Please reconnect.");
        return;
      }

      const filesData = await filesResponse.json();
      const files: DriveFile[] = filesData.files || [];
      setDriveFiles(files);

      if (files.length === 0) {
        setIsLoadingDrive(false);
        return;
      }

      // Fetch content of all CSV files
      const contentResponse = await fetch("/api/drive/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${driveTokens.accessToken}`,
          "X-Refresh-Token": driveTokens.refreshToken || "",
        },
        body: JSON.stringify({ fileIds: files.map((f) => f.id) }),
      });

      const contentData = await contentResponse.json();

      if (contentData.files) {
        const allTransactions: RawTransaction[] = [];
        const fileNames: string[] = [];

        for (let i = 0; i < contentData.files.length; i++) {
          const { content } = contentData.files[i];
          const parsed = parseCSV(content);
          if (parsed.length > 0) {
            allTransactions.push(...parsed);
            fileNames.push(files[i].name);
          }
        }

        if (allTransactions.length > 0) {
          setRawTransactions(allTransactions);
          setLoadedFiles(fileNames);
          setTransactions([]);
          setInsights([]);
        }
      }
    } catch {
      setError("Failed to load files from Google Drive");
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const selectFolder = (folder: DriveFolder) => {
    setSelectedFolderId(folder.id);
    setSelectedFolderName(folder.name);
    localStorage.setItem("drive_folder_id", folder.id);
    localStorage.setItem("drive_folder_name", folder.name);
  };

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setError(null);
      const allTransactions: RawTransaction[] = [...rawTransactions];
      const newFileNames: string[] = [];

      let filesProcessed = 0;

      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            const parsed = parseCSV(text);
            if (parsed.length > 0) {
              allTransactions.push(...parsed);
              newFileNames.push(file.name);
            }
          } catch {
            setError(`Failed to parse ${file.name}`);
          }

          filesProcessed++;
          if (filesProcessed === files.length) {
            setRawTransactions(allTransactions);
            setLoadedFiles((prev) => [...prev, ...newFileNames]);
            setTransactions([]);
            setInsights([]);
          }
        };
        reader.readAsText(file);
      });
    },
    [rawTransactions]
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

  const clearAll = useCallback(() => {
    setRawTransactions([]);
    setTransactions([]);
    setInsights([]);
    setLoadedFiles([]);
    setError(null);
  }, []);

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
            Connect to Google Drive or upload CSV files to analyze spending
          </p>
        </header>

        {/* Google Drive Connection */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Google Drive
            </h2>
            {driveTokens ? (
              <button
                onClick={disconnectDrive}
                className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={connectToDrive}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0L1.5 6v12L12 24l10.5-6V6L12 0zm0 2.25l8.25 4.5v9l-8.25 4.5-8.25-4.5v-9L12 2.25z" />
                </svg>
                Connect to Drive
              </button>
            )}
          </div>

          {driveTokens && (
            <>
              {/* Folder Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Statements Folder
                </label>
                <div className="flex gap-2 items-center">
                  <select
                    value={selectedFolderId || ""}
                    onChange={(e) => {
                      const folder = driveFolders.find((f) => f.id === e.target.value);
                      if (folder) selectFolder(folder);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a folder...</option>
                    {driveFolders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={loadDriveFiles}
                    disabled={!selectedFolderId || isLoadingDrive}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    {isLoadingDrive ? "Loading..." : "Refresh"}
                  </button>
                </div>
                {selectedFolderName && (
                  <p className="mt-2 text-sm text-gray-500">
                    Watching: <span className="font-medium">{selectedFolderName}</span>
                    {driveFiles.length > 0 && ` (${driveFiles.length} CSV files)`}
                  </p>
                )}
              </div>
            </>
          )}

          {!driveTokens && (
            <p className="text-sm text-gray-500">
              Connect your Google Drive to automatically load CSV statements from a folder.
            </p>
          )}
        </section>

        {/* Loaded Files Section */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Statements
            </h2>
            {loadedFiles.length > 0 && (
              <button
                onClick={clearAll}
                className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Loaded Files */}
          {loadedFiles.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">{loadedFiles.length}</span> file(s) loaded with{" "}
                <span className="font-medium">{rawTransactions.length}</span> transactions:
              </p>
              <div className="flex flex-wrap gap-2">
                {loadedFiles.map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Manual Upload */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <label className="flex-1">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="text-gray-600">
                  <span className="font-medium">Click to upload files</span> or drag and drop
                  <br />
                  <span className="text-sm text-gray-500">
                    CSV format (Apple Card, bank statements)
                  </span>
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

          {rawTransactions.length > 0 && transactions.length === 0 && !isLoadingDrive && (
            <p className="mt-3 text-sm text-gray-600">
              {rawTransactions.length} transactions ready. Click analyze to categorize them.
            </p>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </section>

        {/* Loading State */}
        {(isLoading || isLoadingDrive) && (
          <div className="bg-white rounded-lg shadow p-12 mb-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {isLoadingDrive
                ? "Loading files from Google Drive..."
                : "Claude is analyzing your transactions..."}
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
