// This tests class will check only the *validity* of the input, not its logic.

#include <gtest/gtest.h>
#include "../src/Recommender.h"
#include "../src/RouterCommand.h"
#include "MockDatabase.h"

using namespace std;

class RouterCommandTest : public ::testing::Test {
    protected:
        MockDatabase mock;
        Recommender recommender;
        RouterCommand router;

        RouterCommandTest() 
        : recommender(&mock),
          router(recommender, &mock, &mock, &mock) {
            mock.loadFakeData();
          }
};

// ==========================================
// 1. VALID CASES TESTS (Add New User)
// ==========================================

TEST_F(RouterCommandTest, PostValid) {
    string res = router.route("POST 55 101 102");
    EXPECT_EQ(res, "201 Created\n");
}

TEST_F(RouterCommandTest, PatchValid) {
    string res = router.route("PATCH 1 110");
    EXPECT_EQ(res, "204 No Content\n");
}

TEST_F(RouterCommandTest, DeleteValid) {
    string res = router.route("DELETE 2 102");
    EXPECT_EQ(res, "204 No Content\n");
}

TEST_F(RouterCommandTest, GetValid) {
    string res = router.route("GET 1 104");
    string expected = "200 Ok\n\n105 106 111 110 112 113 107 108 109 114\n";
    EXPECT_EQ(res, expected);
}

TEST_F(RouterCommandTest, HelpValid) {
    string res = router.route("help");
    string expected = 
        "DELETE, arguments: [userid] [productid1] [productid2] ...\n"
        "GET, arguments: [userid] [productid]\n"
        "PATCH, arguments: [userid] [productid1] [productid2] ...\n"
        "POST, arguments: [userid] [productid1] [productid2] ...\n"
        "help\n";

    EXPECT_EQ(res, expected);
}

// ==========================================
// 2. INVALID CASES TESTS (Bad Request)
// ==========================================

TEST_F(RouterCommandTest, UnknownCommand) {
    string res = router.route("blabla 1 104");
    EXPECT_EQ(res, "400 Bad Request\n");
}

TEST_F(RouterCommandTest, EmptyInput) {
    string res = router.route("");
    EXPECT_EQ(res, "400 Bad Request\n");
}

// Not enough arguments for GET command.
TEST_F(RouterCommandTest, GetMissingArgs) {
    string res = router.route("GET 1");
    EXPECT_EQ(res, "400 Bad Request\n");
}

// Too many arguments for GET command.
TEST_F(RouterCommandTest, GetTooManyArgs) {
    string res = router.route("GET 1 104 105");
    EXPECT_EQ(res, "400 Bad Request\n");
}

// POST/PATCH/DELETE need at least 2 arguments.
TEST_F(RouterCommandTest, PostMissingArgs) {
    string res = router.route("POST 1"); 
    EXPECT_EQ(res, "400 Bad Request\n");
}

TEST_F(RouterCommandTest, PatchMissingArgs) {
    string res = router.route("PATCH 1"); 
    EXPECT_EQ(res, "400 Bad Request\n");
}

TEST_F(RouterCommandTest, DeleteMissingArgs) {
    string res = router.route("DELETE 1"); 
    EXPECT_EQ(res, "400 Bad Request\n");
}

// Help command doesn't have arguments.
TEST_F(RouterCommandTest, HelpExtraArgs) {
    string res = router.route("help me");
    EXPECT_EQ(res, "400 Bad Request\n");
}

// ==========================================
// 3. NON-INTEGER ARGUMENTS TESTS (Bad Request)
// ==========================================

TEST_F(RouterCommandTest, GetNonNumericUserId) {
    string res = router.route("GET abc 104");
    EXPECT_EQ(res, "400 Bad Request\n");
}

TEST_F(RouterCommandTest, GetNonNumericProductId) {
    string res = router.route("GET 1 104!");
    EXPECT_EQ(res, "400 Bad Request\n");
}

TEST_F(RouterCommandTest, PostWithFloat) {
    string res = router.route("POST 1 101.5 102");
    EXPECT_EQ(res, "400 Bad Request\n");
}

TEST_F(RouterCommandTest, PatchLettersArg) {
    string res = router.route("PATCH 1 105 x 106");
    EXPECT_EQ(res, "400 Bad Request\n");
}

TEST_F(RouterCommandTest, DeleteNegativeNumbers) {
    string res = router.route("DELETE -1 101");
    EXPECT_EQ(res, "400 Bad Request\n");
}