from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import numpy as np
from sklearn.linear_model import LinearRegression
import pandas as pd
import os
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["https://stellar-sfogliatella-78a37f.netlify.app"], "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})

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
        info = getattr(stock, "fast_info", {}) or getattr(stock, "info", {})

        if not info:
            return jsonify({"error": f"No data found for {symbol}"}), 404

        # ✅ Safe data extraction
        # ✅ Try to get the most recent available price
        current_price = (
            info.get("regularMarketPrice")
            or info.get("currentPrice")
            or info.get("lastPrice")
            or info.get("previousClose")
            or 0
        )

# 🧠 Fallback: Try from fast_info (more live data)
        try:
            ticker = yf.Ticker(symbol)
            fast_info = ticker.fast_info
            if fast_info and fast_info.get("last_price"):
                current_price = fast_info["last_price"]
        except Exception as e:
            print("⚠ Fast info fallback failed:", e)

        open_price = round(info.get("open", 0) or 0, 2)
        high_price = round(info.get("dayHigh") or info.get("high") or 0, 2)
        low_price = round(info.get("dayLow") or info.get("low") or 0, 2)
        market_cap = info.get("marketCap", 0) or 0

        # ✅ Volume Handling
        volume = (
            info.get("volume")
            or info.get("regularMarketVolume")
            or info.get("totalVolume")
            or 0
        )

        if not volume or volume == 0:
            volume_display = "Data Not Available 📉"
        else:
            if volume >= 1e9:
                volume_display = f"{round(volume / 1e9, 2)}B"
            elif volume >= 1e6:
                volume_display = f"{round(volume / 1e6, 2)}M"
            else:
                volume_display = f"{int(volume):,}"  # comma format (e.g. 125,000)

        fifty_two_high = round(info.get("yearHigh") or info.get("fiftyTwoWeekHigh") or 0, 2)
        fifty_two_low = round(info.get("yearLow") or info.get("fiftyTwoWeekLow") or 0, 2)

        # ✅ Change Percent (previousClose fix)
        previous_close = info.get("previousClose") or info.get("regularMarketPreviousClose") or current_price
        if previous_close and previous_close != 0:
            change_percent = round(((current_price - previous_close) / previous_close) * 100, 2)
        else:
            change_percent = 0.0

        # ✅ Market Cap Formatting
        if market_cap >= 1e12:
            market_cap_display = f"{round(market_cap / 1e12, 2)}T"
        elif market_cap >= 1e9:
            market_cap_display = f"{round(market_cap / 1e9, 2)}B"
        elif market_cap >= 1e6:
            market_cap_display = f"{round(market_cap / 1e6, 2)}M"
        else:
            market_cap_display = str(market_cap)

        # ✅ Final Data Response
        data = {
            "symbol": symbol,
            "shortName": info.get("shortName", symbol),
            "currentPrice": round(current_price, 2),
            "currency": info.get("currency", "INR"),
            "open": open_price,
            "high": high_price,
            "low": low_price,
            "volume": volume_display,
            "marketCap": market_cap_display,
            "fiftyTwoWeekHigh": fifty_two_high,
            "fiftyTwoWeekLow": fifty_two_low,
            "changePercent": change_percent,
            "marketTime": info.get("regularMarketTime", None),
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