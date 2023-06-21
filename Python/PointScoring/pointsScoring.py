import os
import pandas as pd

# Points per position
POINTS = {
    1: 25,
    2: 18,
    3: 15,
    4: 12,
    5: 10,
    6: 8,
    7: 6,
    8: 4,
    9: 2,
    10: 1
}

def process_csv_files(directory):
    team_points = {}

    # List all CSV files in the directory
    files = [f for f in os.listdir(directory) if f.endswith('.csv')]

    for file in files:
        df = pd.read_csv(os.path.join(directory, file))

        for _, row in df.iterrows():
            team = row['Name']
            position_in_class = row['PIC']

            # Get the points for this position (if the position is in the POINTS dictionary)
            points = POINTS.get(position_in_class, 0)

            # Update points for team
            team_points[team] = team_points.get(team, 0) + points

    return team_points

directory = 'C:/Users/faulk/Documents/python/Python/PointScoring'
team_points = process_csv_files(directory)

# Print out points standings
print('Team Points:', team_points)

"""
directory = 'C:/Users/faulk/Documents/python/Python/PointScoring'  # replace this with your directory path
output_directory = 'C:/Users/faulk/Documents/python/Python/PointScoring/Output'

"""