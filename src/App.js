import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import StockChart from "./components/StockChart";
import CompareStocks from "./components/CompareStocks";
import AIStockPredict from "./components/AIStockPredict";
import "./components/App.css";
import stockOptions from "./components/stockOptions";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  const [symbol, setSymbol] = useState("TSLA");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [formSymbol, setFormSymbol] = useState("TSLA");
  const [formFrom, setFormFrom] = useState("");
  const [formTo, setFormTo] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      } catch (err) {
        console.error("Invalid token", err);
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
  }, []);

  const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    return token ? children : <Navigate to="/login" />;
  };

  //  Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSymbol(formSymbol);
    setFrom(formFrom);
    setTo(formTo);
  };

  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <BrowserRouter>
      <div className={darkMode ? "app dark" : "app light"}>
        {/*  Header / Navbar */}
        <header
          style={{
            padding: "20px",
            background: darkMode ? "#1f2937" : "#fff",
            color: darkMode ? "#f9fafb" : "#000",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1>📊 Stock Market Dashboard</h1>

          {/*  Navbar Links */}
          <nav style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            {isLoggedIn ? (
              <>
                <NavLink
                  to="/"
                  end
                  style={({ isActive }) => ({
                    color: isActive ? "#6366F1" : darkMode ? "#f9fafb" : "#000",
                    textDecoration: isActive ? "underline" : "none",
                    fontWeight: "bold",
                  })}
                >
                  Home
                </NavLink>

                <NavLink
                  to="/compare"
                  style={({ isActive }) => ({
                    color: isActive ? "#6366F1" : darkMode ? "#f9fafb" : "#000",
                    textDecoration: isActive ? "underline" : "none",
                    fontWeight: "bold",
                  })}
                >
                  Compare
                </NavLink>

                <NavLink
                  to="/ai-predict"
                  style={({ isActive }) => ({
                    color: isActive ? "#6366F1" : darkMode ? "#f9fafb" : "#000",
                    textDecoration: isActive ? "underline" : "none",
                    fontWeight: "bold",
                  })}
                >
                  AI Predict 
                </NavLink>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    background: "crimson",
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  style={({ isActive }) => ({
                    color: isActive ? "#6366F1" : "#000",
                    textDecoration: isActive ? "underline" : "none",
                    fontWeight: "bold",
                  })}
                >
                  Login
                </NavLink>

                <NavLink
                  to="/register"
                  style={({ isActive }) => ({
                    color: isActive ? "#6366F1" : "#000",
                    textDecoration: isActive ? "underline" : "none",
                    fontWeight: "bold",
                  })}
                >
                  Register
                </NavLink>
              </>
            )}
          </nav>

          {/*  Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              background: darkMode ? "#f9fafb" : "#1f2937",
              color: darkMode ? "#1f2937" : "#f9fafb",
              fontWeight: "bold",
            }}
          >
            {darkMode ? "🌞 Light" : "🌙 Dark"}
          </button>
        </header>

        {/*  Routes */}
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>
                  <form
                    onSubmit={handleSubmit}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "10px",
                      marginBottom: "20px",
                    }}
                  >
                    <select
                      value={formSymbol}
                      onChange={(e) => setFormSymbol(e.target.value)}
                      style={{ padding: "8px", borderRadius: "6px" }}
                    >
                      {stockOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="date"
                      value={formFrom}
                      onChange={(e) => setFormFrom(e.target.value)}
                    />
                    <input
                      type="date"
                      value={formTo}
                      onChange={(e) => setFormTo(e.target.value)}
                    />
                    <button type="submit">Submit</button>
                  </form>

                  <StockChart
                    key={`${symbol}-${from}-${to}`}
                    symbol={symbol}
                    from={from}
                    to={to}
                    darkMode={darkMode}
                  />
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/compare"
            element={
              <ProtectedRoute>
                <CompareStocks />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ai-predict"
            element={
              <ProtectedRoute>
                <AIStockPredict />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
