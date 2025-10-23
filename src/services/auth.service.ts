import { handleResponse } from "../utils/api";
const API_URL = process.env.REACT_APP_API_URI || "";

interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
  token: string;
}

export const authService = {
  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  async verifyToken(token: string): Promise<boolean> {
    try {
      console.log("Verifying token on client side...");
      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Verify response status:", response.status);
      const data = await response.json();
      console.log("Verify response data:", data);

      if (!response.ok) {
        console.error("Token verification failed:", data.error);
        return false;
      }

      return data.valid;
    } catch (error) {
      console.error("Token verification error:", error);
      return false;
    }
  },
};
