from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import numpy as np
from sklearn.linear_model import LinearRegression
import pandas as pd
import os
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["https://clever-jelly-578415.netlify.app"], "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})

@app.route('/predict', methods=['GET'])
def predict():
    try:
        # Get query parameters
        symbol = request.args.get('symbol', 'TSLA').upper()
        days = int(request.args.get('days', 10))

        # ✅ Fetch last 6 months stock data
        data = yf.download(symbol, period='6mo', interval='1d', progress=False)

        if data.empty:
            return jsonify({"success": False, "error": f"No data found for {symbol}"}), 404

        # Prepare data
        data.reset_index(inplace=True)
        data['Day'] = np.arange(len(data))
        X = data[['Day']]
        y = data['Close']

        # ✅ Train Linear Regression model
        model = LinearRegression()
        model.fit(X, y)

        # Predict next n days
        last_day = X['Day'].iloc[-1]
        future_days = np.arange(last_day + 1, last_day + days + 1).reshape(-1, 1)
        predictions = model.predict(future_days)

        # ✅ Format prediction data
        prediction_list = [
            {"day": int(i + 1), "predicted_close": round(float(pred.item()), 2)}
            for i, pred in enumerate(predictions)
        ]

        # ✅ Determine trend
        start_price = float(prediction_list[0]["predicted_close"])
        end_price = float(prediction_list[-1]["predicted_close"])
        if end_price > start_price:
            trend = "bullish"
        elif end_price < start_price:
            trend = "bearish"
        else:
            trend = "neutral"

        # Confidence (mocked for now)
        confidence = round(np.random.uniform(90, 98), 2)

        return jsonify({
            "success": True,
            "symbol": symbol,
            "days": days,
            "trend": trend,
            "confidence": confidence,
            "predictions": prediction_list
        }), 200

    except Exception as e:
        print(f"Error in /predict: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
@app.route('/api/stock/<symbol>', methods=['GET'])
def stock_info(symbol):
    try:
        stock = yf.Ticker(symbol)

        # ✅ Try safer fallback method
        info = stock.fast_info if hasattr(stock, "fast_info") else {}

        # Agar info empty hai, fallback karo normal info pe
        if not info:
            info = getattr(stock, "info", {})

        # Agar dono hi empty hain
        if not info:
            return jsonify({"error": f"No data found for {symbol}"}), 404

        # ✅ Safely extract values
        data = {
            "symbol": symbol,
            "shortName": info.get("shortName", symbol),
            "currentPrice": info.get("last_price") or info.get("currentPrice") or 0,
            "currency": info.get("currency", "USD"),
            "open": info.get("open", 0),
            "high": info.get("dayHigh") or info.get("high") or 0,
            "low": info.get("dayLow") or info.get("low") or 0,
            "volume": info.get("volume", 0),
            "marketCap": info.get("marketCap", 0),
            "fiftyTwoWeekHigh": info.get("yearHigh") or info.get("fiftyTwoWeekHigh") or 0,
            "fiftyTwoWeekLow": info.get("yearLow") or info.get("fiftyTwoWeekLow") or 0,
            "changePercent": info.get("regularMarketChangePercent") or 0,
            "marketTime": info.get("regularMarketTime", None)
        }

        return jsonify(data), 200

    except Exception as e:
        print("Error in /api/stock/<symbol>:", e)
        return jsonify({"error": str(e)}), 500
@app.route('/api/stock/history/<symbol>', methods=['GET'])
def stock_history(symbol):
    try:
        from_date = request.args.get('from', '2024-09-01')
        to_date = request.args.get('to', '2024-09-30')

        # ✅ Fetch data
        data = yf.download(symbol, start=from_date, end=to_date, interval='1d', progress=False)

        if data.empty:
            return jsonify({"message": "No data found"}), 404

        # ✅ Reset index to make Date a normal column
        data.reset_index(inplace=True)

        # ✅ Handle both 'Date' and possible 'Ticker' issues
        date_column = None
        for col in data.columns:
            if 'Date' in col:
                date_column = col
                break
        if date_column is None:
            # fallback if date column missing
            date_column = data.columns[0]

        # ✅ Prepare clean JSON
        history = []
        for _, row in data.iterrows():
            date_value = str(row[date_column]).split()[0] if pd.notna(row[date_column]) else "N/A"
            history.append({
                "date": date_value,
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"])
            })

        return jsonify({
            "symbol": symbol,
            "history": history
        }), 200

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)