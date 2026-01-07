@echo off
setlocal EnableDelayedExpansion

:: --- Configuration ---
set "BRANCHES=firefox2 chrome online"
set "ARTIFACTS_DIR=release_artifacts"
set "SOURCE_ZIP=build\firefox.zip"

:: --- Load Environment Variables ---
if exist ".git\.env" (
    echo [INFO] Loading environment variables from .git\.env
    for /f "usebackq tokens=1* delims==" %%A in (".git\.env") do (
        set "line=%%A"
        if "!line:~0,1!" neq "#" set "%%A=%%B"
    )
)

:: Clean and create artifacts directory
if exist "%ARTIFACTS_DIR%" rmdir /s /q "%ARTIFACTS_DIR%"
mkdir "%ARTIFACTS_DIR%"
    
:: Discard changes from previous build (e.g. sample-settings.json) to allow checkout
git checkout firefox
git reset --hard

:: --- Build Loop ---
for %%B in (%BRANCHES%) do (
    echo.
    echo [INFO] Processing branch: %%B
    
    git checkout %%B
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to checkout %%B
        goto :error
    )

    git merge firefox
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to merge %%B with firefox
        goto :error
    )

    echo [INFO] Running publish.py...
    :: Pipe 'y' to satisfy the "Did you bump the version?" prompt
    echo y | python publish.py
    if !errorlevel! neq 0 (
        echo [ERROR] publish.py failed for %%B
        goto :error
    )

    :: Rename and move the artifact to prevent overwriting
    if exist "%SOURCE_ZIP%" (
        copy "%SOURCE_ZIP%" "%ARTIFACTS_DIR%\%%B.zip"
        echo [INFO] Archived build for %%B
    ) else (
        echo [WARNING] %SOURCE_ZIP% not found for branch %%B
    )

    :: Cloudflare Pages Upload (Only for online branch)
    if "%%B"=="online" (
        echo [INFO] Deploying online branch to Cloudflare Pages...
        call npx wrangler pages deploy build/firefox --project-name "%CLOUDFLARE_PROJECT%"
    )
)

:: --- GitHub Release ---
echo.
echo [INFO] Creating GitHub Release...
set "TAG_NAME=v%date:~10,4%.%date:~4,2%.%date:~7,2%-%time:~0,2%%time:~3,2%"
set "TAG_NAME=!TAG_NAME: =0!"

gh release create "!TAG_NAME!" "%ARTIFACTS_DIR%\*.zip" --generate-notes

:: --- Firefox Upload ---
echo.
echo [INFO] Uploading firefox2 build to Firefox Add-ons...
:: Using web-ext to sign/upload. Requires 'npm install -g web-ext'
:: call web-ext sign --source-dir build/firefox --channel listed --api-key "%WEB_EXT_API_KEY%" --api-secret "%WEB_EXT_API_SECRET%" --id "%EXTENSION_ID%"

echo [SUCCESS] Workflow completed.
goto :eof

:error
echo [FAIL] Workflow failed.
exit /b 1