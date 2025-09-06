// client/src/utils/auth.js
import { jwtDecode } from "jwt-decode";

// 🔹 Get decoded user from JWT
export const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    return jwtDecode(token); // decode payload
  } catch (err) {
    console.error("Invalid token", err);
    return null;
  }
};

// 🔹 Check if user has specific role
export const hasRole = (role) => {
  const user = getUserFromToken();
  return user?.role === role;
};

// 🔹 Get stored token directly
export const getToken = () => {
  return localStorage.getItem("token");
};
