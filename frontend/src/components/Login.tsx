import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { UserContext } from "../context/UserContext";

export default function Login() {
  const { login } = useContext(UserContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      const { username, time } = JSON.parse(saved);
      setUsername(username);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
  e?.preventDefault();
  if (!username || !password) return alert("Provide username & password");

  setLoading(true);
  try {
    console.log("🔄 Sending login request...", { username, password });

    const res = await API.post("/auth/login", { username, password });

    console.log("✅ Response received:", res);

    if (res.data?.success) {
      login(res.data.username, rememberMe);

      if (rememberMe) {
        localStorage.setItem(
          "user",
          JSON.stringify({ username: res.data.username, time: new Date().toISOString() })
        );
      } else {
        localStorage.removeItem("user");
      }

      navigate("/dashboard");
    } else {
      alert(res.data?.message || "Login failed");
    }
  } catch (err: any) {
    console.error("❌ Error in login request:", err);

    if (err.response) {
      console.error("📡 Backend error response:", err.response);
      alert(err.response.data?.message || "Login failed (server error)");
    } else if (err.request) {
      console.error("🚫 No response from backend. Request details:", err.request);
      alert("No response from server. Please check backend connection.");
    } else {
      console.error("⚠️ Unexpected error:", err.message);
      alert("Unexpected error: " + err.message);
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="container" style={{ maxWidth: 420, margin: "auto", paddingTop: 60 }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Admin Login</h2>

      <form onSubmit={handleLogin} style={{ display: "grid", gap: 12 }}>
        {/* Username */}
        <input
          className="input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {/* Password with toggle */}
        <div style={{ position: "relative" }}>
          <input
            className="input"
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              userSelect: "none",
              fontSize: 18,
            }}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {/* Remember me */}
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Remember me
        </label>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
