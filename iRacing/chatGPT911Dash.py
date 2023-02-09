import tkinter as tk

root = tk.Tk()
root.geometry("400x300")
root.configure(bg="#2B2B2B")

speed_label = tk.Label(root, text="Speed", font=("Helvetica", 20), bg="#2B2B2B", fg="white")
speed_label.pack(side='top', anchor='w')

speed_var = tk.StringVar()
speed_var.set("0 km/h")

speed_display = tk.Label(root, textvariable=speed_var, font=("Helvetica", 30), bg="#2B2B2B", fg="white")
speed_display.pack(side='top', anchor='w')

root.mainloop()