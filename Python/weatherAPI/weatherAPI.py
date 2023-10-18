import requests

# Replace 'YOUR_API_KEY' with your actual API key
api_key = '52b442b54ab24faab54f7304b97563c4'

# Construct the API URL with query parameters
base_url = 'https://api.weatherbit.io/v2.0/current'
params = {
    'lat': 35.7796,  # Replace with your latitude
    'lon': -78.6382,  # Replace with your longitude
    'key': api_key
}

response = requests.get(base_url, params=params)

# Check if the request was successful (status code 200)
if response.status_code == 200:
    data = response.json()
    # Process the data as needed
else:
    print(f"Error: {response.status_code}")
