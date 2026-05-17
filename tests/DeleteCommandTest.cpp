// Tests for DeleteCommand (SCRUM-104).
// DeleteCommand removes specific products from an existing user.
//
// Logic per Ex2.pdf, STRICT interpretation:
//   - user does NOT exist                                -> 404 Not Found
//   - user exists, ANY requested product is missing from
//     their list                                         -> 404 Not Found
//     (PDF: "DELETE something that wasn't PATCH/POSTed";
//      we read this as all-or-nothing: every requested product
//      must already be in the user's list)
//   - user exists AND every requested product is in their
//     list                                               -> 204 No Content
//     (and all requested products are removed)
//
// Syntactic validation is the CLI's responsibility upstream.

#include <gtest/gtest.h>
#include "MockDatabase.h"
#include "../src/DeleteCommand.h"


// Happy path: a single product is removed from an existing user.
TEST(DeleteCommandTest, DeleteOneProduct_FromExistingUser_ReturnsNoContent) {
    MockDatabase db;
    db.setData({{1, {100, 101, 102}}});

    DeleteCommand cmd(db, db, 1, {101});

    EXPECT_EQ(cmd.execute(), "204 No Content\n");

    const auto& data = db.getAllData();
    ASSERT_EQ(data.at(1).size(), 2u);
    EXPECT_EQ(data.at(1).at(0), 100);
    EXPECT_EQ(data.at(1).at(1), 102);
}


// Multiple products removed in one call, all present in the user's list.
TEST(DeleteCommandTest, DeleteMultipleProducts_AllPresent_ReturnsNoContent) {
    MockDatabase db;
    db.setData({{1, {100, 101, 102, 103, 104}}});

    DeleteCommand cmd(db, db, 1, {101, 103});

    EXPECT_EQ(cmd.execute(), "204 No Content\n");

    const auto& data = db.getAllData();
    ASSERT_EQ(data.at(1).size(), 3u);
    EXPECT_EQ(data.at(1).at(0), 100);
    EXPECT_EQ(data.at(1).at(1), 102);
    EXPECT_EQ(data.at(1).at(2), 104);
}


// DELETE for a userId that was never POSTed is logically invalid.
// We also verify no side effects: the user must NOT be created.
TEST(DeleteCommandTest, MissingUser_ReturnsNotFound_AndDoesNotCreate) {
    MockDatabase db;

    DeleteCommand cmd(db, db, 999, {100, 101});

    EXPECT_EQ(cmd.execute(), "404 Not Found\n");

    const auto& data = db.getAllData();
    EXPECT_EQ(data.find(999), data.end()) << "DELETE must not create the user";
    EXPECT_TRUE(data.empty());
}


// User exists but NONE of the requested products are in their list.
// Per Ex2.pdf this is "DELETE something that wasn't PATCH/POSTed" -> 404.
// State must be unchanged.
TEST(DeleteCommandTest, ExistingUser_NoMatchingProducts_ReturnsNotFound) {
    MockDatabase db;
    db.setData({{1, {100, 101}}});

    DeleteCommand cmd(db, db, 1, {999, 888});

    EXPECT_EQ(cmd.execute(), "404 Not Found\n");

    const auto& data = db.getAllData();
    ASSERT_EQ(data.at(1).size(), 2u) << "user's products must be untouched";
    EXPECT_EQ(data.at(1).at(0), 100);
    EXPECT_EQ(data.at(1).at(1), 101);
}


// Strict semantics: even if one of the requested products is present
// in the user's list, the presence of ANY missing product invalidates
// the whole request. The user's list MUST remain untouched (no partial
// deletion). This is the critical guarantee of the strict reading of
// Ex2.pdf and is what distinguishes our contract from a permissive one.
TEST(DeleteCommandTest, ExistingUser_AnyProductMissing_ReturnsNotFound_AndDoesNotModify) {
    MockDatabase db;
    db.setData({{1, {100, 101, 102}}});

    DeleteCommand cmd(db, db, 1, {101, 999});  // 101 present, 999 absent

    EXPECT_EQ(cmd.execute(), "404 Not Found\n");

    const auto& data = db.getAllData();
    ASSERT_EQ(data.at(1).size(), 3u) << "no partial deletion is allowed";
    EXPECT_EQ(data.at(1).at(0), 100);
    EXPECT_EQ(data.at(1).at(1), 101);
    EXPECT_EQ(data.at(1).at(2), 102);
}
