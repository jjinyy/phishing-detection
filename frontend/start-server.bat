@echo off
echo Starting web server...
cd /d %~dp0
python -m http.server 3001
pause

