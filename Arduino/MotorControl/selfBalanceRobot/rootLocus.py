import numpy as np
import matplotlib.pyplot as plt
import control as ctl

# System parameters (example values, these need to be derived from your specific system)
k = 1.0  # Gain (ensure this is not zero)
a = 0.1  # Damping coefficient (example value)
b = 0.2  # Natural frequency squared (example value)

# Check for non-zero system parameters to avoid division by zero
if k == 0:
    raise ValueError("The system gain 'k' must not be zero.")
if b == 0:
    raise ValueError("The system parameter 'b' (natural frequency squared) must not be zero.")

# Define the transfer function G(s)
num = [k]
den = [1, a, b]
G = ctl.TransferFunction(num, den)

# Define PID controller transfer function
def pid_transfer_function(Kp, Ki, Kd):
    # PID transfer function in the Laplace domain
    return ctl.TransferFunction([Kd, Kp, Ki], [1, 0])

# Define a range of gains for root locus plot
Kp_values = np.linspace(1, 10, 100)

# Initialize the plot
plt.figure()

# Plot root locus for various PID combinations
for Kp in Kp_values:
    Ki = 1.0  # Fixing Ki for simplicity in initial plot
    Kd = 1.0  # Fixing Kd for simplicity in initial plot
    C = pid_transfer_function(Kp, Ki, Kd)
    L = C * G
    
    # Calculate the root locus data and plot it
    roots = ctl.root_locus(L)

# Additional plot formatting
plt.title('Root Locus of the System with PID')
plt.xlabel('Real Axis')
plt.ylabel('Imaginary Axis')
plt.grid(True)
plt.show()
