import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import axios from "axios";
import { Line } from "react-chartjs-2";
import * as XLSX from "xlsx";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title
);

ReactModal.setAppElement("#root");

function AIStockPredict() {
  const [symbol, setSymbol] = useState("AAPL");
  const [days, setDays] = useState(10);
  const [predictionData, setPredictionData] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [trend, setTrend] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    const fetchHistory = async () => {
        try {
            const res = await axios.get(`http://127.0.0.1:5001/api/stock/history/${symbol}?from=2024-09-01&to=2024-09-30`);
            if (res.data && res.data.history) 
                setHistoricalData(res.data.history);
        } catch (error) {
            console.error("Error fetching history: ", error);
        }
    };
    fetchHistory();
  }, [symbol]);

  const handlePredict = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg("");
      setPredictionData([]);
      setSummary(null);

      const res = await axios.get(
        `http://127.0.0.1:5001/predict?symbol=${symbol}&days=${days}`
      );

      if (res.data && res.data.success) {
        setPredictionData(res.data.predictions);
        setHistoricalData(res.data.historical || []);
        setConfidence(res.data.confidence);
        setTrend(res.data.trend);

        const start = res.data.predictions[0].predicted_close;
        const end = res.data.predictions[res.data.predictions.length - 1].predicted_close;
        const totalGrowth = (end - start).toFixed(2);
        const avgGrowth = (totalGrowth / days).toFixed(2);

        setSummary({
          days,
          start,
          end,
          totalGrowth,
          avgGrowth,
        });
      } else {
        setErrorMsg("⚠ Unexpected response from AI model.");
      }
    } catch (error) {
      console.error("Prediction fetch error:", error);
      setErrorMsg(" Failed to fetch AI prediction. Please check backend!");
    } finally {
      setLoading(false);
    }
  };

  // Chart Data 
  const chartData = {
    labels: [
      ...(historicalData?.map((d) => d.date) || []),
      ...(predictionData?.map((d) => `Day ${d.day}`) || []),
    ],
    datasets: [
      {
        label: "Historical Close Price (USD)",
        data: historicalData?.map((d) => d.close) || [],
        borderColor: "#6B7280",
        backgroundColor: "rgba(107,114,128,0.3)",
        borderDash: [5, 5],
        tension: 0.3,
      },
      {
        label: "Predicted Close Price (USD)",
        data: [
          ...(historicalData?.length ? new Array(historicalData.length - 1).fill(null) : []),
          ...(predictionData?.map((d) => d.predicted_close) || []),
        ],
        borderColor: "#4F46E5",
        backgroundColor: "rgba(79,70,229,0.2)",
        tension: 0.4,
        pointBackgroundColor: "#4F46E5",
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#444",
          font: { size: 14, weight: "bold" },
        },
      },
      title: {
        display: true,
        text: "📊 AI Predicted Stock Performance",
        color: "#333",
        font: { size: 18, weight: "bold" },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ctx.raw !== null ? `$${Number(ctx.raw).toFixed(2)}` : "",
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#666", font: { size: 12 } },
        grid: { color: "rgba(200,200,200,0.1)" },
      },
      y: {
        ticks: { color: "#666", font: { size: 12 } },
        grid: { color: "rgba(200,200,200,0.1)" },
      },
    },
  };

  // Excel Download
  const handleExcelDownload = () => {
    if (!predictionData.length) return alert("No prediction data to export!");
    try {
      const wsData = predictionData.map((item) => ({
        Day: item.day,
        "Predicted Close (USD)": item.predicted_close,
      }));
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "AI Predictions");

      XLSX.utils.sheet_add_aoa(ws, [
        [],
        ["Generated on:", new Date().toLocaleString()],
        ["Stock Symbol:", symbol],
        ["Model Confidence:", `${confidence}%`],
      ]);

      XLSX.writeFile(wb, `AI_Prediction_${symbol}_${days}Days.xlsx`);
    } catch (error) {
      console.error("Excel Download Error:", error);
      alert("❌ Failed to download Excel file.");
    }
  };

  // CSV Download
  const handleCSVDownload = () => {
    if (!predictionData.length) return;
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Day,Predicted Close (USD)"]
        .concat(predictionData.map((d) => `${d.day},${d.predicted_close}`))
        .join("\n");

    const link = document.createElement("a");
    link.setAttribute(
      "href",
      encodeURI(csvContent)
    );
    link.setAttribute("download", `${symbol}_AI_Predictions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      style={{
        padding: "30px",
        textAlign: "center",
        background: "#f9fafb",
        borderRadius: "10px",
        width: "85%",
        margin: "40px auto",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ color: "#4F46E5", fontWeight: "bold", fontSize: "24px" }}>
         AI Stock Price Prediction
      </h2>

      {/* Input Form */}
      <form
        onSubmit={handlePredict}
        style={{
          margin: "25px 0",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontWeight: "600",
          }}
        >
          <option value="AAPL">Apple (AAPL)</option>
          <option value="TSLA">Tesla (TSLA)</option>
          <option value="GOOGL">Google (GOOGL)</option>
          <option value="MSFT">Microsoft (MSFT)</option>
          <option value="AMZN">Amazon (AMZN)</option>
        </select>

        <label style={{ fontWeight: "600" }}>Days:</label>
        <input
          type="number"
          min="1"
          max="60"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          style={{
            padding: "8px 10px",
            width: "80px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            textAlign: "center",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: "#4F46E5",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            cursor: "pointer",
            fontWeight: "600",
            transition: "0.3s",
          }}
        >
          {loading ? "Predicting..." : "Predict"}
        </button>
      </form>

      {/* Messages */}
      {loading && (
        <p style={{ color: "#4F46E5", fontWeight: "600" }}>
           AI is analyzing market patterns...
        </p>
      )}
      {errorMsg && (
        <p style={{ color: "#DC2626", fontWeight: "600" }}>{errorMsg}</p>
      )}
      {trend && (
        <p
          style={{
            fontWeight: "bold",
            fontSize: "18px",
            marginBottom: "15px",
            color:
              trend === "Bullish"
                ? "#22C55E"
                : trend === "Bearish"
                ? "#EF4444"
                : "#EAB308",
          }}
        >
          Market Trend: {trend}
        </p>
      )}

      {/* Chart */}
      {predictionData.length > 0 && (
        <div
          style={{
            width: "90%",
            maxWidth: "800px",
            margin: "0 auto",
            background: "white",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <Line data={chartData} options={chartOptions} />
          <button onClick={() => setIsModalOpen(true)}
            style={{
                marginTop: "15px",
                backgroundColor: "#6366F1",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                cursor: "pointer",
                fontWeight: "600",
            }}
          >
            View Historical Close
          </button>
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "center",
              gap: "15px",
            }}
          >
            <button
              onClick={handleCSVDownload}
              style={{
                backgroundColor: "#22C55E",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >

              ⬇ Download CSV
            </button>
            <button
              onClick={handleExcelDownload}
              style={{
                backgroundColor: "#2563EB",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              ⬇ Download Excel
            </button>
          </div>
        </div>
      )}

      {/*  Summary */}
      {summary && (
        <div
          style={{
            marginTop: "30px",
            background: "white",
            borderRadius: "8px",
            padding: "20px",
            width: "60%",
            margin: "30px auto",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ color: "#4F46E5", fontWeight: "bold" }}>
             Prediction Summary
          </h3>
          <p>Days Predicted: {summary.days}</p>
          <p>Starting Price: ${summary.start}</p>
          <p>Ending Price: ${summary.end}</p>
          <p
            style={{
              color: summary.totalGrowth >= 0 ? "#16A34A" : "#DC2626",
              fontWeight: "600",
            }}
          >
            Total Growth: {summary.totalGrowth >= 0 ? "+" : ""}
            ${summary.totalGrowth}
          </p>
          <p
            style={{
              color: summary.avgGrowth >= 0 ? "#16A34A" : "#DC2626",
              fontWeight: "600",
            }}
          >
            Avg Daily Growth: {summary.avgGrowth >= 0 ? "+" : ""}
            ${summary.avgGrowth}
          </p>
          <p style={{ color: "#6B7280" }}> AI Confidence: {confidence}%</p>
        </div>
      )}
      {/* Historical Data Modal */}
      <ReactModal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)}
        style={{
            overlay: { backgroundColor: "rgba(0,0,0,0.5)" },
            content: {
                maxWidth: "600px",
                margin: "auto",
                borderRadius: "10px",
                padding: "20px",
            },
        }}
    >
        <h2 style={{ textAlign: "center", color: "#4F46E5" }}>
            Last 30 Days Close Prices
        </h2>
        {historicalData.length > 0 ? (
            <table
                style={{ width: "100%", marginTop: "20px", borderCollapse: "collapse" }}
            >
                <thead>
                    <tr style={{ background: "#4F46E5", color: "white" }}>
                        <th style={{ padding: "10px" }}>Date</th>
                        <th style={{ padding: "10px" }}>Close (USD)</th>
                    </tr>
                </thead>
                <tbody>
                    {historicalData.map((item, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #ddd" }}>
                            <td style={{ padding: "8px" }}>{item.date}</td>
                            <td style={{ padding: "8px" }}>${item.close.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        ) : (
            <p style={{ textAlign: "center", marginTop: "20px" }}
            > Loading...</p>
        )}
        <button onClick={() => setIsModalOpen(false)} style={{
            marginTop: "20px",
            padding: "10px 15px",
            background: "#EF4444",
            color: "white",
            border: "none",
            borderradius: "6px",
            cursor: "pointer",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
        }}
        >
            Close
        </button>
    </ReactModal>
    </div>
  );
}

export default AIStockPredict;
