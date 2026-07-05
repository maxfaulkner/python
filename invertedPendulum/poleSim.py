import math
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from matplotlib.patches import FancyBboxPatch, Circle
from matplotlib.widgets import Slider, Button

#Fixed variables (physical shit)
M = 1.0 #kg - Cart mass
m = 0.1 #kg - Pole mass
L = 0.5 #meters - pole length
g = 9.81 #m/s^2 - gravity

cart_w = 0.5
cart_h = 0.26
wheel_r = 0.06

#initial conditions / sim settings
THETA0 = math.pi  #rad - starting tilt
dt = 0.02      #s
steps = 1000   #number of timesteps to simulate (= 20 s)

#default gains (slider start values)
KP0, KD0, KX0, KV0 = 250, 50, 25, 40
k_swing = 1 #swing gain
switch_angle = 0.3 #rad where to switch to balancing controller

#histories filled in by run_sim()
theta_history = []
x_history = []


def dynamics(theta, theta_dot, F):
    theta_ddot_numerator = ((M+m)*g*math.sin(theta) - F*math.cos(theta) - m*L*theta_dot**2*math.sin(theta)*math.cos(theta))
    theta_ddot_denom = L * (M + m*math.sin(theta)**2)
    theta_ddot = theta_ddot_numerator/theta_ddot_denom

    x_ddot_numerator = (F + m*math.sin(theta)*(L*theta_dot**2 - g*math.cos(theta)))
    x_ddot_denom = (M + m*math.sin(theta)**2)
    x_ddot = x_ddot_numerator/x_ddot_denom

    return theta_ddot, x_ddot


def run_sim(Kp, Kd, Kx, Kv, k_swing):
    """Simulate from the initial conditions and return (theta_history, x_history)."""
    theta, theta_dot, x, x_dot = THETA0, 0.1, 0.0, 0.0

    th_hist, x_hist = [], []
    for _ in range(steps):
        try:
            theta_wrapped = (theta + math.pi) % (2*math.pi) - math.pi
            if abs(theta_wrapped) <= switch_angle:
                F = Kp*theta_wrapped + Kd*theta_dot + Kx*x + Kv*x_dot
            else:
                E = 0.5*m*L**2*theta_dot**2 + m*g*L*math.cos(theta_wrapped)
                E_top = m*g*L
                u = k_swing * (E - E_top) * theta_dot * math.cos(theta_wrapped)
                F = u*(M + m*math.sin(theta_wrapped)**2) - m*math.sin(theta_wrapped)*(L*theta_dot**2 - g*math.cos(theta_wrapped))
            theta_ddot, x_ddot = dynamics(theta, theta_dot, F)
            theta_dot += theta_ddot*dt
            theta += theta_dot*dt
            x_dot += x_ddot*dt
            x += x_dot*dt
        except OverflowError:
            break   # blew up (e.g. k_swing too high) -> stop here and show what we have
        th_hist.append(theta)
        x_hist.append(x)
    return th_hist, x_hist


# ============================ THEME ============================
BG      = '#0f1419'   # figure / stage background
PANEL   = '#1b2430'   # widget tracks
HOVER   = '#2a3645'
RAIL    = '#3b4758'
CART_C  = '#38bdf8'   # cart body
CART_E  = '#0ea5e9'
WHEEL_C = '#0f1419'
WHEEL_E = '#7c8aa0'
SWING_C = '#fbbf24'   # amber  - swing-up mode
BAL_C   = '#34d399'   # emerald - balance mode
TEXT_C  = '#e5e7eb'
MUTED   = '#5b6b80'

plt.rcParams['font.family'] = 'DejaVu Sans'

# ---------------- figure + stage ----------------
fig = plt.figure(figsize=(9, 7), facecolor=BG)
fig.text(0.5, 0.955, 'INVERTED PENDULUM', color=TEXT_C, ha='center',
         fontsize=16, fontweight='bold')
fig.text(0.5, 0.925, 'swing-up  +  balance', color=MUTED, ha='center', fontsize=10)

ax = fig.add_axes((0.06, 0.42, 0.88, 0.46))
ax.set_xlim(-3, 3)
ax.set_ylim(-1.0, 1.2)
ax.set_aspect('equal')
ax.set_facecolor(BG)
ax.set_xticks([]); ax.set_yticks([])
for s in ax.spines.values():
    s.set_visible(False)

# static scene -------------------------------------------------
rail_y = -cart_h - wheel_r
ax.axhline(rail_y, color=RAIL, lw=5, zorder=0, solid_capstyle='round')   # track
ax.axvline(0, color=MUTED, lw=1, ls=(0, (2, 4)), alpha=0.5, zorder=0)     # center guide
ax.add_patch(Circle((0, L), 0.09, fill=False, ec=BAL_C, lw=1.6, ls=(0, (3, 3)), alpha=0.6, zorder=1))
ax.plot(0, L, marker='+', color=BAL_C, ms=11, mew=1.6, alpha=0.8, zorder=1)  # upright goal

# moving artists -----------------------------------------------
cart = FancyBboxPatch((-cart_w/2, -cart_h), cart_w, cart_h,
                      boxstyle='round,pad=0,rounding_size=0.05',
                      facecolor=CART_C, edgecolor=CART_E, lw=2, zorder=5)
ax.add_patch(cart)
wheel_l = Circle((-cart_w*0.28, -cart_h), wheel_r, facecolor=WHEEL_C, edgecolor=WHEEL_E, lw=2, zorder=4)
wheel_r_ = Circle((cart_w*0.28, -cart_h), wheel_r, facecolor=WHEEL_C, edgecolor=WHEEL_E, lw=2, zorder=4)
ax.add_patch(wheel_l); ax.add_patch(wheel_r_)

pole_line, = ax.plot([], [], '-', lw=7, color=SWING_C, solid_capstyle='round', zorder=6)
bob_glow = Circle((0, 0), 0.13, facecolor=SWING_C, alpha=0.22, zorder=6, ec='none')
bob      = Circle((0, 0), 0.065, facecolor=SWING_C, edgecolor='white', lw=1.2, zorder=8)
pivot    = Circle((0, 0), 0.035, facecolor=TEXT_C, edgecolor=CART_E, lw=1, zorder=9)
ax.add_patch(bob_glow); ax.add_patch(bob); ax.add_patch(pivot)

mode_text = ax.text(0.015, 0.93, '', transform=ax.transAxes, va='center', ha='left',
                    fontsize=12, fontweight='bold', color=BG, zorder=10,
                    bbox=dict(boxstyle='round,pad=0.45', fc=SWING_C, ec='none'))


def draw_pose(x, theta):
    """Place every moving artist for a single (x, theta)."""
    tip_x = x + L*math.sin(theta)
    tip_y = L*math.cos(theta)
    pole_line.set_data([x, tip_x], [0, tip_y])
    cart.set_x(x - cart_w/2); cart.set_y(-cart_h)
    wheel_l.set_center((x - cart_w*0.28, -cart_h))
    wheel_r_.set_center((x + cart_w*0.28, -cart_h))
    pivot.set_center((x, 0))
    bob.set_center((tip_x, tip_y))
    bob_glow.set_center((tip_x, tip_y))


draw_pose(0.0, THETA0)   # starting pose


# ---------------- widgets ----------------
def make_slider(y, label, lo, hi, init):
    sax = fig.add_axes((0.30, y, 0.5, 0.025), facecolor=PANEL)
    s = Slider(sax, label, lo, hi, valinit=init, valstep=1, valfmt='%d',
               color=CART_C, initcolor='none')
    s.label.set_color(TEXT_C); s.label.set_fontsize(10)
    s.valtext.set_color(TEXT_C)
    try:
        s.track.set_facecolor(PANEL)   # darken the unfilled portion to match theme
    except AttributeError:
        pass
    return s

s_kp     = make_slider(0.330, 'Kp', 0, 500, KP0)
s_kd     = make_slider(0.285, 'Kd', 0, 150, KD0)
s_kx     = make_slider(0.240, 'Kx', 0, 100, KX0)
s_kv     = make_slider(0.195, 'Kv', 0, 100, KV0)
s_kswing = make_slider(0.150, 'k_swing', 0, 20, k_swing)


def make_button(x, label, color):
    b = Button(fig.add_axes((x, 0.045, 0.18, 0.06)), label, color=color, hovercolor=HOVER)
    b.label.set_color('white'); b.label.set_fontweight('bold')
    return b

b_start = make_button(0.30, 'START', '#10b981')
b_reset = make_button(0.55, 'RESET', '#334155')

ani = None   # keep a handle so the animation isn't garbage-collected


def update(frame):
    theta = theta_history[frame]
    x = x_history[frame]
    draw_pose(x, theta)

    theta_wrapped = (theta + math.pi) % (2*math.pi) - math.pi
    if abs(theta_wrapped) <= switch_angle:
        c, mode = BAL_C, 'BALANCE'
    else:
        c, mode = SWING_C, 'SWING-UP'
    pole_line.set_color(c)
    bob.set_facecolor(c); bob_glow.set_facecolor(c)
    mode_text.set_text(f'{mode}   {math.degrees(theta_wrapped):+.1f}°')
    mode_text.get_bbox_patch().set_facecolor(c)
    return pole_line, cart, wheel_l, wheel_r_, pivot, bob, bob_glow, mode_text


def start(event):
    global ani, theta_history, x_history
    theta_history, x_history = run_sim(s_kp.val, s_kd.val, s_kx.val, s_kv.val, s_kswing.val)
    if ani is not None and ani.event_source is not None:
        ani.event_source.stop()
    ani = FuncAnimation(fig, update, frames=len(theta_history),
                        interval=dt*1000, blit=False, repeat=False,
                        cache_frame_data=False)
    fig.canvas.draw_idle()


def reset(event):
    global ani
    if ani is not None:
        if ani.event_source is not None:
            ani.event_source.stop()
        ani = None
    s_kp.reset(); s_kd.reset(); s_kx.reset(); s_kv.reset(); s_kswing.reset()
    pole_line.set_color(SWING_C); bob.set_facecolor(SWING_C); bob_glow.set_facecolor(SWING_C)
    mode_text.set_text('');
    draw_pose(0.0, THETA0)
    fig.canvas.draw_idle()


b_start.on_clicked(start)
b_reset.on_clicked(reset)

plt.show()
