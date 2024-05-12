import json
import matplotlib.pyplot as plt

# Load JSON data from file
with open('/Users/maxfaulkner/Documents/GitHub Repositories/python/Python/imsaLapTimeAnalyze/data.json', 'r') as file:
    data = json.load(file)

# Extract the driver's name for filtering
driver_name = "Stevan McAleer"

# Find the driver number for the specified driver
driver_number = None
for participant in data['participants']:
    for driver in participant['drivers']:
        if f"{driver['firstname']} {driver['surname']}" == driver_name:
            driver_number = driver['number']
            break
    if driver_number:
        break

# Check if the driver participated in the session
driver_participated = False
for participant in data['participants']:
    for driver in participant['drivers']:
        if driver['number'] == driver_number:
            driver_participated = True
            break
    if driver_participated:
        break

# If the driver participated, proceed with lap time analysis
if driver_participated:
    # Initialize list to store lap times for the specified driver
    driver_lap_times = []

    # Initialize variable to store the fastest lap time
    fastest_lap_time = float('inf')
    print (data['participants'])
    # Iterate through laps to find the fastest lap time
    for participant in data['participants']:
        if 'laps' in participant:  # Check if 'laps' key exists
            for lap in participant['laps']:
                if lap['driver_number'] == driver_number:
                    lap_time_split = lap['time'].split(':')
                    lap_time_seconds = int(lap_time_split[0]) * 60 + float(lap_time_split[1])
                    if lap_time_seconds < fastest_lap_time:
                        fastest_lap_time = lap_time_seconds

    # Iterate through laps to collect lap times for the specified driver
    for participant in data['participants']:
        if 'laps' in participant:  # Check if 'laps' key exists
            for lap in participant['laps']:
                if lap['driver_number'] == driver_number:
                    lap_time_split = lap['time'].split(':')
                    lap_time_seconds = int(lap_time_split[0]) * 60 + float(lap_time_split[1])
                    if lap_time_seconds - fastest_lap_time <= 5:
                        driver_lap_times.append(lap_time_seconds)

    # Plot histogram of lap times if driver_lap_times is not empty
    if driver_lap_times:
        plt.hist(driver_lap_times, bins=int((max(driver_lap_times) - min(driver_lap_times)) / 0.5), color='skyblue', edgecolor='black')
        plt.xlabel('Lap Time (seconds)')
        plt.ylabel('Frequency')
        plt.title(f'Lap Time Histogram for Driver {driver_number}')
        plt.grid(True)
        plt.show()
    else:
        print("No valid lap times found for the specified driver.")
else:
    print("Driver did not participate in the session.")
