import json
import logging
import configparser
import requests
from rauth import OAuth1Service
from logging.handlers import RotatingFileHandler
#from accounts.accounts import Accounts

# loading configuration file
config = configparser.ConfigParser()
config.read('config.ini')

# logger settings
logger = logging.getLogger('my_logger')
logger.setLevel(logging.DEBUG)
handler = RotatingFileHandler("python_client.log", maxBytes=5*1024*1024, backupCount=3)
FORMAT = "%(asctime)-15s %(message)s"
fmt = logging.Formatter(FORMAT, datefmt='%m/%d/%Y %I:%M:%S %p')
handler.setFormatter(fmt)
logger.addHandler(handler)

def oauth(consumer_key, consumer_secret):
    """Allows user authorization for the sample application with OAuth 1"""
    etrade = OAuth1Service(
        name="etrade",
        consumer_key=consumer_key,
        consumer_secret=consumer_secret,
        request_token_url="https://api.etrade.com/oauth/request_token",
        access_token_url="https://api.etrade.com/oauth/access_token",
        authorize_url="https://us.etrade.com/e/t/etws/authorize?key={}&token={}",
        base_url="https://api.etrade.com")

    # Step 1: Get OAuth 1 request token and secret
    request_token, request_token_secret = etrade.get_request_token(
        params={"oauth_callback": "oob", "format": "json"})

    # Step 2: Go through the authentication flow. Login to E*TRADE.
    # After you login, the page will provide a verification code to enter.
    authorize_url = etrade.authorize_url.format(etrade.consumer_key, request_token)
    print("Please go to the following URL in your browser and authorize the application:")
    print(authorize_url)
    text_code = input("Please enter the verification code from the browser: ")

    # Step 3: Exchange the authorized request token for an authenticated OAuth 1 session
    session = etrade.get_auth_session(request_token,
                                      request_token_secret,
                                      params={"oauth_verifier": text_code})
    
    return session

def get_account_balance(session, base_url):
    """
    Retrieves the total balance of the user's E*TRADE account.
    :param session: authenticated session
    :param base_url: base URL for E*TRADE API
    """
    # E*TRADE API endpoint for account list
    api_url = f"{base_url}/v1/accounts/list"
    
    # Make request to E*TRADE API to get account list
    response = session.get(api_url)
    
    # Check if request was successful
    if response.status_code == 200:
        # Parse JSON response
        account_info = response.json()
        
        # Assuming the response contains a list of accounts, you might need to choose the correct one
        # For example, you might loop through the accounts to find the one you want
        
        # Get the total balance of the selected account
        total_balance = account_info['Accounts'][0]['balance']
        
        return total_balance
    else:
        print("Error:", response.status_code)

if __name__ == "__main__":
    # Consumer Key and Secret from your E*TRADE developer account
    consumer_key = 'd06a0e4c68e0b5a3ebbc1f8fcfea99f1'
    consumer_secret = '638e506a9a15184ff66cfbfcdf4d458c2a131ac60484925276f8c8fc4adca64a'
    
    # Get authenticated session
    session = oauth(consumer_key, consumer_secret)
    
    # Base URL for E*TRADE API (sandbox or production)
    base_url = 'https://api.etrade.com'
    
    # Get total balance of the account
    total_balance = get_account_balance(session, base_url)
    
    # Display total balance
    print("Total Balance:", total_balance)
