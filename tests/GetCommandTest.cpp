#include <gtest/gtest.h>
#include "../src/MockData.h"
#include "../src/Recommender.h"
#include "../src/GetCommand.h"

using namespace std;

class GetCommandTest : public ::testing::Test {
    protected:
        MockData mock;
        Recommender recommender;
        GetCommand getCmd;

        GetCommandTest() : recommender(&mock), getCmd(recommender) {}
};

TEST_F(GetCommandTest, ValidInput) {
    string output = getCmd.execute("1", "104");
    string expected = "200 Ok\n\n105 106 111 110 112 113 107 108 109 114\n";

    EXPECT_EQ(output, expected);
}

TEST_F(GetCommandTest, UserNotFound) {
    string output = getCmd.execute("999", "104");
    EXPECT_EQ(output, "404 Not Found\n");
}

TEST_F(GetCommandTest, productNotFound) {
    string output = getCmd.execute("1", "999");
    EXPECT_EQ(output, "404 Not Found\n");
}