import csv
import os
from collections import defaultdict

# Define the name to area mappings
name_to_area = {
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

# Statistics counters
stats = defaultdict(int)

def replace_areas(input_file, output_file):
    with open(input_file, 'r', newline='') as infile, open(output_file, 'w', newline='') as outfile:
        reader = csv.reader(infile)
        writer = csv.writer(outfile)
        
        # Read header row
        header = next(reader)
        writer.writerow(header)
        
        # Process each row
        for row in reader:
            name = row[0]
            if name in name_to_area:
                original_area = row[3]
                new_area = name_to_area[name]
                
                # If the area is already the target area, no change needed
                if original_area != new_area:
                    row[3] = new_area
                    stats[(name, original_area, new_area)] += 1
            
            writer.writerow(row)

def generate_report(report_file):
    with open(report_file, 'w') as f:
        f.write("Name Area Replacement Report\n")
        f.write("==========================\n\n")
        
        total_replacements = 0
        for (name, original, new), count in sorted(stats.items()):
            f.write(f"{name}: {count} instances of '{original}' replaced with '{new}'\n")
            total_replacements += count
        
        f.write(f"\nTotal replacements: {total_replacements}\n")

if __name__ == "__main__":
    input_file = "dataset.csv"
    output_file = "dataset_updated.csv"
    report_file = "replacement_report.txt"
    
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found.")
        exit(1)
    
    print(f"Processing {input_file}...")
    replace_areas(input_file, output_file)
    generate_report(report_file)
    
    print(f"Replacement complete. Updated data saved to {output_file}")
    print(f"Replacement statistics saved to {report_file}") 