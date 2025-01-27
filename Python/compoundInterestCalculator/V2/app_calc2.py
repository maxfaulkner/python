import sys
from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QApplication,
    QMainWindow,
    QWidget,
    QFormLayout,
    QLineEdit,
    QLabel,
    QPushButton,
    QCheckBox,
    QTableWidget,
    QTableWidgetItem,
    QVBoxLayout,
    QHBoxLayout
)
import matplotlib
matplotlib.use("QtAgg")  # Use the Qt backend for Matplotlib
from matplotlib.backends.backend_qtagg import FigureCanvasQTAgg as FigureCanvas
import matplotlib.pyplot as plt

# -----------------------------
# Utility: Safely generate 'num_variations' lines around 'rate r' 
# within ±max_variation (in decimal form), avoiding zero-division.
# -----------------------------
def generate_variations(r, max_var, num_variations):
    """
    Returns a sorted list of `num_variations` rates around `r`.
    Symmetrically spaced from -max_var to +max_var.
    
    Example:
      r=0.10, max_var=0.02, num_variations=4  => 
        [0.08, 0.09, 0.11, 0.12]

    If num_variations=6 => 
      [0.08, 0.0867..., 0.0933..., 0.1067..., 0.1133..., 0.12]
    """
    if num_variations <= 0:
        return []

    # If the user tries an odd number, we'll still do symmetrical spacing
    # with one line possibly very close to r. 
    # But most typical usage is even numbers, e.g. 4, 6, 8.
    half_count = num_variations // 2
    # If it's odd, half_count won't include the middle line, but let's be consistent anyway.

    # The step size from 0 to max_var:
    step_size = max_var / half_count if half_count > 0 else max_var

    # Negative side
    negative_rates = [
        r - i * step_size
        for i in range(half_count, 0, -1)
    ]
    # If num_variations is odd, we can optionally add the 'r' itself as a variation,
    # but in practice we already have the 'main line' for the user's rate.
    # So we'll skip that here, to avoid duplicating the user's main rate line.

    # Positive side
    positive_rates = [
        r + i * step_size
        for i in range(1, half_count + 1)
    ]
    # If num_variations is odd and half_count*2 < num_variations, 
    # there's an extra line. We can place it exactly at r if desired:
    # But let's keep the code simple and symmetrical for even or odd.

    combined = negative_rates + positive_rates
    return sorted(combined)

# -----------------------------
# Calculation Functions (with safe checks)
# -----------------------------
def calc_compound_no_contrib(p, r, n, t):
    """No contributions, handle zero rate or n <= 0."""
    if n <= 0:
        return 0.0
    if abs(r) < 1e-12:
        # effectively 0% interest
        return p
    return p * ((1 + (r / n)) ** (n * t))

def calc_compound_with_contrib(p, r, n, t, c):
    """With contributions, handle zero rate or n <= 0."""
    if n <= 0:
        return 0.0
    if abs(r) < 1e-12:
        # no interest => principal + c*(n*t)
        return p + c*(n*t)
    first_half = p * ((1 + r/n) ** (n*t))
    second_half = c * (((1 + r/n) ** (n*t) - 1) / (r/n))
    return first_half + second_half

def calc_timeline_no_contrib(p, r, n, t):
    """(year, value) for each year, no contrib."""
    results = []
    if n <= 0:
        for year in range(int(t) + 1):
            results.append((year, 0.0))
        return results

    for year in range(int(t) + 1):
        if abs(r) < 1e-12:
            value = p
        else:
            value = p * ((1 + r/n) ** (n*year))
        results.append((year, value))
    return results

def calc_timeline_with_contrib(p, r, n, t, c):
    """(year, value) for each year, with contrib."""
    results = []
    if n <= 0:
        for year in range(int(t) + 1):
            results.append((year, 0.0))
        return results

    for year in range(int(t) + 1):
        if abs(r) < 1e-12:
            # No interest => p + c*(n*year)
            value = p + c*(n*year)
        else:
            first_half = p * ((1 + r/n) ** (n*year))
            second_half = c * (((1 + r/n) ** (n*year) - 1) / (r/n))
            value = first_half + second_half
        results.append((year, value))
    return results


def calc_varying_rates_no_contrib(p, base_rate, n, t, max_var, num_lines):
    """
    For each rate in generate_variations(...), compute a timeline 
    with no contributions.
    """
    if n <= 0 or num_lines <= 0:
        return {}

    rates = generate_variations(base_rate, max_var, num_lines)
    results = {}
    for rate in rates:
        timeline = []
        for year in range(int(t) + 1):
            if abs(rate) < 1e-12:
                # effectively 0
                value = p
            else:
                value = p * ((1 + rate/n) ** (n*year))
            timeline.append((year, value))
        results[rate] = timeline
    return results


def calc_varying_rates_with_contrib(p, base_rate, n, t, c, max_var, num_lines):
    """
    For each rate in generate_variations(...), compute a timeline 
    with contributions.
    """
    if n <= 0 or num_lines <= 0:
        return {}

    rates = generate_variations(base_rate, max_var, num_lines)
    results = {}
    for rate in rates:
        timeline = []
        for year in range(int(t) + 1):
            if abs(rate) < 1e-12:
                # No interest => p + c*(n*year)
                value = p + c*(n*year)
            else:
                first_half = p * ((1 + rate/n) ** (n*year))
                if abs(rate/n) < 1e-12:
                    second_half = c*(n*year)
                else:
                    second_half = c * (((1 + rate/n) ** (n*year) - 1) / (rate/n))
                value = first_half + second_half
            timeline.append((year, value))
        results[rate] = timeline
    return results


# -----------------------------
# Matplotlib Canvas for PySide
# -----------------------------
class MplCanvas(FigureCanvas):
    def __init__(self, parent=None, width=5, height=3, dpi=100):
        fig, self.ax = plt.subplots(figsize=(width, height), dpi=dpi)
        super().__init__(fig)
        self.setParent(parent)


# -----------------------------
# Main Window
# -----------------------------
class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Compound Interest Calculator (Qt)")

        # Main widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        # Overall layout
        main_layout = QVBoxLayout()
        central_widget.setLayout(main_layout)

        # A horizontal layout at the top for form items (left) and variation input (right)
        top_layout = QHBoxLayout()
        main_layout.addLayout(top_layout)

        # Form for user inputs (left side)
        form_widget = QWidget()
        form_layout = QFormLayout()
        form_widget.setLayout(form_layout)
        top_layout.addWidget(form_widget, stretch=2)

        # Inputs
        self.input_p = QLineEdit("100")
        self.input_r = QLineEdit("10")   # % rate
        self.input_n = QLineEdit("1")
        self.input_t = QLineEdit("10")
        self.input_c = QLineEdit("0")

        form_layout.addRow("Initial Amount:", self.input_p)
        form_layout.addRow("Avg Rate of Return (%):", self.input_r)
        form_layout.addRow("Compounds / Year:", self.input_n)
        form_layout.addRow("Years:", self.input_t)
        form_layout.addRow("Contributions:", self.input_c)

        # Checkbox for contributions
        self.use_contributions_checkbox = QCheckBox("Use Contributions?")
        form_layout.addRow(self.use_contributions_checkbox)

        # Variation inputs (on the top right)
        variation_widget = QWidget()
        variation_layout = QFormLayout()
        variation_widget.setLayout(variation_layout)

        self.input_variation = QLineEdit("2.0")     # default: 2.0 => ±2%
        self.input_num_lines = QLineEdit("4")       # default: 4 lines
        variation_layout.addRow("Max Variation (%):", self.input_variation)
        variation_layout.addRow("Number of Rate Variations:", self.input_num_lines)
        top_layout.addWidget(variation_widget, stretch=1, alignment=Qt.AlignTop | Qt.AlignRight)

        # Calculate button
        self.calc_button = QPushButton("Calculate")
        self.calc_button.clicked.connect(self.perform_calculation)
        main_layout.addWidget(self.calc_button)

        # Results label
        self.result_label = QLabel("")
        main_layout.addWidget(self.result_label)

        # Table for final values of varying rates
        self.varying_table = QTableWidget(0, 2)  # 0 rows, 2 columns
        self.varying_table.setHorizontalHeaderLabels(["Rate (%)", "Final Value"])
        main_layout.addWidget(self.varying_table)

        # Matplotlib canvas
        self.canvas = MplCanvas(self, width=6, height=3, dpi=100)
        main_layout.addWidget(self.canvas)

    def perform_calculation(self):
        """Get user inputs, do the calculations, update plot and table."""
        try:
            p = float(self.input_p.text())
            r_percent = float(self.input_r.text())
            r_decimal = r_percent / 100.0
            n = float(self.input_n.text())
            t = float(self.input_t.text())
            c = float(self.input_c.text())
            max_var_percent = float(self.input_variation.text())  # e.g. 2.0 => 2%
            max_var_decimal = max_var_percent / 100.0
            num_lines = int(self.input_num_lines.text())          # e.g. 4
        except ValueError:
            self.result_label.setText("Please enter valid numeric inputs!")
            return

        # Quick check for invalid n
        if n <= 0:
            self.result_label.setText("Compounds per year must be > 0.")
            return

        # Clear table
        self.varying_table.setRowCount(0)

        use_contrib = self.use_contributions_checkbox.isChecked()

        # MAIN line calculations
        if use_contrib:
            total_final = calc_compound_with_contrib(p, r_decimal, n, t, c)
            main_curve = calc_timeline_with_contrib(p, r_decimal, n, t, c)
        else:
            total_final = calc_compound_no_contrib(p, r_decimal, n, t)
            main_curve = calc_timeline_no_contrib(p, r_decimal, n, t)

        self.result_label.setText(f"After {t:.1f} Years at {r_percent:.2f}%: ${total_final:,.2f}")

        # VARYING rates calculations
        if use_contrib:
            varying_curves = calc_varying_rates_with_contrib(p, r_decimal, n, t, c, max_var_decimal, num_lines)
        else:
            varying_curves = calc_varying_rates_no_contrib(p, r_decimal, n, t, max_var_decimal, num_lines)

        # Update table with final values from varying curves
        sorted_rates = sorted(varying_curves.keys())
        for rate in sorted_rates:
            data_points = varying_curves[rate]
            final_value = data_points[-1][1] if data_points else 0
            row_idx = self.varying_table.rowCount()
            self.varying_table.insertRow(row_idx)

            item_rate = QTableWidgetItem(f"{rate * 100:.2f}%")
            item_value = QTableWidgetItem(f"${final_value:,.2f}")
            self.varying_table.setItem(row_idx, 0, item_rate)
            self.varying_table.setItem(row_idx, 1, item_value)

        # Update plot
        self.canvas.ax.clear()
        # Plot "main" line
        x_main = [pt[0] for pt in main_curve]
        y_main = [pt[1] for pt in main_curve]
        self.canvas.ax.plot(x_main, y_main, label=f"Main Rate: {r_percent:.2f}%")

        # Plot varying lines
        for rate in sorted_rates:
            values = varying_curves[rate]
            x_vals = [pt[0] for pt in values]
            y_vals = [pt[1] for pt in values]
            self.canvas.ax.plot(x_vals, y_vals, label=f"{rate*100:.2f}%")

        self.canvas.ax.set_title("Compound Interest Over Time")
        self.canvas.ax.set_xlabel("Time (years)")
        self.canvas.ax.set_ylabel("Value (USD)")
        self.canvas.ax.legend()
        self.canvas.draw()


# -----------------------------
# Run the application
# -----------------------------
if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.resize(1000, 650)
    window.show()
    sys.exit(app.exec())
