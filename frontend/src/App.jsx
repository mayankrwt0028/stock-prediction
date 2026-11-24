
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import "./App.css";

function App() {
  const [symbol, setSymbol] = useState("RELIANCE");
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError("");
      setStockData([]);

      const response = await fetch(
        `http://localhost:5000/api/stocks/${symbol}/history`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to fetch stock data");
      }

      const sortedData = result.data
        .map((item) => ({
          ...item,
          close: Number(item.close)
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setStockData(sortedData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const prices = stockData.map((item) => item.close);

  const latestPrice = prices.length
    ? prices[prices.length - 1]
    : 0;

  const highestPrice = prices.length
    ? Math.max(...prices)
    : 0;

  const lowestPrice = prices.length
    ? Math.min(...prices)
    : 0;

  // Next session estimate using the last 5 closing prices
  const recentPrices = prices.slice(-5);

  const predictedPrice =
    recentPrices.length === 5
      ? recentPrices.reduce((total, price) => total + price, 0) / 5
      : null;

  // Historical predictions using previous 5 trading sessions
  const comparisonData = stockData.slice(5).map((item, index) => {
    const actualIndex = index + 5;

    const previousFivePrices = prices.slice(
      actualIndex - 5,
      actualIndex
    );

    const predicted =
      previousFivePrices.reduce((total, price) => total + price, 0) / 5;

    return {
      date: item.date,
      actual: item.close,
      predicted: Number(predicted.toFixed(2))
    };
  });

  // Calculate average absolute error
  const averageError = comparisonData.length
    ? comparisonData.reduce(
        (total, item) => total + Math.abs(item.actual - item.predicted),
        0
      ) / comparisonData.length
    : null;

  // Calculate directional accuracy
  const correctDirections = comparisonData.filter((item, index) => {
    const previousClose = stockData[index + 4].close;

    const actualDirection = Math.sign(item.actual - previousClose);
    const predictedDirection = Math.sign(item.predicted - previousClose);

    return actualDirection === predictedDirection;
  }).length;

  const directionAccuracy = comparisonData.length
    ? (correctDirections / comparisonData.length) * 100
    : null;

  const recentComparisons = comparisonData.slice(-10).reverse();

  return (
    <div className="app">

      <header className="header">
        <h2>StockWise India</h2>
        <p>Indian Stock Market Analysis</p>
      </header>

      <main className="container">

        <h1>Stock Dashboard</h1>

        <p className="subtitle">
          View historical stock prices and analyze market trends.
        </p>

        <div className="search-box">

          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            <option value="RELIANCE">Reliance</option>
            <option value="TCS">TCS</option>
            <option value="INFY">Infosys</option>
            <option value="HDFCBANK">HDFC Bank</option>
            <option value="ICICIBANK">ICICI Bank</option>
          </select>

          <button onClick={fetchStockData} disabled={loading}>
            {loading ? "Loading..." : "Fetch Stock"}
          </button>

        </div>

        {error && <p className="error">{error}</p>}

        {stockData.length > 0 && (
          <>

            <div className="price-cards">

              <div className="card">
                <p>Latest Close</p>
                <h2>₹{latestPrice.toFixed(2)}</h2>
              </div>

              <div className="card">
                <p>Highest Price</p>
                <h2>₹{highestPrice.toFixed(2)}</h2>
              </div>

              <div className="card">
                <p>Lowest Price</p>
                <h2>₹{lowestPrice.toFixed(2)}</h2>
              </div>

              <div className="card prediction-card">
                <p>Next Session Estimate (5-day SMA)</p>

                {predictedPrice !== null ? (
                  <h2>₹{predictedPrice.toFixed(2)}</h2>
                ) : (
                  <h3>Not enough data</h3>
                )}
              </div>

            </div>

            <div className="chart-card">

              <h2>{symbol} Historical Price</h2>

              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={stockData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="close"
                    name="Actual Close"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>

            </div>

            <div className="chart-card comparison-section">

              <h2>Actual vs Predicted Price</h2>

              <p className="subtitle">
                Historical 5-day moving average comparison.
              </p>

              {comparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                    />

                    <YAxis />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="actual"
                      name="Actual Price"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="predicted"
                      name="Predicted Price"
                      stroke="#e58a21"
                      strokeWidth={2}
                      dot={false}
                    />

                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p>Not enough historical data for comparison.</p>
              )}

              <div className="price-cards">

                <div className="card">
                  <p>Average Absolute Error</p>
                  <h2>
                    {averageError !== null
                      ? `₹${averageError.toFixed(2)}`
                      : "N/A"}
                  </h2>
                </div>

                <div className="card">
                  <p>Directional Accuracy</p>
                  <h2>
                    {directionAccuracy !== null
                      ? `${directionAccuracy.toFixed(2)}%`
                      : "N/A"}
                  </h2>
                </div>

              </div>

              <h3>Recent Prediction Results</h3>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Actual Price</th>
                      <th>Predicted Price</th>
                      <th>Error</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentComparisons.map((item) => (
                      <tr key={item.date}>
                        <td>{item.date}</td>
                        <td>₹{item.actual.toFixed(2)}</td>
                        <td>₹{item.predicted.toFixed(2)}</td>
                        <td>
                          ₹{Math.abs(
                            item.actual - item.predicted
                          ).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

            <p className="prediction-note">
              Predictions are calculated using the previous five
              trading sessions. Historical performance does not
              guarantee future results. This tool is for learning
              purposes, not financial advice.
            </p>

          </>
        )}

        {!stockData.length && !loading && !error && (
          <div className="empty-message">
            <h3>No stock data loaded</h3>
            <p>Select a stock and click Fetch Stock.</p>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
