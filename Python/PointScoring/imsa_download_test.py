# Get user input
year = input("Enter the year: ")
race_number = input("Enter the race number: ")
location = input("Enter the location: ").replace(' ', '%20')
series = input("Enter the series: ").replace(' ', '%20')
date_and_session = input("Enter the date and session type: ").replace(' ', '%20')
results = input("Enter the results type: ").replace(' ', '%20')

# Assemble the URL
url = f"http://results.imsa.com/Results/23_{year}/{race_number}_{location}/01_{series}/{date_and_session}/{results}.CSV"
#http://results.imsa.com/Results/23_2023/13_Canadian%20Tire%20Motorsport%20Park/01_IMSA%20WeatherTech%20SportsCar%20Championship/202307091205_Race/03_Results_Race_Provisional.CSV
print(url)