import serial
import numpy as np
import pyqtgraph as pg
from collections import deque
from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import QTimer

# Define the serial port and baud rate
serial_port = '/dev/cu.usbmodem142401'  # Replace with your serial port
baud_rate = 115200  # Make sure this matches the baud rate of your Arduino

# Set up the serial connection
ser = serial.Serial(serial_port, baud_rate)

# Initialize data storage
max_points = 3000  # Adjusted for a 30-second window
times = deque(maxlen=max_points)
x_vals = deque(maxlen=max_points)
y_vals = deque(maxlen=max_points)
z_vals = deque(maxlen=max_points)

# Create a figure and axes for the plots
app = QApplication([])
win = pg.GraphicsLayoutWidget(show=True, title="Real-Time Plotting")
win.resize(1000, 600)
win.setWindowTitle('Sensor Data')

# Create the plots
plot1 = win.addPlot(title="Time vs xOut")
curve1 = plot1.plot(pen='r')
win.nextRow()
plot2 = win.addPlot(title="Time vs yOut")
curve2 = plot2.plot(pen='g')
win.nextRow()
plot3 = win.addPlot(title="Time vs zOut")
curve3 = plot3.plot(pen='b')

# Improved moving average filter
class RollingAverage:
    def __init__(self, window_size):
        self.window_size = window_size
        self.values = deque(maxlen=window_size)
        self.sum = 0

    def update(self, new_value):
        if len(self.values) == self.window_size:
            self.sum -= self.values[0]
        self.values.append(new_value)
        self.sum += new_value
        return self.sum / len(self.values)

# Initialize rolling averages
window_size = 20
x_ra = RollingAverage(window_size)
y_ra = RollingAverage(window_size)
z_ra = RollingAverage(window_size)

def update_plot():
    try:
        if ser.in_waiting > 0:
            # Read bytes from the serial port
            data_bytes = ser.readline()
            
            # Decode bytes to string
            line = data_bytes.decode('utf-8').strip()
            
            # Split the line into components
            data = line.split(',')
            
            # Ensure we have the correct amount of data
            if len(data) == 4:
                current_time = float(data[0])
                x = float(data[1])
                y = float(data[2])
                z = float(data[3])
                
                # Update rolling averages
                x_avg = x_ra.update(x)
                y_avg = y_ra.update(y)
                z_avg = z_ra.update(z)
                
                # Append data to buffers
                times.append(current_time)
                x_vals.append(x - x_avg)
                y_vals.append(y - y_avg)
                z_vals.append(z - z_avg)
                
                # Limit data to the last 30 seconds (adjust as needed)
                max_time = current_time
                while times[0] < max_time - 30:
                    times.popleft()
                    x_vals.popleft()
                    y_vals.popleft()
                    z_vals.popleft()
                
                # Update the plots with the last 30 seconds of data
                curve1.setData(times, x_vals)
                curve2.setData(times, y_vals)
                curve3.setData(times, z_vals)
                
    except Exception as e:
        print(f"Error in update_plot: {e}")

# Set up a timer for updating plot
plot_timer = QTimer()
plot_timer.timeout.connect(update_plot)
plot_timer.start(50)  # Update every 50 ms

# Start the PyQt event loop
if __name__ == '__main__':
    try:
        app.exec_()
    finally:
        # Ensure the serial connection is closed properly when the script ends
        ser.close()
