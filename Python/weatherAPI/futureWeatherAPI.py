import requests

# Replace 'your_api_key' with your actual Weatherbit API key
api_key = "52b442b54ab24faab54f7304b97563c4"

# Define the location you want to get the forecast for
location = "Powell, OH"  # You can specify the city, zip code, or coordinates

# Weatherbit API endpoint for 5-day daily forecast
endpoint = "https://api.weatherbit.io/v2.0/forecast/daily"

# Create the parameters for the request
params = {
    "city": location,
    "key": api_key,
    "days": 5,  # Adjust the number of forecast days as needed
}

# Make the API request
response = requests.get(endpoint, params=params)

# Check if the request was successful
if response.status_code == 200:
    data = response.json()

    # Extract and print the daily forecast information
    forecasts = data["data"]
    print(f"5-Day Daily Forecast for {location}:")
    for forecast in forecasts:
        date = forecast["datetime"]
        description = forecast["weather"]["description"]
        max_temp = forecast["max_temp"]
        min_temp = forecast["min_temp"]
        print(f"Date: {date}")
        print(f"Description: {description}")
        print(f"Max Temperature: {max_temp}°C")
        print(f"Min Temperature: {min_temp}°C")
        print("-" * 20)
else:
    print("Error: Unable to fetch forecast data")
