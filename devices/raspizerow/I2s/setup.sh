###THIS IS NOT READY TO USE###


#!/bin/bash

sudo apt-get update

# Install libasound2-dev and libcurl4-openssl-dev, checking if they are already installed
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


# Compile the project
echo "Compiling the project..."
g++ -std=c++11 main.cpp -g -o main -lasound -lcurl -lpthread
if [ $? -ne 0 ]; then
    echo "Compilation failed. Please check your source code and dependencies."
    exit 1
fi

echo "Setup completed successfully."