#include <gtest/gtest.h>
#include "../src/MockData.h"
#include "../src/Recommender.h"
#include "../src/GetCommand.h"

using namespace std;

class GetCommandTest : public ::testing::Test {
    protected:
        MockData mock;
        Recommender recommender;

        GetCommandTest() : recommender(&mock) {}
};

// Test to check the output of a valid and logical request.
TEST_F(GetCommandTest, ValidInput) {
    GetCommand get(recommender, &mock, "1", "104");

    string output = get.execute();
    string expected = "200 Ok\n\n105 106 111 110 112 113 107 108 109 114\n";

    EXPECT_EQ(output, expected);
}

// Test to disqualify a non-existing user request.
TEST_F(GetCommandTest, UserNotFound) {
    GetCommand get(recommender, &mock, "999", "104");

    string output = get.execute();
    EXPECT_EQ(output, "404 Not Found\n");
}