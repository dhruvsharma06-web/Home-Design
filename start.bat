@echo off
rem B4 website — starts a small local server (needed for the 3D textures) and opens the site.
cd /d "%~dp0"
start "" http://localhost:8080/
python -m http.server 8080
