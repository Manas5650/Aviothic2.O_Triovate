import React, { useState } from "react";
import axios from "axios";

function PredictChart({ stockData }) {
  const [predictions, setPredictions] = useState([]);

  const handlePredict = async () => {
    const res = await axios.post("http://localhost:5000/api/ai/predict", {
      stockData,
    });
    setPredictions(res.data.predictions);
  };

  return (
    <div>
      <button onClick={handlePredict}>🔮 Predict Next 10 Days</button>
      {predictions.length > 0 && (
        <ul>
          {predictions.map((p, i) => (
            <li key={i}>{p.date}: ${p.predicted_price}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PredictChart;
