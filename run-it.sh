#!/bin/zsh

# Build the React app for production
cd src/ui && npm run build || exit 1
cd ../..

# Start the Electron app, loading the built React app (production mode)
cd src/electron && npx electron . --no-sandbox --disable-dev-mode --gtk-version=3 || exit 1
