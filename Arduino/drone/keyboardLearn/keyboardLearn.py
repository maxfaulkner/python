import serial
import time
from pynput import keyboard

# Set up the serial connection (adjust the port and baud rate as necessary)
ser = serial.Serial('/dev/cu.usbmodem141201', 115200, timeout=1)  # Replace '/dev/cu.usbmodem141201' with your Arduino's serial port

def on_press(key):
    try:
        if key.char == 'd':
            ser.write(b'D')
        if key.char == 'a':
            ser.write(b'A')
        if key.char == 's':
            ser.write(b'S')
        if key.char == 'w':
            ser.write(b'W')
    except AttributeError:
        pass

# Start the listener for key presses
listener = keyboard.Listener(on_press=on_press)
listener.start()

try:
    while True:
        if ser.in_waiting > 0:
            try:
                data = ser.readline().decode('utf-8').strip()
                print(data)
            except UnicodeDecodeError:
                print("Received corrupted data.")
        time.sleep(0.01)  # Very short sleep to ensure responsiveness
except KeyboardInterrupt:
    print("Program interrupted.")
finally:
    ser.close()
    listener.stop()
