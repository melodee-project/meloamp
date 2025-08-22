#!/usr/bin/env fish

# Ensure yay is installed
if not type -q yay
    echo "yay not found. Please install yay first."
    exit 1
end

# Update package databases
yay -Syy

# Install Node.js (LTS, v18+), npm, and Electron
# Arch provides multiple Node.js versions. We'll pick nodejs-lts-iron (v20) or nodejs-lts-gallium (v18).
set NODEPKG nodejs-lts-iron

echo "Installing $NODEPKG, npm, and electron..."
yay -S --needed --noconfirm $NODEPKG npm electron

# Verify installations
echo ""
echo "Installed versions:"
node -v
npm -v
electron -v
