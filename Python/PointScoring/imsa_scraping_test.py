import requests
from bs4 import BeautifulSoup

def find_data_links(url):
    # Send a GET request to the webpage
    res = requests.get(url)
    
    # Parse the webpage's content
    soup = BeautifulSoup(res.text, 'html.parser')
    
    # Find all 'a' tags (which define hyperlinks) on the webpage
    links = soup.find_all('a')
    
    # Data file extensions that you're interested in
    extensions = ['.csv', '.json', '.xml', '.xls', '.xlsx', '.txt', '.pdf']

    # Filter for hyperlinks ending with one of the data file extensions
    data_links = [link.get('href') for link in links if any(link.get('href', '').endswith(ext) for ext in extensions)]
    
    return data_links

# Use the function
url = "http://results.imsa.com" # Replace with your actual URL
data_links = find_data_links(url)

if data_links:
    for link in data_links:
        print(link)
else:
    print("NOOOOO!!!")
