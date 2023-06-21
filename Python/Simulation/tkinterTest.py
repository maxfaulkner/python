import tkinter as tk
from tkinter import ttk
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.animation import FuncAnimation

root = tk.Tk()
root.geometry('1000x500')

# Create a function to update the labels when the sliders are moved
def update_label(var, label):
    label.config(text=str(var.get()))

# Top left corner
var1 = tk.IntVar()
label1 = tk.Label(root, text='0', font=('Arial', 32))
label1.place(x=0, y=0, anchor='nw')
slider1 = ttk.Scale(root, from_=-10, to=10, orient='horizontal', variable=var1, command=lambda _: update_label(var1, label1))
slider1.place(x=0, y=50, anchor='nw')

# Top right corner
var2 = tk.IntVar()
label2 = tk.Label(root, text='0', font=('Arial', 32))
label2.place(x=350, y=0, anchor='ne')
slider2 = ttk.Scale(root, from_=-10, to=10, orient='horizontal', variable=var2, command=lambda _: update_label(var2, label2))
slider2.place(x=350, y=50, anchor='ne')

# Bottom left corner
var3 = tk.IntVar()
label3 = tk.Label(root, text='0', font=('Arial', 32))
label3.place(x=0, y=500, anchor='sw')
slider3 = ttk.Scale(root, from_=-10, to=10, orient='horizontal', variable=var3, command=lambda _: update_label(var3, label3))
slider3.place(x=0, y=450, anchor='sw')

# Bottom right corner
var4 = tk.IntVar()
label4 = tk.Label(root, text='0', font=('Arial', 32))
label4.place(x=350, y=500, anchor='se')
slider4 = ttk.Scale(root, from_=-10, to=10, orient='horizontal', variable=var4, command=lambda _: update_label(var4, label4))
slider4.place(x=350, y=450, anchor='se')

# Middle left
var5 = tk.IntVar()
label5 = tk.Label(root, text='0', font=('Arial', 32))
label5.place(x=100, y=250, anchor='center')
slider5 = ttk.Scale(root, from_=1, to=10, orient='vertical', length=200, variable=var5, command=lambda _: update_label(var5, label5))
slider5.place(x=62.5, y=250, anchor='center')

# Middle right
var6 = tk.IntVar()
label6 = tk.Label(root, text='0', font=('Arial', 32))
label6.place(x=250, y=250, anchor='center')
slider6 = ttk.Scale(root, from_=1, to=10, orient='vertical', length=200, variable=var6, command=lambda _: update_label(var6, label6))
slider6.place(x=287.5, y=250, anchor='center')

# Create a figure and subplot

magnitude = 5
fig, ax = plt.subplots()
ax.set_xlim(0, 2 * np.pi)
ax.set_ylim(-magnitude, magnitude)
line, = ax.plot([], [], 'b-')

# Function to update the plot for each frame
def update(frame):
    magnitude = slider6.get()
    if (magnitude == 1):
        
        magnitude = 1
        print("hi")
    else:
        magnitude = slider6.get()
        print("YAYYY")
    ax.set_ylim(-magnitude, magnitude)
    x = np.linspace(0, 2 * np.pi, 100)
    y = magnitude * np.sin(x + frame * 0.1)
    line.set_data(x, y)
    return line,

# Create the animation
ani = FuncAnimation(fig, update, frames=100, interval=50, blit=True)

# Create a canvas to display the plot in the tkinter window
canvas = FigureCanvasTkAgg(fig, master=root)
canvas.draw()
canvas.get_tk_widget().pack(side='right')

root.mainloop()
