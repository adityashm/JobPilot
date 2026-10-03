#!/usr/bin/env bash
set -e

echo "========================================================"
echo "JobPilot Local Environment Setup"
echo "========================================================"

echo "[1/3] Setting up Python API..."
cd apps/api
python -m pip install -r requirements.txt
cd ../..

echo "[2/3] Setting up Web Frontend..."
cd apps/web
npm install
cd ../..

echo "[3/3] Checking environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
fi

echo "Setup complete! Run 'docker compose up --build' or run api and web services."
