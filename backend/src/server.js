
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;

const ALLOWED_STOCKS = [
  "RELIANCE",
  "TCS",
  "INFY",
  "HDFCBANK",
  "ICICIBANK"
];


app.get("/", (req, res) => {
  res.send("StockWise India API is running");
});


app.get("/api/stocks/:symbol/history", async (req, res) => {
  try {
    const { symbol } = req.params;

    const stockSymbol = symbol.toUpperCase();


    if (!ALLOWED_STOCKS.includes(stockSymbol)) {
      return res.status(400).json({
        success: false,
        message: "Stock symbol is not supported"
      });
    }

    const fromDate = "2025-01-01";

    const apiUrl = `https://api.tejhq.dev/v1/ohlcv/nse/${stockSymbol}?from=${fromDate}`;


    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Unable to fetch stock market data");
    }

    const result = await response.json();

    if (!result.data || result.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No stock data found"
      });
    }


    return res.status(200).json({
      success: true,
      symbol: stockSymbol,
      totalRecords: result.data.length,
      data: result.data
    });

  } catch (error) {
    console.error("Stock API Error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong"
    });
  }
});

app.listen(PORT, () => {
  console.log(`StockWise backend running on port ${PORT}`);
});
