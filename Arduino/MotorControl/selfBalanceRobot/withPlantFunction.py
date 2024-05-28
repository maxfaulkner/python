import numpy as np
import scipy.integrate as integrate
import matplotlib.pyplot as plt

# System parameters
wheel_diameter = 0.0254  # 1 inch in meters
wheel_radius = wheel_diameter / 2
wheel_mass = 0.1  # Assuming 100 grams per wheel
rod_diameter = 0.00254  # 0.1 inch in meters
rod_length = 0.15  # Assuming 6 inches long
platform_length = 0.1524  # 6 inches in meters
platform_width = 0.0762  # 3 inches in meters
platform_mass = 0.2  # Assuming 200 grams for the platform
total_mass = 0.45  # 1 lb in kg

# Physical constants
g = 9.81  # Gravity in m/s^2

# Moments of inertia
I_wheel = 0.5 * wheel_mass * wheel_radius**2
I_platform = (1/12) * platform_mass * (platform_length**2 + platform_width**2)

# Motor parameters
max_voltage = 5.0  # Max voltage input
motor_constant = 0.1  # Motor constant (arbitrary for this example)

# Initial conditions
initial_angle = 0.0  # Starting angle in radians
initial_velocity = 0.0  # Starting angular velocity in rad/s

# PID controller variables
Kp = 0.50  # Proportional gain
Ki = 0.1  # Integral gain
Kd = 0.01  # Derivative gain
previous_error = 0.0
integral = 0.0
integral_max = 10
integral_min = -10

# Time array
time_end = 10  # End time for simulation
dt = 0.01  # Time step
time = np.arange(0, time_end, dt)

# Data storage
angle_array = []
control_output_array = []

def pid_controller(set_point, current_angle, Kp, Ki, Kd, dt):
    global previous_error, integral, integral_max, integral_min
    
    error = set_point - current_angle
    integral += error * dt
    derivative = (error - previous_error) / dt
    
    # Anti-windup
    if integral > integral_max:
        integral = integral_max
    elif integral < integral_min:
        integral = integral_min
    
    output = Kp * error + Ki * integral + Kd * derivative
    previous_error = error
    
    return output

def plant_model(state, t, set_point, Kp, Ki, Kd):
    global dt
    angle, angular_velocity = state
    
    control_signal = pid_controller(set_point, angle, Kp, Ki, Kd, dt)
    control_signal = np.clip(control_signal, -max_voltage, max_voltage)
    
    # Convert control signal (voltage) to torque
    torque = motor_constant * control_signal
    
    # Dynamics: Net torque results in angular acceleration
    net_torque = torque
    angular_acceleration = net_torque / (I_wheel + I_platform)
    
    return [angular_velocity, angular_acceleration]

# Initial state
state = [initial_angle, initial_velocity]

# Integrate the plant model
for t in time:
    state = integrate.odeint(plant_model, state, [t, t + dt], args=(-2.0, Kp, Ki, Kd))[-1]  # Set point is 1 rad
    angle_array.append(state[0])
    control_output = pid_controller(1.0, state[0], Kp, Ki, Kd, dt)
    control_output_array.append(control_output)

# Plotting the response
plt.figure(figsize=(10, 6))

# Plot system response
plt.subplot(2, 1, 1)
plt.plot(time, angle_array, label='System Response')
plt.xlabel('Time (s)')
plt.ylabel('Angle (rad)')
plt.title('PID Controller Response')
plt.legend()
plt.grid(True)

# Plot PID controller output
plt.subplot(2, 1, 2)
plt.plot(time, control_output_array, label='Control Output', color='orange')
plt.xlabel('Time (s)')
plt.ylabel('Control Output')
plt.legend()
plt.grid(True)

plt.tight_layout()
plt.show()
