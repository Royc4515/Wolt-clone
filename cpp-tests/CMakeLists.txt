find_package(GTest REQUIRED)

add_executable(run_tests
    Logic/RecommendTest.cpp
    Data/DataManagerTest.cpp
    Data/DataManagerDeleteTest.cpp
    Commands/HelpCommandTest.cpp
    Commands/GetCommandTest.cpp
    Commands/PostCommandTest.cpp
    Commands/PatchCommandTest.cpp
    Commands/DeleteCommandTest.cpp
    Commands/RouterCommandTest.cpp
    Server/ServerTest.cpp
)

target_link_libraries(run_tests PUBLIC GTest::gtest GTest::gtest_main pthread woltlib)