@echo off
:: Переходим в директорию, где лежит этот бат-файл
cd /d "%~dp0"

echo Starting Pick & Ban Application...

:: 1. Запуск сервера (Backend) в новом окне
start "Backend Server (Node.js)" cmd /k "node server.js"

:: 2. Установка зависимостей и запуск фронтенда (Vite) в новом окне
start "Frontend Client (Vite)" cmd /k "npm install && npm run dev -- --host"

echo Done. Check the opened windows.
