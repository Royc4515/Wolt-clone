find_package(GTest REQUIRED)

add_executable(run_tests RecommendTest.cpp MockData.cpp DataManagerTest.cpp CliTest.cpp HelpCommandTest.cpp)

target_link_libraries(run_tests PUBLIC GTest::gtest GTest::gtest_main pthread woltlib)