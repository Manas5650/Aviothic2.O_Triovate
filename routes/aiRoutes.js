const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/predict", async (req, res) => {
  try {
    const { days } = req.query;
    const response = await axios.get(`http://127.0.0.1:5001/predict?days=${days || 5}`);
    res.json(response.data);
  } catch (error) {
    console.error("Error in AI prediction route:", error.message);
    res.status(500).json({ error: "Failed to fetch prediction" });
  }
});

module.exports = router;