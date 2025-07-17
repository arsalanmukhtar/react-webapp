import os
import sys
import shutil

# Define constants for filtering
EXCLUDE_FOLDERS = ['__pycache__', '.venv', '.git', 'node_modules', '.DS_Store', 'dist', 'build', 'venv']
ALLOWED_EXTENSIONS = ['.py', '.css', '.jsx', '.js']
EXCLUDE_FILES = ['__init__.py'] # Explicitly exclude __init__.py files

def _get_pretty_directory_tree_lines_recursive(dir_path, prefix="", lines=None):
    """
    Helper function to recursively generate pretty-printed directory tree lines,
    applying file and folder filtering.
    """
    if lines is None:
        lines = []

    all_entries = sorted(os.listdir(dir_path))
    
    # Filter entries based on exclusion list for folders and allowed extensions/names for files
    filtered_entries = []
    for entry in all_entries:
        path = os.path.join(dir_path, entry)
        if os.path.isdir(path):
            if entry not in EXCLUDE_FOLDERS:
                filtered_entries.append(entry)
        else: # It's a file
            file_extension = os.path.splitext(entry)[1]
            if file_extension in ALLOWED_EXTENSIONS and entry not in EXCLUDE_FILES:
                filtered_entries.append(entry)

    for i, entry in enumerate(filtered_entries):
        path = os.path.join(dir_path, entry)
        is_last_entry = (i == len(filtered_entries) - 1)

        connector = "└── " if is_last_entry else "├── "
        
        if os.path.isdir(path):
            lines.append(f"{prefix}{connector}{entry}{os.sep}")
            next_prefix = prefix + ("    " if is_last_entry else "│   ")
            _get_pretty_directory_tree_lines_recursive(path, next_prefix, lines)
        else:
            lines.append(f"{prefix}{connector}{entry}")
            
    return lines

def generate_directory_structure_text(folder_path):
    """
    Generates a string representing the recursive directory structure,
    applying file and folder filtering.
    """
    structure_lines = []
    root_base_name = os.path.basename(folder_path)
    
    # Add the root folder itself as the first line (if not excluded)
    if root_base_name not in EXCLUDE_FOLDERS:
        structure_lines.append(root_base_name + os.sep)

    # Traverse the directory tree
    for dirpath, dirnames, filenames in os.walk(folder_path):
        # Filter out excluded directories in place
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_FOLDERS]
        
        # Filter files by allowed extensions and exclude specific file names
        filenames[:] = [f for f in filenames if os.path.splitext(f)[1] in ALLOWED_EXTENSIONS and f not in EXCLUDE_FILES]

        # Calculate path relative to the initial folder_path
        current_relative_path = os.path.relpath(dirpath, folder_path)

        # Add subdirectories (if not the root itself and not excluded)
        if current_relative_path != '.':
            # Prepend root_base_name to the relative path and add a trailing separator
            structure_lines.append(os.path.join(root_base_name, current_relative_path) + os.sep)
        
        # Add files within the current directory
        for filename in filenames:
            if current_relative_path == '.':
                # Files directly in the root folder
                structure_lines.append(os.path.join(root_base_name, filename))
            else:
                # Files in subdirectories
                structure_lines.append(os.path.join(root_base_name, current_relative_path, filename))
            
    return "\n".join(structure_lines)


def generate_pretty_directory_tree_text(folder_path):
    """
    Generates a string containing a pretty-printed directory tree,
    applying file and folder filtering.
    """
    lines = []
    root_base_name = os.path.basename(folder_path)

    # Add the root folder name as the first line of the tree (if not excluded)
    if root_base_name not in EXCLUDE_FOLDERS:
        lines.append(root_base_name + os.sep)
        # Call the recursive helper for the contents of the root directory
        _get_pretty_directory_tree_lines_recursive(folder_path, lines=lines)
    
    return "\n".join(lines)


def main():
    """
    Main function to process folder names from argv, copy filtered files,
    and generate combined directory structures and trees.
    """
    if len(sys.argv) < 3:
        print("Usage: python script_name.py <comma_separated_input_folders> <output_folder>")
        print("Example: python script_name.py my_project,another_folder output_dir")
        sys.exit(1)

    folders_input_str = sys.argv[1]
    output_folder_name = sys.argv[2]

    folders_to_analyze = [name.strip() for name in folders_input_str.split(',') if name.strip()]

    if not folders_to_analyze:
        print("No folder names provided in the input argument. Exiting.")
        sys.exit(1)

    # Create the main output folder if it doesn't exist
    try:
        os.makedirs(output_folder_name, exist_ok=True)
        print(f"Output folder '{output_folder_name}' ensured.")
    except OSError as e:
        print(f"Error creating output folder '{output_folder_name}': {e}")
        sys.exit(1)

    all_combined_structure_lines = []
    all_combined_tree_lines = []

    for folder_name in folders_to_analyze:
        print(f"\n--- Processing folder: {folder_name} ---")

        # Validate if the input folder exists and is a directory
        if not os.path.exists(folder_name):
            print(f"Error: Folder '{folder_name}' does not exist. Skipping.")
            continue
        if not os.path.isdir(folder_name):
            print(f"Error: '{folder_name}' is not a directory. Skipping.")
            continue
        
        # Add a header for each folder in the combined output files
        all_combined_structure_lines.append(f"### Structure for: {folder_name} ###\n")
        all_combined_tree_lines.append(f"### Tree for: {folder_name} ###\n")

        # --- Generate and Accumulate Recursive Directory Structure ---
        print("Generating recursive directory structure...")
        structure_content = generate_directory_structure_text(folder_name)
        all_combined_structure_lines.append(structure_content)
        all_combined_structure_lines.append("\n" + "="*50 + "\n") # Separator

        # --- Generate and Accumulate Pretty-Printed Directory Tree ---
        print("Generating pretty-printed directory tree...")
        pretty_tree_content = generate_pretty_directory_tree_text(folder_name)
        all_combined_tree_lines.append(pretty_tree_content)
        all_combined_tree_lines.append("\n" + "="*50 + "\n") # Separator

        # --- Copy Filtered Files ---
        print("Copying filtered files...")
        copied_count = 0
        for dirpath, dirnames, filenames in os.walk(folder_name):
            # Filter out excluded directories in place
            dirnames[:] = [d for d in dirnames if d not in EXCLUDE_FOLDERS]
            
            # Filter files by allowed extensions and exclude specific file names
            filenames[:] = [f for f in filenames if os.path.splitext(f)[1] in ALLOWED_EXTENSIONS and f not in EXCLUDE_FILES]

            for filename in filenames:
                source_path = os.path.join(dirpath, filename)
                # To avoid name collisions if files with the same name exist in different source folders,
                # you might want to prepend the source folder name or a hash.
                # For this request, we'll just copy, which will overwrite if names conflict.
                destination_path = os.path.join(output_folder_name, filename)
                try:
                    shutil.copy2(source_path, destination_path) # copy2 preserves metadata
                    print(f"  Copied: {filename}")
                    copied_count += 1
                except IOError as e:
                    print(f"  Error copying '{filename}': {e}")
        print(f"Finished copying files for '{folder_name}'. Total copied: {copied_count}")

    # --- Write Combined Output Files ---
    final_structure_output_file = os.path.join(output_folder_name, "combined_directory_structure.txt")
    try:
        with open(final_structure_output_file, "w", encoding='utf-8') as f: # Added encoding='utf-8'
            f.write("\n".join(all_combined_structure_lines))
        print(f"\nCombined recursive directory structure saved to '{final_structure_output_file}'")
    except IOError as e:
        print(f"Error writing to '{final_structure_output_file}': {e}")

    final_tree_output_file = os.path.join(output_folder_name, "combined_directory_tree.txt")
    try:
        with open(final_tree_output_file, "w", encoding='utf-8') as f: # Added encoding='utf-8'
            f.write("\n".join(all_combined_tree_lines))
        print(f"Combined pretty-printed directory tree saved to '{final_tree_output_file}'")
    except IOError as e:
        print(f"Error writing to '{final_tree_output_file}': {e}")

if __name__ == "__main__":
    main()
