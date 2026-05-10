# Use a Ubuntu environment to compile C++ (base image).
FROM ubuntu:22.04

# Set the working directory in the container.
WORKDIR /app

# Install the C++ compiler, CMake, and Gtest library.
RUN apt-get update && apt-get install -y build-essential cmake libgtest-dev

# Copy the main CMake configuration file.
COPY CMakeLists.txt ./

# Copy the project's folders into the container.
COPY ./src ./src
COPY ./tests ./tests
COPY ./data ./data

# Create a build directory, run CMake, and compile the project (app + tests).
RUN mkdir build && cd build && cmake .. && make

# Run the main CLI app.
CMD ["./build/WoltClone"]