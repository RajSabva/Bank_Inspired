// src/pages/UserDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";

function UserDashboard() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [message, setMessage] = useState("");
  const [showTransactions, setShowTransactions] = useState(false);
  const [activeTab, setActiveTab] = useState("deposit");

  const API_BASE = import.meta.env.VITE_API_URL || "https://bank-inspired-app-hx90.onrender.com";
  const API_BASE_URL = `${API_BASE}/api/users`;
  const token = localStorage.getItem("token");

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  // Redirect to login if no token
  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
    }
  }, [token]);

  // Centralized fetch wrapper: attaches token, handles 401
  const authFetch = useCallback(
    async (url, opts = {}) => {
      const headers = { ...(opts.headers || {}) };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (opts.body && !(opts.body instanceof FormData)) {
        headers["Content-Type"] = headers["Content-Type"] || "application/json";
      }

      const res = await fetch(url, { ...opts, headers });
      if (res.status === 401) {
        // Auto logout and redirect
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        throw new Error("Unauthorized");
      }
      return res;
    },
    [token]
  );

  // Fetch transaction history
  const fetchHistory = useCallback(async () => {
    setMessage("");
    try {
      const res = await authFetch(`${API_BASE_URL}/history`);
      const data = await res.json();
      if (res.ok) {
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      } else {
        setMessage(data.message || "Failed to load history");
      }
    } catch (err) {
      if (err.message !== "Unauthorized") setMessage(err.message || "Error fetching history");
    }
  }, [API_BASE_URL, authFetch]);

  // Fetch balance from server (preferred) with fallback to local user object
  const fetchBalance = useCallback(async () => {
    setMessage("");
    try {
      // Try hitting /me endpoint (common pattern). If it doesn't exist, fallback.
      const res = await authFetch(`${API_BASE_URL}/me`);
      if (res.ok) {
        const data = await res.json();
        setBalance(Number(data.user?.balance ?? user?.balance ?? 0));
      } else {
        // fallback to local user
        setBalance(Number(user?.balance ?? 0));
      }
    } catch (err) {
      // fallback to local user if network fails (but not on Unauthorized)
      if (err.message !== "Unauthorized") setBalance(Number(user?.balance ?? 0));
    }
  }, [API_BASE_URL, authFetch, user]);

  useEffect(() => {
    fetchBalance();
    fetchHistory();
  }, [fetchBalance, fetchHistory]);

  // Generic input validators
  const isValidAmount = (val) => {
    const n = Number(val);
    return Number.isFinite(n) && n > 0;
  };
  const isValidPhone = (p) => /^[0-9]{10}$/.test(p);

  // Deposit
  const handleDeposit = async () => {
    if (!isValidAmount(amount)) {
      setMessage("Enter a valid amount (> 0).");
      return;
    }
    setMessage("");
    try {
      const res = await authFetch(`${API_BASE_URL}/deposit`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(Number(data.balance ?? data.user?.balance ?? balance));
        setMessage("✅ Deposit successful!");
        setAmount("");
        fetchHistory();
      } else {
        setMessage(data.message || "Deposit failed");
      }
    } catch (err) {
      if (err.message !== "Unauthorized") setMessage(err.message || "Error during deposit");
    }
  };

  // Withdraw
  const handleWithdraw = async () => {
    if (!isValidAmount(amount)) {
      setMessage("Enter a valid amount (> 0).");
      return;
    }
    setMessage("");
    try {
      const res = await authFetch(`${API_BASE_URL}/withdraw`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(Number(data.balance ?? data.user?.balance ?? balance));
        setMessage("✅ Withdrawal successful!");
        setAmount("");
        fetchHistory();
      } else {
        setMessage(data.message || "Withdrawal failed");
      }
    } catch (err) {
      if (err.message !== "Unauthorized") setMessage(err.message || "Error during withdrawal");
    }
  };

  // Transfer
  const handleTransfer = async () => {
    if (!isValidPhone(recipientPhone)) {
      setMessage("Enter a valid 10-digit recipient phone number.");
      return;
    }
    if (!isValidAmount(amount)) {
      setMessage("Enter a valid amount (> 0).");
      return;
    }
    setMessage("");
    try {
      const res = await authFetch(`${API_BASE_URL}/transfer`, {
        method: "POST",
        body: JSON.stringify({ recipientPhone, amount: Number(amount) }),
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(Number(data.senderBalance ?? data.user?.balance ?? balance));
        setMessage(data.message || "✅ Transfer successful!");
        setAmount("");
        setRecipientPhone("");
        fetchHistory();
      } else {
        setMessage(data.message || "Transfer failed");
      }
    } catch (err) {
      if (err.message !== "Unauthorized") setMessage(err.message || "Error during transfer");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 p-4 bg-white rounded-xl shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Financial Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name || "User"}!</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              Logout
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Balance Card */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-gray-600 text-sm font-medium">Total Balance</h2>
                <p className="text-3xl font-bold text-gray-800 mt-1">₹{Number(balance || 0).toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center text-sm text-green-600 mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>2.5% from last month</span>
            </div>
          </div>

          {/* Actions Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
            <div className="flex space-x-2 mb-6 border-b">
              <button
                onClick={() => setActiveTab("deposit")}
                className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "deposit" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900"}`}
              >
                Deposit
              </button>
              <button
                onClick={() => setActiveTab("withdraw")}
                className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "withdraw" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900"}`}
              >
                Withdraw
              </button>
              <button
                onClick={() => setActiveTab("transfer")}
                className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "transfer" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900"}`}
              >
                Transfer
              </button>
            </div>

            {activeTab === "deposit" && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₹</span>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-8 w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  onClick={handleDeposit}
                  disabled={!isValidAmount(amount)}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  Deposit
                </button>
              </div>
            )}

            {activeTab === "withdraw" && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₹</span>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-8 w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  onClick={handleWithdraw}
                  disabled={!isValidAmount(amount)}
                  className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  Withdraw
                </button>
              </div>
            )}

            {activeTab === "transfer" && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Phone</label>
                  <input
                    type="text"
                    placeholder="Enter recipient's phone number"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₹</span>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-8 w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  onClick={handleTransfer}
                  disabled={!isValidPhone(recipientPhone) || !isValidAmount(amount)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  Transfer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {message}
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div
            className="flex justify-between items-center p-6 cursor-pointer"
            onClick={() => setShowTransactions(!showTransactions)}
          >
            <h2 className="text-xl font-semibold text-gray-800">Transaction History</h2>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">{showTransactions ? "Click to collapse" : "Click to expand"}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-600 transform transition-transform ${showTransactions ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {showTransactions && (
            <div className="border-t">
              {transactions.length === 0 ? (
                <div className="p-6 text-center text-gray-600">No transactions yet.</div>
              ) : (
                <div className="divide-y">
                  {transactions.map((tx) => (
                    <div key={tx._id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div className={`p-3 rounded-full mr-4 ${tx.type === "deposit" ? "bg-green-100 text-green-600" : tx.type === "withdraw" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              {tx.type === "deposit" ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /> : tx.type === "withdraw" ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />}
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 capitalize">{tx.type}</p>
                            <p className="text-sm text-gray-600">{new Date(tx.createdAt).toLocaleString()}</p>
                            {tx.recipient && <p className="text-sm text-gray-600 mt-1">To: {tx.recipient.name} ({tx.recipient.phone})</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${tx.type === "deposit" ? "text-green-600" : tx.type === "withdraw" ? "text-red-600" : "text-blue-600"}`}>
                            {tx.type === "deposit" ? "+" : "-"}₹{tx.amount}
                          </p>
                          <p className={`text-sm ${tx.status === "success" ? "text-green-600" : "text-red-600"}`}>{tx.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
