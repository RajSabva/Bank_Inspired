// src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState("user"); // user | employee | admin
  const [formData, setFormData] = useState({
    aadhaar: "",
    name: "",
    phone: "",
    accountType: "savings",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Environment-aware API base (Vite). Fallback to deployed backend URL.
  const API_BASE = import.meta.env.VITE_API_URL || "https://bank-inspired-app-hx90.onrender.com";

  // If already logged-in, redirect to appropriate dashboard
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = (() => {
      try {
        return JSON.parse(localStorage.getItem("user"));
      } catch {
        return null;
      }
    })();
    if (token && user) {
      const role = user.role || user.type || (user.isAdmin ? "admin" : userType);
      if (role === "admin") navigate("/dashboard/admin");
      else if (role === "employee") navigate("/dashboard/employee");
      else navigate("/dashboard/user");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let endpoint = "";
      if (isLogin) {
        // admin uses separate login route
        if (userType === "admin") endpoint = `${API_BASE}/api/admin/login`;
        else endpoint = `${API_BASE}/api/users/login`; // users & employees share user login route
      } else {
        // registration only for normal users
        endpoint = `${API_BASE}/api/users/register`;
      }

      const payload = isLogin
        ? { phone: formData.phone, password: formData.password }
        : {
            aadhaar: formData.aadhaar,
            name: formData.name,
            phone: formData.phone,
            accountType: formData.accountType,
            password: formData.password,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        if (!isLogin) {
          setSuccess("Registration successful. Please login.");
          setIsLogin(true);
          setFormData((p) => ({ ...p, password: "" }));
        } else {
          // normalize returned user object (user/admin/employee)
          const userData = data.user || data.admin || data.employee || null;
          if (!data.token || !userData) {
            setError("Invalid response from server.");
            return;
          }

          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(userData));

          // redirect based on role (fall back to selected userType)
          const role = userData.role || userData.type || (userData.isAdmin ? "admin" : userType);
          if (role === "admin") navigate("/dashboard/admin");
          else if (role === "employee") navigate("/dashboard/employee");
          else navigate("/dashboard/user");
        }
      } else {
        setError(data.message || "Authentication failed");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-md">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {isLogin ? (userType === "admin" ? "Admin Login" : userType === "employee" ? "Employee Login" : "User Login") : "Create Account"}
            </h1>
            <p className="text-gray-600">
              {isLogin ? (userType === "admin" ? "Sign in as Admin" : userType === "employee" ? "Sign in as Employee" : "Sign in to continue") : "Register to get started"}
            </p>
          </div>

          {/* Error / Success */}
          {error && <div className="mb-6 bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
          {success && <div className="mb-6 bg-green-50 text-green-700 p-3 rounded-lg text-sm">{success}</div>}

          {/* User Type Toggle - only for login */}
          {isLogin && (
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
              {["user", "employee", "admin"].map((type) => (
                <button
                  key={type}
                  onClick={() => setUserType(type)}
                  type="button"
                  className={`flex-1 py-2 px-4 rounded-xl font-medium text-center transition-all duration-300 ${
                    userType === type ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
                  <input
                    name="aadhaar"
                    type="text"
                    value={formData.aadhaar}
                    onChange={handleChange}
                    placeholder="Enter 12-digit Aadhaar"
                    pattern="[0-9]{12}"
                    required
                    className="w-full px-4 py-3 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Enter your full name" required className="w-full px-4 py-3 border rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                  <select name="accountType" value={formData.accountType} onChange={handleChange} required className="w-full px-4 py-3 border rounded-lg">
                    <option value="savings">Savings</option>
                    <option value="current">Current</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Enter phone" required pattern="[0-9]{10}" className="w-full px-4 py-3 border rounded-lg" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Enter password" required minLength="6" className="w-full px-4 py-3 border rounded-lg" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition">
              {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setSuccess("");
                }}
                className="text-blue-600 font-medium hover:text-blue-800"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
