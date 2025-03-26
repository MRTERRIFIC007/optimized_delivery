import pandas as pd

# Define the correct area for each customer
customer_areas = {
    'Aditya': 'Satellite',
    'Vivaan': 'Bopal',
    'Aarav': 'Vastrapur',
    'Meera': 'Paldi',
    'Diya': 'Thaltej',
    'Riya': 'Navrangpura',
    'Ananya': 'Bodakdev',
    'Aryan': 'Gota',
    'Ishaan': 'Maninagar',
    'Kabir': 'Chandkheda'
}

# Load the dataset
try:
    df = pd.read_csv('dataset.csv')
    
    # Make a backup of the original dataset
    df.to_csv('dataset_backup.csv', index=False)
    
    # Update the Area column to match the customer's assigned area
    for idx, row in df.iterrows():
        name = row['Name']
        if name in customer_areas:
            df.at[idx, 'Area'] = customer_areas[name]
    
    # Save the updated dataset
    df.to_csv('dataset.csv', index=False)
    
    print(f"Dataset updated successfully. {len(df)} records processed.")
    print("A backup of the original dataset has been saved as 'dataset_backup.csv'")
    
except Exception as e:
    print(f"Error updating dataset: {e}") 