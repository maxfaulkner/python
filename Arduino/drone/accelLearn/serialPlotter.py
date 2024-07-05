import pandas as pd
import matplotlib.pyplot as plt

# Load data from CSV into a DataFrame
file_path = 'accel_sensor_data_main.csv'
df = pd.read_csv(file_path)

# Extract data
time = df['Time']
x_out = df['xOut']
y_out = df['yOut']
z_out = df['zOut']

# Create three subplots
fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(10, 8))

# Plot 1: Time vs xOut
ax1.plot(time, x_out, color='r', label='xOut')
ax1.set_title('Time vs xOut')
ax1.set_xlabel('Time')
ax1.set_ylabel('xOut')
ax1.legend()
ax1.grid(True)

# Plot 2: Time vs yOut
ax2.plot(time, y_out, color='g', label='yOut')
ax2.set_title('Time vs yOut')
ax2.set_xlabel('Time')
ax2.set_ylabel('yOut')
ax2.legend()
ax2.grid(True)

# Plot 3: Time vs zOut
ax3.plot(time, z_out, color='b', label='zOut')
ax3.set_title('Time vs zOut')
ax3.set_xlabel('Time')
ax3.set_ylabel('zOut')
ax3.legend()
ax3.grid(True)

# Adjust layout and display the plots
plt.tight_layout()
plt.show()
