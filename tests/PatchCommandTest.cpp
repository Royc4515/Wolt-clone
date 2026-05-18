// Tests for PatchCommand (SCRUM-102).
// PatchCommand is the mirror image of PostCommand: it appends products
// to an existing user.
//   - user exists       -> append products, "204 No Content\n"
//   - user does NOT exist -> no write, "404 Not Found\n"
//
// Like POST, syntactic validation belongs to the CLI upstream;
// PatchCommand assumes its inputs were already parsed and validated.

#include <gtest/gtest.h>
#include "MockDatabase.h"
#include "../src/PatchCommand.h"


// Happy path: an existing user receives new products and we get 204.
// Verifies both the response code and that the products were appended
// (not replaced) — the assertion on size 4 (was 2, +2 new) catches a
// buggy implementation that would overwrite instead of appending.
TEST(PatchCommandTest, ExistingUser_ReturnsNoContent_AndProductsAppended) {
    MockDatabase db;
    db.setData({{1, {100, 101}}});

    PatchCommand cmd(db, db, 1, {200, 201});

    EXPECT_EQ(cmd.execute(), "204 No Content\n");

    const auto& data = db.getAllData();
    ASSERT_EQ(data.at(1).size(), 4u) << "PATCH must append, not replace";
    EXPECT_EQ(data.at(1).at(0), 100);
    EXPECT_EQ(data.at(1).at(1), 101);
    EXPECT_EQ(data.at(1).at(2), 200);
    EXPECT_EQ(data.at(1).at(3), 201);
}


// A PATCH against a user that was never POSTed is logically invalid.
// We also verify no side effects: the user must NOT be created as a
// result (otherwise a future POST would mistakenly return 404).
TEST(PatchCommandTest, MissingUser_ReturnsNotFound_AndDoesNotCreate) {
    MockDatabase db;

    PatchCommand cmd(db, db, 1, {100, 101});

    EXPECT_EQ(cmd.execute(), "404 Not Found\n");

    const auto& data = db.getAllData();
    EXPECT_EQ(data.find(1), data.end()) << "PATCH must not create the user";
    EXPECT_TRUE(data.empty());
}


// Edge case: PATCH on a user whose product list was emptied by a
// previous DELETE. The user key still exists, so PATCH is valid
// and should append the new products (resulting in size == new count).
// This guards against a bug where the implementation only treats
// "non-empty existing user" as existing.
TEST(PatchCommandTest, ExistingUserWithEmptyList_AppendsAndReturnsNoContent) {
    MockDatabase db;
    db.setData({{1, {}}});  // user exists but has no products

    PatchCommand cmd(db, db, 1, {500, 501, 502});

    EXPECT_EQ(cmd.execute(), "204 No Content\n");

    const auto& data = db.getAllData();
    ASSERT_EQ(data.at(1).size(), 3u);
    EXPECT_EQ(data.at(1).at(0), 500);
    EXPECT_EQ(data.at(1).at(1), 501);
    EXPECT_EQ(data.at(1).at(2), 502);
}
