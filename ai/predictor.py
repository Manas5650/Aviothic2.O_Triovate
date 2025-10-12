import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import pickle
from datetime import datetime, timedelta

# ✅ Train karne ke liye function
def train_model():
    # Sample dummy data (baad me live stock se replace karenge)
    dates = pd.date_range(start="2024-01-01", periods=300)
    close_prices = np.linspace(100, 250, 300) + np.random.normal(0, 5, 300)
    
    df = pd.DataFrame({"date": dates, "close": close_prices})
    df["t"] = np.arange(len(df))

    X = df[["t"]]
    y = df["close"]

    model = LinearRegression()
    model.fit(X, y)

    with open("ai/model.pkl", "wb") as f:
        pickle.dump(model, f)

    print("✅ Model trained and saved successfully!")


# ✅ Predict karne ke liye function
def predict_next_days(n_days=30):
    with open("ai/model.pkl", "rb") as f:
        model = pickle.load(f)

    last_t = 300
    future_t = np.arange(last_t + 1, last_t + n_days + 1).reshape(-1, 1)
    predicted_prices = model.predict(future_t)

    future_dates = [datetime.now() + timedelta(days=i) for i in range(n_days)]

    return pd.DataFrame({
        "date": future_dates,
        "predicted_close": predicted_prices
    })