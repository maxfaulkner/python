import serial
import time
import numpy as np
import pyqtgraph as pg
from collections import deque
from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import QTimer
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define the serial port and baud rate
serial_port = '/dev/cu.usbmodem142401'  # Replace with your serial port
baud_rate = 115200  # Make sure this matches the baud rate of your Arduino

# Set up the serial connection
ser = serial.Serial(serial_port, baud_rate)

# Initialize data storage
max_points = 1000
times = np.zeros(max_points)
x_vals = np.zeros(max_points)
y_vals = np.zeros(max_points)
z_vals = np.zeros(max_points)
ptr = 0

# Buffer for storing data before writing to file
buffer = []

# HDF5 file setup
# hdf5_filename = 'sensor_data.h5'
# hdf5_file = h5py.File(hdf5_filename, 'a')
# hdf5_dataset = hdf5_file.create_dataset('sensor_data', (0, 4), maxshape=(None, 4))

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

def downsample(data, target_len):
    if len(data) > target_len:
        return data[::len(data)//target_len]
    return data

def update_plot():
    global ptr
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
                
                # Append data to buffer
                buffer.append([current_time, x, y, z])
                
                # Update rolling averages
                x_avg = x_ra.update(x)
                y_avg = y_ra.update(y)
                z_avg = z_ra.update(z)
                
                # Update data arrays
                times[ptr] = current_time
                x_vals[ptr] = x - x_avg
                y_vals[ptr] = y - y_avg
                z_vals[ptr] = z - z_avg
                ptr = (ptr + 1) % max_points
                
                # Update the plots with downsampling
                target_points = 500
                curve1.setData(downsample(times[:ptr], target_points), 
                               downsample(x_vals[:ptr], target_points))
                curve2.setData(downsample(times[:ptr], target_points), 
                               downsample(y_vals[:ptr], target_points))
                curve3.setData(downsample(times[:ptr], target_points), 
                               downsample(z_vals[:ptr], target_points))
    except Exception as e:
        logger.error(f"Error in update_plot: {e}")

# def write_buffer_to_hdf5():
#     global buffer
#     try:
#         if buffer:
#             data_to_write = np.array(buffer)
#             buffer = []
#             with hdf5_file:
#                 hdf5_dataset.resize((hdf5_dataset.shape[0] + data_to_write.shape[0]), axis=0)
#                 hdf5_dataset[-data_to_write.shape[0]:] = data_to_write
#     except Exception as e:
#         logger.error(f"Error in write_buffer_to_hdf5: {e}")

# Set up timers for updating plot and writing to HDF5
plot_timer = QTimer()
plot_timer.timeout.connect(update_plot)
plot_timer.start(50)  # Update every 50 ms

# write_timer = QTimer()
# write_timer.timeout.connect(write_buffer_to_hdf5)
# write_timer.start(5000)  # Write every 5 seconds

# Start the PyQt event loop
if __name__ == '__main__':
    try:
        app.exec_()
    finally:
        # Ensure the serial connection and HDF5 file are closed properly when the script ends
        ser.close()
        # hdf5_file.close()
        logger.info("Application closed successfully")
