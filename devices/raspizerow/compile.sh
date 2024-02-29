#!/bin/bash

# Create a build directory
mkdir -p build
cd build

# Generate build files using CMake
cmake ..

# Build the project using make
make

cp -f main ..