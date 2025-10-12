const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const stockRoutes = require("./routes/stockRoutes");
const mongoose = require("mongoose");

// Yahoo Finance import + suppress notices
const yahooFinance = require("yahoo-finance2").default;
yahooFinance.suppressNotices(["yahooSurvey", "ripHistorical"]);

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/ai", require("./routes/aiRoutes"));
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log("Mongo Error:", err));

// Default route
app.get("/", (req, res) => {
    res.send("API is running...");
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/stock", require("./routes/stockRoutes"));

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));