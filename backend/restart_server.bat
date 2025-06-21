@echo off
echo ========================================
echo    Redémarrage du serveur FastAPI
echo ========================================

echo.
echo 1. Arrêt des processus existants...
taskkill /f /im python.exe 2>nul
taskkill /f /im uvicorn.exe 2>nul

echo.
echo 2. Attente de 3 secondes...
timeout /t 3 /nobreak >nul

echo.
echo 3. Démarrage du serveur optimisé...
python run_server.py

pause 