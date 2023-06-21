import tkinter as tk
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.animation import FuncAnimation

# Create a tkinter window
root = tk.Tk()
root.geometry("500x400")

# Create a figure and subplot
fig, ax = plt.subplots()
ax.set_xlim(0, 2 * np.pi)
ax.set_ylim(-1, 1)
line, = ax.plot([], [], 'b-')

# Function to update the plot for each frame
def update(frame):
    x = np.linspace(0, 2 * np.pi, 100)
    y = np.sin(x + frame * 0.1)
    line.set_data(x, y)
    return line,

# Create the animation
ani = FuncAnimation(fig, update, frames=100, interval=50, blit=True)

# Create a canvas to display the plot in the tkinter window
canvas = FigureCanvasTkAgg(fig, master=root)
canvas.draw()
canvas.get_tk_widget().pack()

# Start the tkinter event loop
root.mainloop()
