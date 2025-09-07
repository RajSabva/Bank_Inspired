// src/pages/EmployeeDashboard.jsx
import React, { useEffect, useState, useCallback } from "react";

function EmployeeDashboard() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Environment-aware base URL (Vite)
  const API_BASE = import.meta.env.VITE_API_URL || "https://bank-inspired-app-hx90.onrender.com";
  const API_BASE_URL = `${API_BASE}/api/employee`;
  const token = localStorage.getItem("token");

  // Guard: if no token, force login
  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
    }
  }, [token]);

  // Centralized fetch wrapper that injects token and handles 401
  const authFetch = useCallback(
    async (url, opts = {}) => {
      const headers = { ...(opts.headers || {}) };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      // only set content-type if body is present and not FormData
      if (opts.body && !(opts.body instanceof FormData)) {
        headers["Content-Type"] = headers["Content-Type"] || "application/json";
      }
      const res = await fetch(url, { ...opts, headers });
      if (res.status === 401) {
        // auto logout on unauthorized
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        throw new Error("Unauthorized");
      }
      return res;
    },
    [token]
  );

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    setMessage("");
    setLoadingUsers(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/users`);
      const data = await res.json();
      if (res.ok) {
        setUsers(Array.isArray(data.users) ? data.users : []);
      } else {
        setMessage(data.message || "Failed to fetch users");
      }
    } catch (err) {
      if (err.message !== "Unauthorized") setMessage(err.message || "Error fetching users");
    } finally {
      setLoadingUsers(false);
    }
  }, [API_BASE_URL, authFetch]);

  // Fetch single user details
  const fetchUserDetails = useCallback(
    async (id) => {
      if (!id) return;
      setMessage("");
      setLoadingDetails(true);
      try {
        const res = await authFetch(`${API_BASE_URL}/user/${id}`);
        const data = await res.json();
        if (res.ok) {
          setSelectedUser(data.user || null);
        } else {
          setMessage(data.message || "Failed to fetch user details");
        }
      } catch (err) {
        if (err.message !== "Unauthorized") setMessage(err.message || "Error fetching user details");
      } finally {
        setLoadingDetails(false);
      }
    },
    [API_BASE_URL, authFetch]
  );

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">👨‍💼 Employee Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* Users List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">All Users</h2>
          <div className="text-sm text-gray-600">{users.length} users</div>
        </div>

        {loadingUsers ? (
          <p className="text-gray-600">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-600">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border text-left">Name</th>
                  <th className="p-2 border text-left">Phone</th>
                  <th className="p-2 border text-left">Aadhaar</th>
                  <th className="p-2 border text-left">Account Type</th>
                  <th className="p-2 border text-right">Balance</th>
                  <th className="p-2 border text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100">
                    <td className="p-2 border">{u.name}</td>
                    <td className="p-2 border">{u.phone}</td>
                    <td className="p-2 border">{u.aadhaar}</td>
                    <td className="p-2 border capitalize">{u.accountType}</td>
                    <td className="p-2 border text-right font-semibold text-green-700">
                      ₹{Number(u.balance || 0).toLocaleString()}
                    </td>
                    <td className="p-2 border text-center">
                      <button
                        onClick={() => fetchUserDetails(u._id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        disabled={loadingDetails}
                      >
                        {loadingDetails ? "Loading..." : "View Details"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details */}
      {selectedUser && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">User Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div><strong>Name:</strong> {selectedUser.name}</div>
            <div><strong>Phone:</strong> {selectedUser.phone}</div>
            <div><strong>Aadhaar:</strong> {selectedUser.aadhaar}</div>
            <div><strong>Account Type:</strong> {selectedUser.accountType}</div>
            <div><strong>Balance:</strong> ₹{Number(selectedUser.balance || 0).toLocaleString()}</div>
            <div><strong>Created At:</strong> {new Date(selectedUser.createdAt).toLocaleString()}</div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setSelectedUser(null)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {message && <p className="mt-4 text-red-600">{message}</p>}
    </div>
  );
}

export default EmployeeDashboard;
