find_package(GTest REQUIRED)

add_executable(run_tests
    RecommendTest.cpp
    DataManagerTest.cpp
    DataManagerDeleteTest.cpp
    CliTest.cpp
    HelpCommandTest.cpp
    GetCommandTest.cpp
    PostCommandTest.cpp
    PatchCommandTest.cpp
)

target_link_libraries(run_tests PUBLIC GTest::gtest GTest::gtest_main pthread woltlib)