import matplotlib.pyplot as plt
import numpy as np
import scipy.integrate as integrate

# PID controller parameters
Kp = 1.0  # Proportional gain
Ki = 0.1  # Integral gain
Kd = 0.05  # Derivative gain

# System parameters
set_point = 1.0  # Desired set point (target angle)
initial_angle = 10.0  # Initial angle
initial_velocity = 0.0  # Initial velocity
time_end = 10  # End time for simulation
dt = 0.01  # Time step

# PID controller variables
previous_error = 0.0
integral = 0.0
integral_max = 10  # Anti-windup limit
integral_min = -10  # Anti-windup limit

# Time array
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

def system_dynamics(state, t, set_point, Kp, Ki, Kd):
    global dt
    angle, velocity = state
    
    control_signal = pid_controller(set_point, angle, Kp, Ki, Kd, dt)
    
    # Simplified dynamics: acceleration is proportional to the control signal
    acceleration = control_signal
    
    return [velocity, acceleration]

# Initial state
state = [initial_angle, initial_velocity]

# Integrate the system dynamics step by step to ensure control output is recorded
for t in time:
    state = integrate.odeint(system_dynamics, state, [t, t + dt], args=(set_point, Kp, Ki, Kd))[-1]
    angle_array.append(state[0])
    control_output = pid_controller(set_point, state[0], Kp, Ki, Kd, dt)
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
