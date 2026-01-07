# Gemini (modified)

import os
import sys
import shutil
import subprocess
import glob
from datetime import datetime
from dotenv import load_dotenv

# ANSI Colors for output
CYAN = "\033[96m"
GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"

def log_info(msg):
    print(f"{CYAN}[INFO] {msg}{RESET}")

def log_success(msg):
    print(f"{GREEN}{msg}{RESET}")

def log_error(msg):
    print(f"{RED}[ERROR] {msg}{RESET}")

def run_command(command, check=True, input_text=None, exit=True):
    """Runs a shell command and exits on failure if check is True."""
    try:
        subprocess.run(
            command,
            shell=True,
            check=check,
            input=input_text,
            text=True if input_text else False
        )
    except subprocess.CalledProcessError:
        log_error(f"Command failed: {command}")
        if exit:
            sys.exit(1)

def main():
    env_path = os.path.join(".git", ".env")
    if os.path.exists(env_path):
        log_info("Loading environment variables from .git/.env")
        load_dotenv(env_path, override=True)

    # log_info("Preparing firefox branch...")
    # run_command("git checkout firefox")
    # run_command("python publish.py", input_text="y")
    # run_command('git commit -am "Release"',exit=False)

    # log_info("Uploading firefox build to Firefox Add-ons...")
    # if os.path.exists("web-ext-artifacts"):
    #     shutil.rmtree("web-ext-artifacts")
    # if not os.path.exists("manifest.json"):
    #     os.symlink(os.getcwd() + "/static/manifest.json","manifest.json")
    # run_command('web-ext build -n source.zip --ignore-files build')
    # run_command(f'web-ext sign --approval-timeout 0 -s build/firefox --upload-source-code web-ext-artifacts/source.zip --channel listed --api-key "{os.environ.get("WEB_EXT_API_KEY")}" --api-secret "{os.environ.get("WEB_EXT_API_SECRET")}"')
    # shutil.rmtree("web-ext-artifacts")

    for branch in ["chrome", "online"]:
        log_info(f"Processing branch: {branch}")

        run_command(f"git checkout {branch}")
        run_command("git merge firefox")

        log_info("Running publish.py...")
        run_command("python publish.py", input_text="y\n")

        if branch == "online":
            log_info("Deploying online branch to Cloudflare Pages...")
            run_command(f'npx wrangler pages deploy build/online --branch=production --project-name "{os.environ.get("CLOUDFLARE_PROJECT")}"')

    # --- GitHub Release ---
    log_info(f"[INFO] Creating GitHub Release...")
    tag_name = datetime.now().strftime("v%Y.%m.%d-%H%M")

    # Resolve artifact paths
    artifact_files = glob.glob(os.path.join("build", "*.zip"))

    if artifact_files:
        files_str = " ".join(f'"{f}"' for f in artifact_files)
        run_command(f'gh release create "{tag_name}" {files_str} --generate-notes')
    else:
        print("[WARNING] No artifacts found to release.")

    log_success("\n[SUCCESS] Workflow completed.")

if __name__ == "__main__":
    main()
