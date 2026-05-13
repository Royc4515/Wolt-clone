#include <gtest/gtest.h>
#include "../src/HelpCommand.h"
#include <string>

using namespace std;

TEST(HelpCommand___Test, ReturnsSortedList) {
    HelpCommand help;
    string output = help.execute();

    string expected = 
        "DELETE, arguments: [userid] [productid1] [productid2] ...\n"
        "GET, arguments: [userid] [productid]\n"
        "PATCH, arguments: [userid] [productid1] [productid2]...\n"
        "POST, arguments: [userid] [productid1] [productid2]...\n"
        "help\n";

    EXPECT_EQ(output, expected);
}