import serial
import time

# Define the serial port and baud rate.
serial_port = '/dev/cu.usbmodem143201'  # Replace with your serial port
baud_rate = 115200  # Make sure this matches the baud rate of your Arduino.

# Set up the serial connection.
ser = serial.Serial(serial_port, baud_rate)

# Add a short delay to ensure the serial connection is properly established.
#time.sleep(2)

# Function to read and print data from serial
def read_serial_data():
    while True:
        if ser.in_waiting >= 0:
            # Read bytes from the serial port.
            data_bytes = ser.readline()
            
            try:
                # Decode bytes to string
                line = data_bytes.decode('utf-8').strip()
                # Print the line to console
                print(line)
            except UnicodeDecodeError:
                print("UnicodeDecodeError: Cannot decode data.")
            except ValueError as e:
                print("ValueError:", e)
        else:
            print("No data waiting...")

if __name__ == '__main__':
    try:
        read_serial_data()
    except KeyboardInterrupt:
        print("Exiting program.")
    finally:
        # Ensure the serial connection is closed properly when the script ends.
        ser.close()
