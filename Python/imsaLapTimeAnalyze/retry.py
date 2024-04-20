import json
import numpy as np
import matplotlib.pyplot as plt
from tkinter import Tk, StringVar, OptionMenu, Button, Label, Frame
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg

# Load JSON data from file
with open('data.json', 'r') as file:
    data = json.load(file)

# Extract all unique car classes
car_classes = set(participant['class'] for participant in data['participants'])
print (car_classes)

def get_drivers_in_class(selected_class):
    drivers = []
    for participant in data['participants']:
        if participant['class'] == selected_class:
            for driver in participant['drivers']:
                name = f"{driver['firstname']} {driver['surname']}"
                drivers.append(name)
    return drivers

def plot_histogram(selected_class, selected_driver):
    # Find the car number and driver number for the selected driver
    car_number = None
    driver_number = None
    driver_lap_times = []

    for participant in data['participants']:
        if participant['class'] == selected_class:
            for driver in participant['drivers']:
                if f"{driver['firstname']} {driver['surname']}" == selected_driver:
                    car_number = participant['number']
                    driver_number = driver['number']
                    break
            if car_number and driver_number:
                break

    # Extract all lap times for the selected driver and filter out laps more than 5 seconds slower than the fastest
    for participant in data['participants']:
        if participant['number'] == car_number:
            for lap in participant.get('laps', []):
                if lap['driver_number'] == str(driver_number):
                    lap_time_seconds = sum(float(x) * 60 ** i for i, x in enumerate(reversed(lap['time'].split(':'))))
                    driver_lap_times.append(lap_time_seconds)

    # Find the fastest lap time for the selected driver
    fastest_lap_time = min(driver_lap_times)

    # Filter out lap times more than 5 seconds slower than the fastest lap
    filtered_lap_times = [lap_time for lap_time in driver_lap_times if lap_time - fastest_lap_time <= 5]

    # Define the bins with a width of 0.25 seconds
    bins = np.arange(min(filtered_lap_times), max(filtered_lap_times) + 0.25, 0.25)

    # Create histogram
    plt.hist(filtered_lap_times, bins=bins, edgecolor='black')
    plt.title(f'Histogram of Lap Times for {selected_driver}')
    plt.xlabel('Lap Time (seconds)')
    plt.ylabel('Number of Laps')
    plt.grid(True)
    plt.show()

def on_class_selected(*args):
    selected_class = class_var.get()
    drivers_in_class = get_drivers_in_class(selected_class)
    driver_var.set(drivers_in_class[0])
    driver_menu['menu'].delete(0, 'end')
    for driver in drivers_in_class:
        driver_menu['menu'].add_command(label=driver, command=lambda d=driver: driver_var.set(d))

# Create Tkinter window
root = Tk()
root.title("Driver Lap Time Histogram")

# Create a frame to hold widgets
frame = Frame(root)
frame.pack(padx=10, pady=10)

# Dropdown menu for selecting the car class
class_var = StringVar()
class_var.set(list(car_classes)[0])  # Set default value
class_var.trace_add("write", on_class_selected)  # Call on_class_selected when the selection changes
class_dropdown = OptionMenu(frame, class_var, *car_classes)
class_dropdown.pack(side="left", padx=5)

# Dropdown menu for selecting the driver
driver_var = StringVar()
driver_var.set("")  # Set default value
driver_menu = OptionMenu(frame, driver_var, "")
driver_menu.pack(side="left", padx=5)

# Create a button to plot the histogram
plot_button = Button(frame, text="Plot Histogram", command=lambda: plot_histogram(class_var.get(), driver_var.get()))
plot_button.pack(side="left", padx=5)

# Display the window
root.mainloop()
