const express = require("express");
const yahooFinance = require("yahoo-finance2").default;
const router = express.Router();
const axios = require("axios");
const authMiddleware = require("./middleware/authMiddleware");
// =========================
// 1️⃣ Current Stock Price (Yahoo Finance)
// =========================

router.get("/api/stock/history/:symbol", authMiddleware, async (req, res) => {
  try {
    const symbol = req.params.symbol;
    res.json({ message: `Access granted to ${req.user.email}`, symbol });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const stock = await yahooFinance.quote(symbol);

    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    res.json({
      symbol: stock.symbol,
      shortName: stock.shortName,
      currentPrice: stock.regularMarketPrice,
      change: stock.regularMarketChange,
      changePercent: stock.regularMarketChangePercent,
      marketTime: stock.regularMarketTime,
      currency: stock.currency,
      open: stock.regularMarketOpen,
      high: stock.regularMarketDayHigh,
      low: stock.regularMarketDayLow,
      volume: stock.regularMarketVolume,
      marketCap: stock.marketCap,
      fiftyTwoWeekHigh: stock.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: stock.fiftyTwoWeekLow,
    });
  } catch (error) {
    console.error("Error in current price route:", error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// 2️⃣ Historical Stock Data (Last 30 Days for frontend modal)
// =========================
router.get("/history/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;

    // ✅ Calculate last 30 days automatically
    const today = new Date();
    const from = new Date();
    from.setFullYear(today.getFullYear() - 1);

    // ✅ Fetch from Yahoo Finance
    const data = await yahooFinance.historical(symbol, {
      period1: from.toISOString().split("T")[0],
      period2: today.toISOString().split("T")[0],
      interval: "1d",
    });

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No historical data found" });
    }

    // ✅ Format data
    const formatted = data.map((item) => ({
      date: new Date(item.date).toISOString().split("T")[0],
      close: item.close,
    }));

    res.json({
      success: true,
      symbol,
      totalDays: formatted.length,
      history: formatted,
    });
  } catch (error) {
    console.error("❌ Error fetching last 30-day history:", error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// 3️⃣ Yahoo Chart API — 1 Year Data (used for main chart)
// =========================
// =========================
// 3️⃣ Yahoo Chart API — 1 Year Data (used for main chart)
// =========================
router.get("/chart/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    let { from, to } = req.query;

    // ✅ Default dates if not provided
    const today = new Date();
    const defaultFrom = new Date();
    defaultFrom.setFullYear(today.getFullYear() - 1);

    if (!from) from = defaultFrom.toISOString().split("T")[0];
    if (!to) to = today.toISOString().split("T")[0];

    // ✅ Convert to UNIX timestamps (required by Yahoo Finance API)
    const period1 = Math.floor(new Date(from).getTime() / 1000);
    const period2 = Math.floor(new Date(to).getTime() / 1000);

    // ✅ Fetch chart data
    const result = await yahooFinance.chart(symbol, {
      period1,
      period2,
      interval: "1d",
    });

    if (!result || !result.quotes || result.quotes.length === 0) {
      return res.status(404).json({ message: "No chart data found" });
    }

    // ✅ Format chart data
    const history = result.quotes.map((q) => ({
      date: q.date,
      open: q.open ?? 0,
      high: q.high ?? 0,
      low: q.low ?? 0,
      close: q.close ?? 0,
      volume: q.volume ?? 0,
    }));

    // ✅ Send response
    res.json({
      success: true,
      symbol,
      from,
      to,
      totalPoints: history.length,
      history,
    });
  } catch (error) {
    console.error("❌ Error in Yahoo Chart route:", error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// 4️⃣ Multi-stock Historical Comparison
// =========================
router.get("/multi/history", async (req, res) => {
  try {
    let { symbols, from, to } = req.query;

    if (!symbols) {
      return res.status(400).json({ message: "Symbols are required (comma separated)" });
    }

    const symbolList = symbols.split(",");
    const allData = {};

    for (let sym of symbolList) {
      const result = await yahooFinance.historical(sym, {
        period1: from || "2024-01-01",
        period2: to || new Date().toISOString().split("T")[0],
        interval: "1d",
      });

      allData[sym] = result.map((d) => ({
        date: new Date(d.date).toISOString().split("T")[0],
        close: d.close,
      }));
    }

    res.json({ success: true, symbols: symbolList, data: allData });
  } catch (error) {
    console.error("❌ Error in multi-stock history:", error);
    res.status(500).json({ error: "Failed to fetch multi-stock data" });
  }
});

module.exports = router;