import requests

# Replace 'your_api_key' with your actual Weatherbit API key
api_key = "52b442b54ab24faab54f7304b97563c4"

# Define the location you want to get weather information for
location = "Powell, OH"  # You can specify the city, zip code, or coordinates

# Weatherbit API endpoint for current weather
endpoint = "https://api.weatherbit.io/v2.0/current"

def getCurrentWeather (location):
    # Create the parameters for the request
    params = {
        "city": location,
        "key": api_key,
    }

    # Make the API request
    response = requests.get(endpoint, params=params)

    # Check if the request was successful
    if response.status_code == 200:
        data = response.json()

        # Extract and print relevant weather information
        weather = data["data"][0]
        print(f"Weather in {location}:")
        print(f"Description: {weather['weather']['description']}")
        print(f"Temperature: {weather['temp']}°C")
        print(f"Wind Speed: {weather['wind_spd']} m/s")
    else:
        print("Error: Unable to fetch weather data")

