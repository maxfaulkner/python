import requests
import urllib3
from requests_oauthlib import OAuth1Session

# Set TLS version to 1.2
urllib3.util.ssl_.DEFAULT_CIPHERS = 'ALL:@SECLEVEL=1'

# Your OAuth credentials
consumer_key = 'd06a0e4c68e0b5a3ebbc1f8fcfea99f1'
consumer_secret = '638e506a9a15184ff66cfbfcdf4d458c2a131ac60484925276f8c8fc4adca64a'

# Callback URL registered with E*TRADE
callback_uri = 'https://your_callback_url.com'  # Replace with your actual callback URL

# E*TRADE API endpoints
request_token_url = 'https://api.etrade.com/oauth/request_token'
authorize_url = 'https://us.etrade.com/e/t/etws/authorize'
access_token_url = 'https://api.etrade.com/oauth/access_token'
account_balances_url = 'https://api.etrade.com/v1/accounts/459615841/balance.json'  # Replace YOUR_ACCOUNT_ID with your actual account ID

# Step 1: Get a request token
oauth = OAuth1Session(consumer_key, client_secret=consumer_secret, callback_uri='oob')
fetch_response = oauth.fetch_request_token(request_token_url)

# Step 2: Redirect user for authorization
authorization_url = oauth.authorization_url(authorize_url)
print('Please go here and authorize:', authorization_url)

# After the user has authorized the application, E*TRADE will redirect back to the callback URL with a verifier code.
verifier_code = input('Paste the verifier code here:')

# Step 3: Parse the response
oauth.parse_authorization_response(verifier_code)
oauth.fetch_access_token(access_token_url)

# Step 4: Make the API request to get account balances
response = oauth.get(account_balances_url)

# Check if the request was successful
if response.status_code == 200:
    # Extract the total value of the account from the response
    total_value = response.json()['BalanceResponse'][0]['TotalAccountValue']
    print("Total account value:", total_value)
else:
    print("Error:", response.status_code)
    print("Response Body:", response.text)
