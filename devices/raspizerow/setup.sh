#!/bin/bash

sudo apt-get update

# Install portaudio19-dev and libcurl4-openssl-dev, checking if they are already installed
# and handling potential installation errors.

# Function to check if a package is installed
is_package_installed() {
    dpkg -l "$1" &> /dev/null
    return $?
}

# Function to install a package if not already installed
ensure_package_installed() {
    PACKAGE=$1
    if is_package_installed "$PACKAGE"; then
        echo "$PACKAGE is already installed."
    else
        echo "Installing $PACKAGE..."
        sudo apt-get install -y "$PACKAGE"
        if [ $? -ne 0 ]; then
            echo "Failed to install $PACKAGE. Exiting."
            exit 1
        fi
    fi
}

# Ensure portaudio19-dev and libcurl4-openssl-dev are installed
ensure_package_installed portaudio19-dev
ensure_package_installed libcurl4-openssl-dev

# Check for SUPABASE_URL environment variable
if [ -z "$SUPABASE_URL" ]; then
    echo "SUPABASE_URL environment variable is not set."
    read -p "Please enter the SUPABASE_URL value: " supabase_url
    export SUPABASE_URL=$supabase_url
    echo "SUPABASE_URL set to $SUPABASE_URL"
else
    echo "SUPABASE_URL is already set to $SUPABASE_URL"
fi

# Compile the project
echo "Compiling the project..."
g++ main.cpp -o main -lportaudio -lcurl
if [ $? -ne 0 ]; then
    echo "Compilation failed. Please check your source code and dependencies."
    exit 1
fi

echo "Setup completed successfully."
