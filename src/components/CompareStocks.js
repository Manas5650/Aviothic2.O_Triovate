import React, { useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import SearchBar from "./SearchBar";
import "./App.css";

const colorMap = {
  TSLA: "#E11D48", 
  AAPL: "#059669", 
  GOOGL: "#2563EB", 
  MSFT: "#7C3AED", 
  AMZN: "#F59E0B", 
};

function CompareStocks() {
  const [symbols, setSymbols] = useState([]);
  const [data, setData] = useState({});
  const [info, setInfo] = useState({});
  const [loading, setLoading] = useState(false);

  const allOptions = ["TSLA", "AAPL", "GOOGL", "MSFT", "AMZN", "NVDA", "META",
    "^NSEI",
    "^GSPC",
    "^DJI",
    "IXIC",

    "RELIANCE.NS",
    "TCS.NS",
    "INFY.NS",
    "HDFCBANK.NS",
    "ICICIBANK.NS",
    "BAJFINANCE.NS",
    "WIPRO.NS",
    "TATAMOTORS.NS",
    "SBIN.NS"
  ];

  const handleRemove = (sym) => {
    setSymbols(symbols.filter((s) => s !== sym));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (symbols.length === 0) {
      alert("Please select at least one stock to compare!");
      return;
    }

    setLoading(true);
    const results = {};
    const infos = {};

    try {
      for (let sym of symbols) {
        const resHistory = await axios.get(
          `http://localhost:5000/api/stock/history/${sym}`
        );
        const resInfo = await axios.get(
          `http://localhost:5000/api/stock/${sym}`
        );

        results[sym] = resHistory.data.history || [];
        infos[sym] = resInfo.data;
      }
      setData(results);
      setInfo(infos);
    } catch (err) {
      console.error("Error fetching comparison data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ color: "var(--text-color)" }}>📊 Compare Stocks</h2>

      {/* Stock Selection */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <SearchBar
          options={allOptions}
          onAdd={(sym) => {
            if (!symbols.includes(sym)) {
              setSymbols([...symbols, sym]);
            }
          }}
        />

        {/* Selected Stocks List */}
        <div style={{ marginBottom: "10px", marginTop: "10px" }}>
          {symbols.map((sym) => (
            <span
              key={sym}
              style={{
                display: "inline-flex",
                alignItems: "center",
                marginRight: "8px",
                marginBottom: "8px",
                padding: "6px 12px",
                background: colorMap[sym] || "#4F46E5",
                color: "white",
                borderRadius: "20px",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              {info[sym]
                ? `${info[sym].shortName} (${sym}) - $${info[sym].currentPrice?.toFixed(
                    2
                  )} ${info[sym].currency}`
                : sym}

              <button
                type="button"
                onClick={() => handleRemove(sym)}
                style={{
                  marginLeft: "8px",
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>

        {/* Compare Button */}
        <button
          type="submit"
          className="compare-btn"
          style={{
            background: "linear-gradient(90deg, #6366F1, #8B5CF6)",
            color: "white",
            padding: "10px 18px",
            border: "none",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
          }}
          onMouseOver={(e) =>
            (e.target.style.boxShadow =
              "0 6px 12px rgba(99, 102, 241, 0.6)")
          }
          onMouseOut={(e) =>
            (e.target.style.boxShadow = "0 3px 6px rgba(0, 0, 0, 0.2)")
          }
        >
          Compare
        </button>
      </form>

      {loading && <p>Loading comparison data...</p>}

      {/* Show charts like home */}
      {!loading &&
        symbols.map((sym) => (
          <div
            key={sym}
            style={{
              marginBottom: "40px",
              padding: "15px",
              borderRadius: "10px",
              background: "var(--card-bg)",
              color: "var(--text-color)",
              boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
            }}
          >
            {info[sym] && (
              <div style={{ marginBottom: "15px" }}>
                <h3>
                  {info[sym].shortName} ({sym})
                </h3>
                <p>
                  <b>Price:</b>{" "}
                  {`$${info[sym].currentPrice?.toFixed(2)} ${info[sym].currency}`}
                </p>
                <p>
                  <b>Open:</b> {info[sym].open} | <b>High:</b> {info[sym].high} |{" "}
                  <b>Low:</b> {info[sym].low}
                </p>
              </div>
            )}

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data[sym]}>
                <CartesianGrid stroke="rgba(200,200,200,0.2)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(str) =>
                    new Date(str).toLocaleDateString("en-GB")
                  }
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`$${value.toFixed(2)}`, "Close"]}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString("en-GB")
                  }
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke={colorMap[sym] || "#4F46E5"}
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
    </div>
  );
}

export default CompareStocks;