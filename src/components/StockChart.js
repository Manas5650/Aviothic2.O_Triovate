import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    Legend,
    Bar,
    ComposedChart,
    Scatter
} from "recharts";
import { FaChartLine } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Customized } from "recharts";
import CandlestickChart from "./CandlestickChart"
import "./App.css";

const CustomCandle = ({ x, width, payload, yAxis }) => {
    const { open, close, high, low } = payload;

    if (open == null || close == null || high == null || low == null) return null;

    const scale = yAxis.scale;
    const yHigh = scale(high);
    const yLow = scale(low);
    const yOpen = scale(open);
    const yClose = scale(close);

    const isUp = close >= open;
    const candleX = x + width / 2 - 4;

    return (
        <g>
            <line
                x1={x + width / 2}
                x2={x + width / 2}
                y1={yHigh}
                y2={yLow}
                stroke={isUp ? "green" : "red"}
                strokeWidth={1}
            />
            <rect
                x={candleX}
                y={Math.min(yOpen, yClose)}
                width={8}
                height={Math.abs(yOpen - yClose)}
                fill={isUp ? "green" : "red"}
            />
        </g>
    );
};


function StockChart({ symbol, from: initialFrom, to: initialTo }) {
    const [data, setData] = useState([]);
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingInfo, setLoadingInfo] = useState(true);

    const [from, setFrom] = useState(initialFrom || "");
    const [to, setTo] = useState(initialTo || "");
    const [show50MA, setShow50MA] = useState(false);
    const [show200MA, setShow200MA] = useState(false);
    const [chartType, setChartType] = useState("line"); 
    const navigate = useNavigate();

    // Formatters
    const formatMarketCap = (num) => {
        if (!num) return "N/A";
        if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
        if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
        if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
        return num.toLocaleString();
    };

    const formatVolume = (num) => {
        if (!num) return "N/A";
        if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
        if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
        return num.toLocaleString();
    };

    const formatUSD = (num) => {
        const value = Number(num);
        if (isNaN(value)) return "$0.00 USD";
        return `$${value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    // Calculate Moving Average
    const calculateMA = (data, window) => {
        return data.map((point, index, arr) => {
            if (index < window) return { ...point, [`ma${window}`]: null };
            const slice = arr.slice(index - window, index);
            const avg =
                slice.reduce((sum, item) => sum + Number(item.close || 0), 0) / window;
            return { ...point, [`ma${window}`]: avg };
        });
    };

    // Fetching the historical data
    useEffect(() => {
        const fetchStockData = async () => {
            try {
                setLoading(true);
                let url = `http://localhost:5000/api/stock/history/${symbol}`;
                if (from || to) {
                    const params = [];
                    if (from) params.push(`from=${from}`);
                    if (to) params.push(`to=${to}`);
                    url += `?${params.join("&")}`;
                }

                const res = await axios.get(url);
                let history = res.data.history || [];

                history = calculateMA(history, 50);
                history = calculateMA(history, 200);

                setData(history);
            } catch (error) {
                console.error("Error fetching stock data:", error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStockData();
    }, [symbol, from, to]);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                setLoadingInfo(true);
                const res = await axios.get(`http://localhost:5000/api/stock/${symbol}`);
                setInfo(res.data);
            } catch (error) {
                console.error("Error fetching stock info:", error);
            } finally {
                setLoadingInfo(false);
            }
        };
        fetchInfo();
    }, [symbol]);

    const handleRange = (range) => {
        const today = new Date();
        let fromDate = "";

        if (range === "1M") {
            fromDate = new Date(today.setMonth(today.getMonth() - 1));
        } else if (range === "6M") {
            fromDate = new Date(today.setMonth(today.getMonth() - 6));
        } else if (range === "1Y") {
            fromDate = new Date(today.setFullYear(today.getFullYear() - 1));
        } else {
            fromDate = "";
        }

        setFrom(fromDate ? fromDate.toISOString().split("T")[0] : "");
        setTo(new Date().toISOString().split("T")[0]);
    };

    return (
        <div className="chart-container">
            {/*  Stock Info Card */}
            {loadingInfo ? (
                <div style={{ textAlign: "center", padding: "30px" }}>
                    <div className="loader"></div>
                    <p>Loading stock info...</p>
                </div>
            ) : (
                info && (
                    <div
                        style={{
                            marginBottom: "20px",
                            padding: "15px 20px",
                            borderRadius: "10px",
                            background: "var(--card-bg)",
                            color: "var(--text-color)",
                            boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <h3 style={{ margin: 0, fontSize: "18px" }}>
                                {info.shortName} ({info.symbol})
                            </h3>

                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "22px", fontWeight: "bold" }}>
                                        {info.currentPrice} {info.currency}
                                    </div>
                                    <div
                                        style={{
                                            color: info.changePercent > 0 ? "limegreen" : info.changePercent < 0 ? "red" : "#888",
                                            fontWeight: "bold",
                                            fontSize: "14px",
                                        }}
                                    >
                                        {info.changePercent > 0 ? `▲ + ${info.changePercent.toFixed(2)}%` : info.changePercent < 0 ? `▼ ${info.changePercent.toFixed(2)}%` : " 0.00%"}
                                        {/* {(info?.changePercent ?? 0).toFixed(2)}% */}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/*  Extra Stats */}
                        <div
                            style={{
                                marginTop: "15px",
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                                gap: "15px",
                                fontSize: "14px",
                                textAlign: "center",
                            }}
                        >
                            <div className="stat-card">Open: <b>{info.open ?? "N/A"}</b></div>
                            <div className="stat-card">High: <b>{info.high ?? "N/A"}</b></div>
                            <div className="stat-card">Low: <b>{info.low ?? "N/A"}</b></div>
                            <div className="stat-card">Volume: <b>{formatVolume(info.volume)}</b></div>
                            <div className="stat-card">Mkt Cap: <b>{formatMarketCap(info.marketCap)}</b></div>
                            <div className="stat-card">52W High: <b>{info.fiftyTwoWeekHigh ?? "N/A"}</b></div>
                            <div className="stat-card">52W Low: <b>{info.fiftyTwoWeekLow ?? "N/A"}</b></div>
                        </div>

                        {/*  Last Updated */}
                        {info.marketTime && (
                            <p
                                style={{
                                    marginTop: "10px",
                                    fontSize: "12px",
                                    color: "#888",
                                    fontStyle: "italic",
                                    textAlign: "center",
                                }}
                            >
                                Last Updated:{" "}
                                {new Date(info.marketTime).toLocaleString("en-GB")}
                            </p>
                        )}
                    </div>
                )
            )}

            {/*  Chart Section */}
            <h2
                style={{
                    color: "var(--text-color)",
                    marginTop: "30px",
                    paddingBottom: "8px",
                    borderBottom: "2px solid rgba(200, 200, 200, 0.3)",
                    fontSize: "20px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                <FaChartLine style={{ color: "#4F46E5" }} />{" "}
                {info?.shortName || symbol} Historical Performance
            </h2>

            {/*  Time Filter */}
            <div style={{ display: "flex", gap: "10px", margin: "15px 0" }}>
                <button onClick={() => handleRange("1M")}>1M</button>
                <button onClick={() => handleRange("6M")}>6M</button>
                <button onClick={() => handleRange("1Y")}>1Y</button>
                <button onClick={() => handleRange("MAX")}>Max</button>
            </div>

            {/* Chart Toggle */}
            <div style={{ display: "flex", gap: "10px", margin: "10px 0" }}>
                <button onClick={() => setChartType("line")}>📈 Line</button>
                <button onClick={() => setChartType("candle")}>🕯 Candlestick</button>
            </div>

            {/*  Line Chart */}
            {chartType === "line" && !loading && (
                <>
                    {/* MA Toggles */}
                    <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
                        <label>
                            <input
                                type="checkbox"
                                checked={show50MA}
                                onChange={() => setShow50MA(!show50MA)}
                            />
                            50-Day MA
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={show200MA}
                                onChange={() => setShow200MA(!show200MA)}
                            />
                            200-Day MA
                        </label>
                    </div>

                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={data}>
                            <CartesianGrid stroke="rgba(200,200,200,0.2)" />
                            <XAxis dataKey="date" tickFormatter={(str) => new Date(str).toLocaleDateString("en-GB")} type="category" allowDuplicatedCategory={false} />
                            <YAxis />
                            <Tooltip formatter={(value, name) => [
                                formatUSD(value),
                                name === "close" ? "Close" : name === "ma50" ? "50-Day MA" : "200-Day MA"
                            ]} />
                            <Line type="linear" dataKey="close" stroke="#4F46E5" strokeWidth={2.5} dot={false} name="Close" />
                            {show50MA && <Line type="linear" dataKey="ma50" stroke="#F59E0B" strokeWidth={2} dot={false} name="50-Day MA" />}
                            {show200MA && <Line type="linear" dataKey="ma200" stroke="#10B981" strokeWidth={2} dot={false} name="200-Day MA" />}
                            <Legend verticalAlign="bottom" height={36} align="center" iconType="line" />
                        </LineChart>
                    </ResponsiveContainer>
                </>
            )}
            {chartType === "candle" && <CandlestickChart stockData={data} />}
        </div>
    );
}

export default StockChart;