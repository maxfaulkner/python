import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Load the data
data = pd.read_csv('accel_sensor_data_main.csv')

# Define a simple moving average function
def moving_average(data, window_size):
    return data.rolling(window=window_size).median()

# Apply the moving average filter with a window size of 100
window_size = 20 #delay = (window_size - 1)/2 with a unit of samples. So 4 samples = 200ms here
data['xOut_filtered'] = moving_average(data['xOut'], window_size)
data['yOut_filtered'] = moving_average(data['yOut'], window_size)
data['zOut_filtered'] = moving_average(data['zOut'], window_size)

# Plot the filtered data
fig, axs = plt.subplots(3, 1, figsize=(10, 8))

axs[0].plot(data['Time'], data['xOut_filtered'], 'r-', label='xOut_filtered')
axs[0].set_title('Time vs xOut (Filtered)')
axs[0].set_xlabel('Time')
axs[0].set_ylabel('xOut')
axs[0].legend()

axs[1].plot(data['Time'], data['yOut_filtered'], 'g-', label='yOut_filtered')
axs[1].set_title('Time vs yOut (Filtered)')
axs[1].set_xlabel('Time')
axs[1].set_ylabel('yOut')
axs[1].legend()

axs[2].plot(data['Time'], data['zOut_filtered'], 'b-', label='zOut_filtered')
axs[2].set_title('Time vs zOut (Filtered)')
axs[2].set_xlabel('Time')
axs[2].set_ylabel('zOut')
axs[2].legend()

plt.tight_layout()
plt.show()
