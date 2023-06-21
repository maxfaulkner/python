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

def process_csv_files(directory, output_directory):
    team_points = {}

    # List all CSV files in the directory
    files = [f for f in os.listdir(directory) if f.endswith('.csv')]

    for file in files:
        df = pd.read_csv(os.path.join(directory, file))

        # New DataFrame for the modified data
        df_new = pd.DataFrame(columns=['Team', 'Points'])

        for index, row in df.iterrows():
            team = row['Name']
            position_in_class = row['PIC']

            # Get the points for this position (if the position is in the POINTS dictionary)
            points = POINTS.get(position_in_class, 0)

            # Update points for team
            team_points[team] = team_points.get(team, 0) + points

            # Add the team and points to the new DataFrame
            df_new.loc[index] = [team, points]

        # Save the new DataFrame as a CSV file
        df_new.to_csv(os.path.join(output_directory, file), index=False)

    return team_points

directory = 'C:/Users/faulk/Documents/python/Python/PointScoring'  # replace this with your directory path
output_directory = 'C:/Users/faulk/Documents/python/Python/PointScoring/Output'
team_points = process_csv_files(directory, output_directory)

# Print out points standings
print('Team Points:', team_points)
