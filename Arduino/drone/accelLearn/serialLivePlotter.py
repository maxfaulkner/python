import serial
import numpy as np
import pyqtgraph as pg
from collections import deque
from PyQt5.QtWidgets import QApplication, QLabel, QVBoxLayout, QWidget, QGridLayout
from PyQt5.QtCore import QTimer

# Define the serial port and baud rate.
serial_port = '/dev/cu.usbmodem143201'  # Replace with your serial port
baud_rate = 115200  # Make sure this matches the baud rate of your Arduino.

# Set up the serial connection.
ser = serial.Serial(serial_port, baud_rate)

# Initialize data storage
times = deque(maxlen=1000)
xGyroVals = deque(maxlen=1000)
yGyroVals = deque(maxlen=1000)
zGyroVals = deque(maxlen=1000)
xAccelVals = deque(maxlen=1000)
yAccelVals = deque(maxlen=1000)
zAccelVals = deque(maxlen=1000)
flPmwVals = deque(maxlen=1000)
frPmwVals = deque(maxlen=1000)
rlPmwVals = deque(maxlen=1000)
rrPmwVals = deque(maxlen=1000)

# Create a PyQt application
app = QApplication([])

# Create main window and layout
main_window = QWidget()
main_layout = QVBoxLayout()
main_window.setLayout(main_layout)

# Create a GraphicsLayoutWidget for plots
win = pg.GraphicsLayoutWidget(show=True, title="Real-Time Plotting")
win.resize(1000, 600)
win.setWindowTitle('Sensor Data')
main_layout.addWidget(win)

# Create the plots
plot1 = win.addPlot(title="Time vs xGyroOut", row=0, col=0)
curve1 = plot1.plot(pen='r')
plot2 = win.addPlot(title="Time vs yGyroOut", row=1, col=0)
curve2 = plot2.plot(pen='g')
plot3 = win.addPlot(title="Time vs zGyroOut", row=2, col=0)
curve3 = plot3.plot(pen='b')
plot4 = win.addPlot(title="Time vs xAccelOut", row=0, col=1)
curve4 = plot4.plot(pen='r')
plot5 = win.addPlot(title="Time vs yAccelOut", row=1, col=1)
curve5 = plot5.plot(pen='g')
plot6 = win.addPlot(title="Time vs zAccelOut", row=2, col=1)
curve6 = plot6.plot(pen='b')

# Create labels to display additional data points
label_layout = QGridLayout()
main_layout.addLayout(label_layout)

label1 = QLabel("Front Left PWM: 0")
label2 = QLabel("Front Right PWM: 0")
label3 = QLabel("Rear Left PWM: 0")
label4 = QLabel("Rear Right PWM: 0")

label_layout.addWidget(label1, 0, 0)
label_layout.addWidget(label2, 0, 1)
label_layout.addWidget(label3, 1, 0)
label_layout.addWidget(label4, 1, 1)

def update_plot():
    if ser.in_waiting > 0:
        try:
            # Read bytes from the serial port.
            data_bytes = ser.readline()
            
            # Decode bytes to string
            line = data_bytes.decode('utf-8').strip()
            
            # Split the line into components.
            data = line.split(',')
            
            # Ensure we have the correct amount of data.
            if len(data) == 11:  # Expecting 11 data points now
                current_time = float(data[0])
                xGyroRaw = float(data[1])
                yGyroRaw = float(data[2])
                zGyroRaw = float(data[3])
                xAccelRaw = float(data[4])
                yAccelRaw = float(data[5])
                zAccelRaw = float(data[6])
                flPmwRaw = float(data[7])
                frPmwRaw = float(data[8])
                rlPmwRaw = float(data[9])
                rrPmwRaw = float(data[10])
                
                # Append data to deques
                times.append(current_time)
                xGyroVals.append(xGyroRaw)
                yGyroVals.append(yGyroRaw)
                zGyroVals.append(zGyroRaw)
                xAccelVals.append(xAccelRaw)
                yAccelVals.append(yAccelRaw)
                zAccelVals.append(zAccelRaw)
                flPmwVals.append(flPmwRaw)
                frPmwVals.append(frPmwRaw)
                rlPmwVals.append(rlPmwRaw)
                rrPmwVals.append(rrPmwRaw)
                
                # Update the data of the plots
                curve1.setData(times, xGyroVals)
                curve2.setData(times, yGyroVals)
                curve3.setData(times, zGyroVals)
                curve4.setData(times, xAccelVals)
                curve5.setData(times, yAccelVals)
                curve6.setData(times, zAccelVals)
                
                # Update labels with the additional data points
                label1.setText(f"Front Left PWM: {flPmwRaw}")
                label2.setText(f"Front Right PWM: {frPmwRaw}")
                label3.setText(f"Rear Left PWM: {rlPmwRaw}")
                label4.setText(f"Rear Right PWM: {rrPmwRaw}")
            else:
                print("Unexpected number of data points received.")
        except UnicodeDecodeError:
            print("UnicodeDecodeError: Cannot decode data.")
        except ValueError:
            print("Invalid data format. Skipping line.")

# Set up a timer to update the plot regularly
timer = QTimer()
timer.timeout.connect(update_plot)
timer.start(10)  # Update plot every 10 ms (adjust as needed)

# Start the PyQt event loop
main_window.show()
app.exec_()

# Ensure the serial connection is closed properly when the script ends.
ser.close()
