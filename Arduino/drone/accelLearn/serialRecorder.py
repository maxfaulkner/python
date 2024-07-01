import serial
import csv
import time

# Define the serial port and baud rate.
serial_port = '/dev/cu.usbmodem142401'  # Replace with your serial port
baud_rate = 115200  # Make sure this matches the baud rate of your Arduino.

# Set up the serial connection.
ser = serial.Serial(serial_port, baud_rate)

# CSV file setup
csv_filename = 'sensor_data.csv'
csv_header = ['Time', 'xOut', 'yOut', 'zOut']

# Create or append to the CSV file with headers
with open(csv_filename, mode='a', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(csv_header)

try:
    while True:
        if ser.in_waiting > 0:
            # Read bytes from the serial port.
            data_bytes = ser.readline()
            
            try:
                # Decode bytes to string
                line = data_bytes.decode('utf-8').strip()
                
                # Split the line into components.
                data = line.split(',')
                
                # Ensure we have the correct amount of data.
                if len(data) == 4:
                    current_time = float(data[0])
                    x = float(data[1])
                    y = float(data[2])
                    z = float(data[3])
                    
                    # Print the values to console.
                    print(f"Time: {current_time}, x: {x}, y: {y}, z: {z}")
                    
                    # Append values to CSV file.
                    with open(csv_filename, mode='a', newline='') as file:
                        writer = csv.writer(file)
                        writer.writerow([current_time, x, y, z])
                    
            except UnicodeDecodeError:
                print("UnicodeDecodeError: Cannot decode data.")
            except ValueError:
                print("Invalid data format. Skipping line.")
        
except KeyboardInterrupt:
    print("Serial reading stopped by the user.")

finally:
    # Close the serial connection when done.
    ser.close()
