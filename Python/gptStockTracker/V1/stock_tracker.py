"""
Phase 1: Stock Data Fetcher with Fallback

This script fetches real-time stock data using the yfinance library.
It:
  - Retrieves current market data for a set list of stocks.
  - Uses the previous close as a fallback when the live price (regularMarketPrice) is unavailable.
  - Logs key information (including any errors) to a file.
  - Runs continuously, fetching data approximately every 15 minutes.
"""

import yfinance as yf
import time
import logging
from datetime import datetime

# Configure logging to output to a file with timestamps.
logging.basicConfig(
    filename='stock_data.log',
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s'
)

def fetch_stock_data(symbols):
    """
    Fetch stock data for each symbol provided.
    
    Args:
        symbols (list): A list of stock ticker symbols (e.g., ["AAPL", "GOOGL", "MSFT"]).
    
    Returns:
        dict: A dictionary mapping each symbol to its computed current price and raw info.
    """
    data = {}
    for symbol in symbols:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            current_price = info.get('regularMarketPrice')
            # If live price isn't available, fall back to previous close.
            if current_price is None:
                fallback_price = info.get('previousClose')
                if fallback_price is not None:
                    current_price = fallback_price
                    logging.info(f"Market closed for {symbol}; falling back to previousClose: {current_price}")
                else:
                    current_price = 'N/A'
                    logging.info(f"No available price data for {symbol}.")
            else:
                logging.info(f"Fetched live data for {symbol}: price = {current_price}")
            data[symbol] = {"price": current_price, "info": info}
        except Exception as e:
            logging.error(f"Error fetching data for {symbol}: {e}")
            data[symbol] = {"price": 'N/A', "info": {}}
    return data

def main():
    # Define the list of stock symbols to track.
    symbols = ["AAPL", "GOOGL", "MSFT"]
    
    # Set update interval to 15 minutes (15 minutes * 60 seconds).
    update_interval = 15 * 60

    logging.info("Starting the Stock Data Fetcher.")
    while True:
        now = datetime.now()
        logging.info("Starting a new data fetch cycle.")
        
        # Fetch data for the specified symbols.
        stock_data = fetch_stock_data(symbols)
        
        # Display the fetched data on the console.
        print(f"\nData fetched at {now.strftime('%Y-%m-%d %H:%M:%S')}:")
        for symbol, data in stock_data.items():
            price = data.get("price", "N/A")
            print(f"  {symbol}: {price}")
        
        logging.info("Data fetch cycle complete. Sleeping until next cycle.")
        # Wait for the next update interval.
        time.sleep(update_interval)

if __name__ == "__main__":
    main()
