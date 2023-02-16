import tkinter as tk
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg

# Create a Tkinter window
root = tk.Tk()
root.title("Slider Example")

# Create a slider
slider = tk.Scale(root, from_=0, to=10, orient=tk.HORIZONTAL, length=200)
slider.pack()

# Create a figure and a plot
fig = plt.Figure(figsize=(6, 4), dpi=100)
ax = fig.add_subplot(111)
x = np.linspace(0, 10, 100)
y = np.sin(x)
line, = ax.plot(x, y)

# Create a canvas to display the plot in Tkinter
canvas = FigureCanvasTkAgg(fig, master=root)
canvas.get_tk_widget().pack()

# Define a function to update the plot based on the slider value
def update_plot(val):
    # Get the slider value
    slider_val = slider.get()

    # Update the x range of the plot
    ax.set_xlim([0, slider_val])

    # Update the plot data
    x = np.linspace(0, slider_val, 100)
    y = np.sin(x)
    line.set_xdata(x)
    line.set_ydata(y)

    # Redraw the plot
    fig.canvas.draw_idle()

# Bind the slider to the update function
slider.config(command=update_plot)

# Start the Tkinter main loop
tk.mainloop()