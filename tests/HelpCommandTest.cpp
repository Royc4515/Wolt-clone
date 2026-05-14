#include <gtest/gtest.h>
#include "../src/HelpCommand.h"

using namespace std;

// Test to check the "help" output is as needed.
TEST(HelpCommand___Test, ReturnsSortedList) {
    // Building the map to send the help constructor.
    map<string, string> commandsMap = {
        {"POST", "[userid] [productid1] [productid2] ..."},
        {"DELETE", "[userid] [productid1] [productid2] ..."},
        {"GET", "[userid] [productid]"},
        {"PATCH", "[userid] [productid1] [productid2] ..."}
    };

    HelpCommand help(commandsMap);
    string output = help.execute();

    // Expected output.
    string expected = 
        "DELETE, arguments: [userid] [productid1] [productid2] ...\n"
        "GET, arguments: [userid] [productid]\n"
        "PATCH, arguments: [userid] [productid1] [productid2] ...\n"
        "POST, arguments: [userid] [productid1] [productid2] ...\n"
        "help\n";

    EXPECT_EQ(output, expected);
}