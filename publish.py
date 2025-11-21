import os, dotenv
import json
import subprocess
from pathlib import Path

dotenv.load_dotenv()
my_settings = os.environ.get("SETTINGS_DIR")

if not my_settings:
    exit()

directory_path = Path(my_settings)
samplePath = Path()
try:
    entries = [entry for entry in directory_path.iterdir()]
    sorted_entries = sorted(entries, key=lambda entry: entry.stat().st_mtime, reverse=True)
    for entry in sorted_entries:
        # Get the modification time and format it
        if "car-calculator-settings" in entry.name:
            print(f"Found file: {entry.name}")
            samplePath = entry.resolve()
            break
except FileNotFoundError:
    print(f"Error: Directory not found at '{directory_path}'")
    exit()

# print(samplePath)
sampleJson: dict = json.load(samplePath.open())
sampleJson["settings"].pop("blackList")
sampleJson.pop("cars")
# print(json.dumps(sampleJson,indent=4))
with open("static/sample-settings.json","w") as f:
    json.dump(sampleJson,f,indent=4)

print("Running npm build...")
subprocess.run("npm run build", shell=True, check=True)

print("Creating deployment archive...")
archive_name = "build/firefox.zip"
build_folder = "build/firefox/"  # Assuming npm build outputs to a 'dist' folder

command = ["7z", "a", "-aoa", archive_name, f"./{build_folder}/*"]
subprocess.run(command, shell=True, check=True)

print(f"Successfully created {archive_name}")
