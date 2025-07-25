#!/bin/bash

# Setup script to fix journalctl permissions for the web application
# Run this script as root on your server

echo "Setting up journalctl permissions for web application..."

# Get the user that runs the web application
# This is typically www-data, node, or the user you're running the app as
WEB_USER=${1:-"www-data"}

echo "Configuring permissions for user: $WEB_USER"

# Method 1: Add user to systemd-journal group
echo "Adding $WEB_USER to systemd-journal group..."
usermod -a -G systemd-journal $WEB_USER

# Method 2: Create sudoers entry for journalctl
echo "Creating sudoers entry for journalctl..."
cat > /etc/sudoers.d/journalctl << EOF
# Allow $WEB_USER to run journalctl without password
$WEB_USER ALL=(ALL) NOPASSWD: /usr/bin/journalctl
EOF

# Set proper permissions on sudoers file
chmod 440 /etc/sudoers.d/journalctl

# Method 3: Alternative - give read access to journal files
echo "Setting journal file permissions..."
chmod 644 /var/log/journal/*/system.journal 2>/dev/null || true

# Restart systemd-journald to apply changes
echo "Restarting systemd-journald..."
systemctl restart systemd-journald

echo ""
echo "Setup complete! Please restart your web application."
echo ""
echo "To test if it works, try running:"
echo "sudo -u $WEB_USER journalctl -u threshold-ecdsa-web@1 -f"
echo ""
echo "If you're still having issues, you can also try:"
echo "1. Check if the user exists: id $WEB_USER"
echo "2. Check journal access: sudo -u $WEB_USER journalctl --verify"
echo "3. Check sudoers: sudo -l -U $WEB_USER" 