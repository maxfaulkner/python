import serial
import time
import threading
import numpy as np
import pyqtgraph as pg
from collections import deque
from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import QTimer

# Define the serial port and baud rate.
serial_port = '/dev/cu.usbmodem14301'  # Replace with your serial port
baud_rate = 115200  # Make sure this matches the baud rate of your Arduino.

# Set up the serial connection.
ser = serial.Serial(serial_port, baud_rate)

# Initialize data storage
times = deque(maxlen=1000)
xGyroVals = deque(maxlen=1000)
yGyroVals = deque(maxlen=1000)
zGyroVals = deque(maxlen=1000)

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

def update_plot():
    if ser.in_waiting > 0:
        # Read bytes from the serial port.
        data_bytes = ser.readline()
        
        try:
            # Decode bytes to string
            line = data_bytes.decode('utf-8').strip()
            
            # Split the line into components.
            data = line.split(',')
            
            # Ensure we have the correct amount of data.
            if len(data) == 7:
                current_time = float(data[0])
                xGyroRaw = float(data[1])
                yGyroRaw = float(data[2])
                zGyroRaw = float(data[3])
                xAccelRaw = float(data[4])
                yAccelRaw = float(data[5])
                zAccelRaw = float(data[6])
                
                # Print the values to console.
                print(f"Time: {current_time}, xGyro: {xGyroRaw}, yGyro: {yGyroRaw}, zGyro: {zGyroRaw}, xAccel: {xAccelRaw}, yAccel: {yAccelRaw}, zAccel: {zAccelRaw}")
                
                # Append data to deques
                times.append(current_time)
                xGyroVals.append(xGyroRaw)
                yGyroVals.append(yGyroRaw)
                zGyroVals.append(zGyroRaw)
                
                # Update the data of the plots
                curve1.setData(times, xGyroVals)
                curve2.setData(times, yGyroVals)
                curve3.setData(times, zGyroVals)
            else:
                print("odd")
        except UnicodeDecodeError:
            print("UnicodeDecodeError: Cannot decode data.")
        except ValueError:
            print("Invalid data format. Skipping line.")

# Set up a timer to update the plot regularly
timer = QTimer()
timer.timeout.connect(update_plot)
timer.start(50) #rate at which plot and sensors are updated

# Start the PyQt event loop
if __name__ == '__main__':
    app.exec_()
    # Ensure the serial connection is closed properly when the script ends.
    ser.close()
