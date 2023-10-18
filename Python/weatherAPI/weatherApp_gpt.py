import requests
import tkinter as tk

# Weatherbit API key
api_key = "52b442b54ab24faab54f7304b97563c4"

# Function to fetch and display weather data
def fetch_weather_data(location):
    endpoint = "https://api.weatherbit.io/v2.0/current"
    params = {"city": location, "key": api_key}
    response = requests.get(endpoint, params=params)

    if response.status_code == 200:
        data = response.json()
        current_weather_label.config(text=f"Current Weather in {location}: {data['data'][0]['weather']['description']}")
        humidity_label.config(text=f"Humidity: {data['data'][0]['rh']}%")
        wind_speed_label.config(text=f"Wind Speed: {data['data'][0]['wind_spd']} m/s")

def fetch_forecast_data(location):
    endpoint = "https://api.weatherbit.io/v2.0/forecast/daily"
    params = {"city": location, "key": api_key, "days": 5}
    response = requests.get(endpoint, params=params)

    if response.status_code == 200:
        data = response.json()
        forecast_text.config(state="normal")
        forecast_text.delete("1.0", tk.END)
        for forecast in data["data"]:
            forecast_text.insert(tk.END, f"Date: {forecast['datetime']}\n")
            forecast_text.insert(tk.END, f"Description: {forecast['weather']['description']}\n")
            forecast_text.insert(tk.END, f"Max Temperature: {forecast['max_temp']}°C\n")
            forecast_text.insert(tk.END, f"Min Temperature: {forecast['min_temp']}°C\n\n")
        forecast_text.config(state="disabled")

# Create the main window
root = tk.Tk()
root.title("Weather App")

# Create and place widgets
location_entry = tk.Entry(root)
location_entry.pack()

fetch_button = tk.Button(root, text="Fetch Weather", command=lambda: fetch_weather_data(location_entry.get()))
fetch_button.pack()

current_weather_label = tk.Label(root, text="")
current_weather_label.pack()

forecast_text = tk.Text(root, height=30, width=150, state="disabled")
forecast_text.pack()

humidity_label = tk.Label(root, text="")
humidity_label.pack()

wind_speed_label = tk.Label(root, text="")
wind_speed_label.pack()

# Button to fetch forecast data
fetch_forecast_button = tk.Button(root, text="Fetch 5-Day Forecast", command=lambda: fetch_forecast_data(location_entry.get()))
fetch_forecast_button.pack()

root.mainloop()
