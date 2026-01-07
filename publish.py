import os, dotenv
import json
import subprocess
from pathlib import Path

print("Running npm build...")
subprocess.run("npm run build", shell=True, check=True)

print("Creating deployment archive...")
archive_name = "build/online.zip"
build_folder = "build/online/"

if Path(archive_name).exists():
    os.remove(archive_name)

command = ["7z", "a", "-aoa", archive_name, f"./{build_folder}/*"]
subprocess.run(command, shell=True, check=True)

print(f"Successfully created {archive_name}")
