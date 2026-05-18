cmake_minimum_required(VERSION 3.15)

project(WoltClone CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Define the library
add_library(woltlib STATIC
    src/Recommender.cpp
    src/Cli.cpp
    src/DataManager.cpp
    src/HelpCommand.cpp
    src/MockData.cpp
    src/GetCommand.cpp
    src/PostCommand.cpp
    src/PatchCommand.cpp
    src/DeleteCommand.cpp
)
target_include_directories(woltlib PUBLIC src)
target_compile_features(woltlib PUBLIC cxx_std_17)

# Testing setup
enable_testing()
add_subdirectory(tests)

#Define the database path as a compile definition for the library
target_compile_definitions(woltlib PRIVATE DATABASE_PATH="${CMAKE_CURRENT_SOURCE_DIR}/data/database.txt")


# Define the executable ONLY ONCE
add_executable(WoltClone src/main.cpp)

# Link the library to the executable
target_link_libraries(WoltClone PRIVATE woltlib)
