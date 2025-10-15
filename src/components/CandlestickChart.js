import React, { useEffect, useRef, useState } from "react";
import {
  Chart,
  LinearScale,
  TimeSeriesScale,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";
import {
  CandlestickController,
  CandlestickElement,
} from "chartjs-chart-financial";
import zoomPlugin from "chartjs-plugin-zoom";
import "chartjs-adapter-date-fns";

Chart.register(
  TimeSeriesScale,
  LinearScale,
  Tooltip,
  Legend,
  BarElement,
  CandlestickController,
  CandlestickElement,
  zoomPlugin
);

function CandlestickChart({ stockData }) {
  const chartRef = useRef(null);
  const [showBuy, setShowBuy] = useState(true);
  const [showSell, setShowSell] = useState(true);

  useEffect(() => {
    if (!stockData || stockData.length === 0) {
      console.warn("⚠ stockData is empty or invalid");
      return;
    }

    const ctx = chartRef.current?.getContext("2d");
    if (!ctx) return;

    if (window.myCandleChart) {
      window.myCandleChart.destroy();
      window.myCandleChart = null;
    }

    const buyData = stockData.filter((d) => d.close > d.open);
    const sellData = stockData.filter((d) => d.close < d.open);

    const datasets = [];

    if (showBuy) {
      datasets.push({
        label: "Buy",
        type: "candlestick",
        data: buyData.map((item) => ({
          x: new Date(item.date).valueOf(),
          o: item.open,
          h: item.high,
          l: item.low,
          c: item.close,
        })),
        color: {
          up: "#00C853",
          down: "#00C853",
          unchanged: "#00C853",
        },
      });
    }

    if (showSell) {
      datasets.push({
        label: "Sell",
        type: "candlestick",
        data: sellData.map((item) => ({
          x: new Date(item.date).valueOf(),
          o: item.open,
          h: item.high,
          l: item.low,
          c: item.close,
        })),
        color: {
          up: "#D50000",
          down: "#D50000",
          unchanged: "#D50000",
        },
      });
    }

    datasets.push({
      type: "bar",
      label: "Volume",
      data: stockData.map((item) => ({
        x: new Date(item.date).valueOf(),
        y: item.volume,
      })),
      yAxisID: "volume",
      backgroundColor: "rgba(79, 70, 229, 0.3)",
      borderWidth: 0,
    });

    const chart = new Chart(ctx, {
      type: "candlestick",
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "nearest", intersect: false },
        elements: { candlestick: { barThickness: "flex" } },
        scales: {
          x: {
            type: "timeseries",
            time: { unit: "month", tooltipFormat: "dd MMM yyyy" },
            grid: { display: false },
            ticks: { color: "#999", maxRotation: 0, autoSkip: true },
          },
          y: {
            beginAtZero: false,
            grid: { color: "rgba(200,200,200,0.2)" },
            ticks: { color: "#aaa" },
          },
          volume: {
            position: "right",
            beginAtZero: true,
            grid: { display: false },
            ticks: {
              color: "#999",
              callback: (val) => `${(val / 1_000_000).toFixed(0)}M`,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            labels: {
              color: "#aaa",
              filter: (item) =>
                item.text !== "Stock Candlestick" && item.text !== "",
            },
          },
          tooltip: {
            enabled: true,
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(0,0,0,0.85)",
            titleColor: "#fff",
            bodyColor: "#fff",
            borderColor: "#4F46E5",
            borderWidth: 1,
            callbacks: {
              label: function (context) {
                const raw = context.raw || {};
                const label = context.dataset.label || "";
                if (label === "Buy" || label === "Sell") {
                  const { o, h, l, c } = raw;
                  if (o && h && l && c)
                    return `O: ${o.toFixed(2)} | H: ${h.toFixed(
                      2
                    )} | L: ${l.toFixed(2)} | C: ${c.toFixed(2)}`;
                }
                if (label === "Volume") {
                  const volumeValue =
                    raw.volume || context.parsed?.y || context.formattedValue;
                  if (volumeValue)
                    return `Volume: ${Number(volumeValue).toLocaleString()}`;
                }
                return null;
              },
            },
          },
          zoom: {
            pan: { enabled: true, mode: "x" },
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: "x",
            },
            limits: { x: { minRange: 3 * 24 * 60 * 60 * 1000 } },
          },
        },
      },
    });

    window.myCandleChart = chart;

    const handleMouseMove = (evt) => {
      if (!chart || !chart.canvas || chart._destroyed) return;
      const chartArea = chart.chartArea;
      const ctx = chart.ctx;
      if (
        evt.offsetX >= chartArea.left &&
        evt.offsetX <= chartArea.right &&
        evt.offsetY >= chartArea.top &&
        evt.offsetY <= chartArea.bottom
      ) {
        chart.update("none");
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(evt.offsetX, chartArea.top);
        ctx.lineTo(evt.offsetX, chartArea.bottom);
        ctx.strokeStyle = "#4F46E5";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      } else {
        chart.update("none");
      }
    };

    ctx.canvas.addEventListener("mousemove", handleMouseMove);

    return () => {
      ctx.canvas.removeEventListener("mousemove", handleMouseMove);
      if (window.myCandleChart) {
        window.myCandleChart.destroy();
        window.myCandleChart = null;
      }
    };
  }, [stockData, showBuy, showSell]);

  return (
    <div style={{ width: "100%", height: "520px" }}>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <button
          onClick={() => setShowBuy(!showBuy)}
          style={{
            backgroundColor: showBuy ? "#00C853" : "#333",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {showBuy ? "Hide Buy" : "Show Buy"}
        </button>
        <button
          onClick={() => setShowSell(!showSell)}
          style={{
            backgroundColor: showSell ? "#D50000" : "#333",
            color: "white",
            border: "none",
            padding: "6px 12px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {showSell ? "Hide Sell" : "Show Sell"}
        </button>
      </div>
      <canvas id="candlestick-chart" ref={chartRef}></canvas>
    </div>
  );
}

export default CandlestickChart;