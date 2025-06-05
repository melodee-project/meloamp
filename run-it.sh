#!/bin/zsh

# Run the Electron app with the React build

# Build React app
cd src/ui && npm run build
cd ../electron

# Copy React build to Electron if needed (optional, for static serving)
# cp -r ../ui/build ./build

# Start Electron
npx electron . --gtk-version=3
