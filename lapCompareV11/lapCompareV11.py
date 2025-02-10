import dash
from dash import dcc, html, dash_table
import plotly.express as px
import pandas as pd
import json
import base64
import io
from dash.dependencies import Input, Output, State

# Initialize the Dash app
app = dash.Dash(__name__, external_stylesheets=["https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"])

# Layout
app.layout = html.Div([
    html.H1("IMSA Race Data Analyzer", className="text-center mt-4", style={"color": "#2c3e50"}),

    # File upload
    html.Div([
        dcc.Upload(
            id='upload-data',
            children=html.Div(['📂 Drag and Drop or Click to Upload JSON File']),
            style={
                'width': '80%', 'height': '60px', 'lineHeight': '60px',
                'borderWidth': '2px', 'borderStyle': 'dashed', 'borderRadius': '10px',
                'textAlign': 'center', 'margin': 'auto', 'color': '#2980b9'
            },
            multiple=False
        ),
    ], className="mb-4"),

    # Output message
    html.Div(id='error-message', className="text-center text-danger mt-3"),

    # Graphs & Insights
    html.Div(id='output-div', className="container mt-4")
])

# Callback to process the uploaded file
@app.callback(
    [Output('output-div', 'children'), Output('error-message', 'children')],
    Input('upload-data', 'contents'),
    State('upload-data', 'filename')
)
def update_output(content, filename):
    if content is None:
        return html.Div(), ""

    try:
        # Decode JSON file
        content_type, content_string = content.split(',')
        decoded = base64.b64decode(content_string)

        # Try loading JSON
        json_data = json.loads(decoded.decode('utf-8'))

        # Validate structure
        if "participants" not in json_data:
            raise ValueError("Invalid JSON format: Missing 'participants' key")

        # Extract relevant data
        participants = json_data["participants"]

        # Flattening lap data
        data = []
        for participant in participants:
            team = participant.get("team", "Unknown Team")
            drivers = participant.get("drivers", [])
            driver_name = ", ".join([f"{d.get('firstname', '')} {d.get('surname', '')}" for d in drivers])
            car_number = participant.get("number", "N/A")

            for lap in participant.get("laps", []):
                try:
                    lap_time = float(lap["time"].replace(":", "").replace(".", "")) if lap["time"] else None
                    avg_speed = float(lap["average_speed_kph"]) if lap["average_speed_kph"] else None
                except ValueError:
                    lap_time, avg_speed = None, None  # Handle bad data

                data.append({
                    "Team": team,
                    "Driver": driver_name,
                    "Car Number": car_number,
                    "Lap": lap.get("number", 0),
                    "Lap Time": lap_time,
                    "Average Speed (kph)": avg_speed
                })

        df = pd.DataFrame(data)

        if df.empty:
            return html.Div(), "No lap data found in the file."

        # Sort by Lap Number
        df = df.sort_values(by=["Lap"])

        # Creating Visuals
        fig_lap_times = px.line(df, x="Lap", y="Lap Time", color="Driver",
                                title="Lap Time Evolution",
                                labels={"Lap": "Lap Number", "Lap Time": "Lap Time (ms)"},
                                template="plotly_dark")

        fig_avg_speed = px.scatter(df, x="Lap", y="Average Speed (kph)", color="Driver",
                                   title="Average Speed per Lap",
                                   labels={"Lap": "Lap Number", "Average Speed (kph)": "Avg Speed (kph)"},
                                   template="plotly_dark", size_max=10)

        return [
            html.Div([
                html.H3("📊 Lap Time Analysis", className="text-center text-primary"),
                dcc.Graph(figure=fig_lap_times)
            ], className="card p-4 mb-4 shadow"),

            html.Div([
                html.H3("🏎️ Speed Trends", className="text-center text-danger"),
                dcc.Graph(figure=fig_avg_speed)
            ], className="card p-4 mb-4 shadow"),

            html.Div([
                html.H3("🏁 Race Insights", className="text-center text-warning"),
                html.P(f"Data Source: {filename}", className="text-center text-muted"),
                html.Hr(),
                dash_table.DataTable(
                    data=df.to_dict('records'),
                    columns=[{"name": i, "id": i} for i in df.columns],
                    page_size=10,
                    style_table={'overflowX': 'auto'}
                )
            ], className="card p-4 mb-4 shadow"),
        ], ""

    except json.JSONDecodeError:
        return html.Div(), "❌ Error: Invalid JSON file. Please upload a valid race data file."
    except ValueError as e:
        return html.Div(), f"❌ Error: {str(e)}"
    except Exception as e:
        return html.Div(), f"❌ Unexpected Error: {str(e)}"


# Run the app
if __name__ == '__main__':
    app.run_server(debug=True)
