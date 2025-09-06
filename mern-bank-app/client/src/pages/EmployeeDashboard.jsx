// src/pages/EmployeeDashboard.jsx
import React, { useEffect, useState } from "react";

function EmployeeDashboard() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");

  const API_BASE_URL = "http://localhost:5000/api/employee";
  const token = localStorage.getItem("token");

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      setMessage("Error fetching users");
    }
  };

  // Fetch single user by ID
  const fetchUserDetails = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedUser(data.user);
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      setMessage("Error fetching user details");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
        <h2 className="text-xl font-semibold mb-4">All Users</h2>
        {users.length === 0 ? (
          <p className="text-gray-600">No users found.</p>
        ) : (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Phone</th>
                <th className="p-2 border">Aadhaar</th>
                <th className="p-2 border">Account Type</th>
                <th className="p-2 border">Balance</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="p-2 border">{u.name}</td>
                  <td className="p-2 border">{u.phone}</td>
                  <td className="p-2 border">{u.aadhaar}</td>
                  <td className="p-2 border capitalize">{u.accountType}</td>
                  <td className="p-2 border font-semibold text-green-700">
                    ₹{u.balance.toLocaleString()}
                  </td>
                  <td className="p-2 border">
                    <button
                      onClick={() => fetchUserDetails(u._id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* User Details Modal/Box */}
      {selectedUser && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">User Details</h2>
          <p><strong>Name:</strong> {selectedUser.name}</p>
          <p><strong>Phone:</strong> {selectedUser.phone}</p>
          <p><strong>Aadhaar:</strong> {selectedUser.aadhaar}</p>
          <p><strong>Account Type:</strong> {selectedUser.accountType}</p>
          <p><strong>Balance:</strong> ₹{selectedUser.balance}</p>
          <p><strong>Created At:</strong> {new Date(selectedUser.createdAt).toLocaleString()}</p>

          <button
            onClick={() => setSelectedUser(null)}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      )}

      {message && <p className="mt-4 text-red-600">{message}</p>}
    </div>
  );
}

export default EmployeeDashboard;
