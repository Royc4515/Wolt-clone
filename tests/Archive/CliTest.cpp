#include <gtest/gtest.h>
#include <sstream>
#include <string>
#include "../src/Cli.h"
#include "../src/DataManager.h"

using namespace std;

// runs the CLI with the given input and captures the output
string runCliWithInput(const string& inputStr) {
    stringstream simulatedInput(inputStr);
    stringstream simulatedOutput;
    Cli cli(simulatedInput, simulatedOutput);
    cli.run();
    return simulatedOutput.str();
}

// 1. valid help command should print the correct help message
TEST(CliTest, HelpCommandOutputCorrectly) {
    string output = runCliWithInput("help\n");
    string expectedOutput = "add [userid] [productid1] [productid2] ...\nrecommend [userid] [productid]\nhelp\n";
    EXPECT_EQ(output, expectedOutput);
}

// 2.help with "extra text" on the same line should not print anything
TEST(CliTest, HelpWithExtraTextShouldPrintNothing) {
    string output = runCliWithInput("help now\n");
    EXPECT_TRUE(output.empty()) << "Error: help with extra arguments should not produce output.";
}

// 3. multiple spaces between numbers in add are valid
TEST(CliTest, MultipleSpacesInAddShouldBeValid) {
    // we are checking here that the program does not "break" or ignore inputs.
    // currently the CLI only processes input, so we ensure there are no unexpected error messages.
    string output = runCliWithInput("add 1    100   200\n");
    EXPECT_TRUE(output.empty());
}

// 4. tab character within the command makes it invalid
TEST(CliTest, TabCharacterShouldBeInvalid) {
    string output = runCliWithInput("add 1\t100\n");
    EXPECT_TRUE(output.empty()) << "Error: Commands containing tabs should be ignored.";
}

// 5. recommend with too many arguments is invalid
TEST(CliTest, RecommendWithTooManyArgsShouldBeInvalid) {
    string output = runCliWithInput("recommend 1 100 999\n");
    EXPECT_TRUE(output.empty()) << "Error: recommend with more than 2 arguments should print nothing.";
}

// 6. input of IDs that are not numbers (strings) is invalid
TEST(CliTest, NonNumericIdsShouldBeInvalid) {
    // checking for recommend
    string outRec = runCliWithInput("recommend 1 abc\n");
    EXPECT_TRUE(outRec.empty()) << "Error: Product ID must be a number.";

    // checking for add
    string outAdd = runCliWithInput("add user1 100\n");
    EXPECT_TRUE(outAdd.empty()) << "Error: User ID must be a number.";
}

// 7. the program should continue running after an invalid command
TEST(CliTest, ProgramShouldContinueAfterInvalidCommand) {
    // we first send an invalid command "help garbage" which should be ignored, and then a valid "help" command which should print the help message.
    string input = "help garbage\nhelp\n";
    string output = runCliWithInput(input);
    
    string expectedHelpOutput = "add [userid] [productid1] [productid2] ...\nrecommend [userid] [productid]\nhelp\n";
    EXPECT_EQ(output, expectedHelpOutput) << "Error: CLI should process 'help' even after an invalid command.";
}