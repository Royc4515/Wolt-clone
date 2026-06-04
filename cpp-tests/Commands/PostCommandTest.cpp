// Tests for PostCommand (SCRUM-101).
// PostCommand owns the business logic for the POST verb:
//  - new user                -> "201 Created\n" + persist
//  - already-existing user   -> "404 Not Found\n", no write
//
// Syntactic validation (numeric ids, argument count) is the CLI's
// responsibility upstream and is NOT covered here.

#include <gtest/gtest.h>
#include "../Data/MockDatabase.h"
#include "../src/Commands/PostCommand.h"


// Happy path: an empty database accepts a new user and replies 201.
TEST(PostCommandTest, NewUser_ReturnsCreated) {
    MockDatabase db;
    PostCommand cmd(db, db, 1, {100, 101});

    EXPECT_EQ(cmd.execute(), "201 Created\n");
}


// A successful POST must actually persist the data, not just reply 201.
// We verify by inspecting the mock's state after execute().
TEST(PostCommandTest, NewUser_WritesDataToDatabase) {
    MockDatabase db;
    PostCommand cmd(db, db, 1, {100, 101});

    cmd.execute();

    const auto& data = db.getAllData();
    ASSERT_NE(data.find(1), data.end());
    ASSERT_EQ(data.at(1).size(), 2u);
    EXPECT_EQ(data.at(1).at(0), 100);
    EXPECT_EQ(data.at(1).at(1), 101);
}


// Existing user must yield 404 AND must not modify any state.
// The second assertion is critical: a buggy implementation might
// reply 404 but still call writeInteraction, corrupting the user's
// list. We verify both the response AND the absence of side effects.
TEST(PostCommandTest, ExistingUser_ReturnsNotFound_AndDoesNotWrite) {
    MockDatabase db;
    db.setData({{1, {100, 101}}});  // user 1 already exists

    PostCommand cmd(db, db, 1, {200, 201});

    EXPECT_EQ(cmd.execute(), "404 Not Found\n");

    const auto& data = db.getAllData();
    ASSERT_EQ(data.at(1).size(), 2u) << "existing user must not be modified";
    EXPECT_EQ(data.at(1).at(0), 100);
    EXPECT_EQ(data.at(1).at(1), 101);
}
