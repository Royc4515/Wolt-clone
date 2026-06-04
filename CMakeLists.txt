cmake_minimum_required(VERSION 3.15)

project(WoltClone CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Using AddressSanitizer for debugging.
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fsanitize=address -g")

# Define the library
add_library(woltlib STATIC
    src/Logic/Recommender.cpp
    src/Data/DataManager.cpp
    src/Commands/HelpCommand.cpp
    src/Commands/GetCommand.cpp
    src/Commands/PostCommand.cpp
    src/Commands/PatchCommand.cpp
    src/Commands/DeleteCommand.cpp
    src/Commands/RouterCommand.cpp
    src/Server/Server.cpp
)

target_include_directories(woltlib PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Commands
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Data
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Logic
    ${CMAKE_CURRENT_SOURCE_DIR}/src/Server
)

target_compile_features(woltlib PUBLIC cxx_std_17)

# Testing setup
enable_testing()
add_subdirectory(cpp-tests)

#Define the database path as a compile definition for the library
target_compile_definitions(woltlib PRIVATE DATABASE_PATH="${CMAKE_CURRENT_SOURCE_DIR}/data/database.txt")


# Define the executable ONLY ONCE
add_executable(WoltClone src/main.cpp)

# Link the library to the executable
target_link_libraries(WoltClone PRIVATE woltlib)
