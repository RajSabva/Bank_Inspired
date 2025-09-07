// src/pages/AdminDashboard.jsx
import React, { useEffect, useState, useCallback } from "react";

function AdminDashboard() {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    aadhaar: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Environment-aware API base (Vite). Fallback to your Render backend URL if env not available.
  const API_BASE_URL = import.meta.env.VITE_API_URL || "https://bank-inspired-app-hx90.onrender.com/api/admin";
  const token = localStorage.getItem("token");
  const adminData = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  // Helper: centralized fetch wrapper to attach token and handle 401
  const authFetch = useCallback(
    async (url, opts = {}) => {
      const headers = { ...(opts.headers || {}) };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      headers["Content-Type"] = headers["Content-Type"] || "application/json";

      const res = await fetch(url, { ...opts, headers });
      // Auto-logout on unauthorized
      if (res.status === 401) {
        handleLogout();
        throw new Error("Unauthorized. Logged out.");
      }
      return res;
    },
    [token]
  );

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    setFetching(true);
    setMessage("");
    try {
      const res = await authFetch(`${API_BASE_URL}/employees`);
      const data = await res.json();
      if (res.ok) {
        setEmployees(Array.isArray(data.employees) ? data.employees : []);
      } else {
        setMessage(data.message || "Failed to fetch employees");
      }
    } catch (err) {
      setMessage(err.message || "Error fetching employees");
    } finally {
      setFetching(false);
    }
  }, [API_BASE_URL, authFetch]);

  useEffect(() => {
    // if no token, redirect to login immediately
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount

  // Input change
  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  // Create employee
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await authFetch(`${API_BASE_URL}/create-employee`, {
        method: "POST",
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Employee created successfully!");
        setFormData({ name: "", phone: "", aadhaar: "", password: "" });
        fetchEmployees();
      } else {
        setMessage(data.message || "Failed to create employee");
      }
    } catch (err) {
      setMessage(err.message || "Error creating employee");
    } finally {
      setLoading(false);
    }
  };

  // Delete employee
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    setMessage("");
    try {
      const res = await authFetch(`${API_BASE_URL}/employee/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Employee deleted successfully!");
        fetchEmployees();
      } else {
        setMessage(data.message || "Failed to delete employee");
      }
    } catch (err) {
      setMessage(err.message || "Error deleting employee");
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {adminData?.name || "Admin"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Employee Form */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Create New Employee</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
                <input
                  type="text"
                  name="aadhaar"
                  placeholder="Enter Aadhaar number"
                  value={formData.aadhaar}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Employee"}
              </button>
            </form>
          </div>

          {/* Employees List */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Employees List</h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                {employees.length} employees
              </span>
            </div>

            {fetching ? (
              <div className="text-center py-8 text-gray-500">Loading employees...</div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No employees found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2 px-3 text-left text-sm font-medium text-gray-700">Name</th>
                      <th className="py-2 px-3 text-left text-sm font-medium text-gray-700">Phone</th>
                      <th className="py-2 px-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-3">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-1 rounded-full mr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span>{emp.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">{emp.phone}</td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleDelete(emp._id)}
                            className="text-red-600 hover:text-red-800 text-sm flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
