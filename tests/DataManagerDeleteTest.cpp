// Tests for DataManager's IDataDeletable implementation (SCRUM-103).
// Each test uses a unique temporary file so it can run in isolation.

#include <gtest/gtest.h>
#include <cstdio>     // for std::remove
#include <string>
#include <vector>
#include "../src/DataManager.h"

using namespace std;

// Helper: remove the file both before and after the test runs.
static void clean(const string& path) {
    remove(path.c_str());
}


// Basic case: a single product is removed from the user's vector,
// the other products remain in their original order.
TEST(DataManagerDeleteTest, DeleteSingleProduct_RemovesOnlyThatProduct) {
    const string path = "test_delete_single.txt";
    clean(path);

    DataManager db(path);
    db.writeInteraction(1, {101, 102, 103});

    db.deleteProducts(1, {102});

    const auto& data = db.getAllData();
    ASSERT_NE(data.find(1), data.end());
    ASSERT_EQ(data.at(1).size(), 2u);
    EXPECT_EQ(data.at(1).at(0), 101);
    EXPECT_EQ(data.at(1).at(1), 103);

    clean(path);
}


// Removing several products in one call.
TEST(DataManagerDeleteTest, DeleteMultipleProducts_RemovesAllRequested) {
    const string path = "test_delete_multi.txt";
    clean(path);

    DataManager db(path);
    db.writeInteraction(1, {101, 102, 103, 104, 105});

    db.deleteProducts(1, {102, 104});

    const auto& data = db.getAllData();
    ASSERT_EQ(data.at(1).size(), 3u);
    EXPECT_EQ(data.at(1).at(0), 101);
    EXPECT_EQ(data.at(1).at(1), 103);
    EXPECT_EQ(data.at(1).at(2), 105);

    clean(path);
}


// Critical invariant for the Wolt-Clone Ex2 semantics:
// even if the user's product list becomes empty as a result
// of deletion, the user key MUST remain in the in-memory map.
// Otherwise a subsequent POST to the same userId would mistakenly
// return 201 Created instead of 404 Not Found.
TEST(DataManagerDeleteTest, DeleteAllProducts_UserKeyStays) {
    const string path = "test_delete_all.txt";
    clean(path);

    DataManager db(path);
    db.writeInteraction(1, {101, 102});

    db.deleteProducts(1, {101, 102});

    const auto& data = db.getAllData();
    ASSERT_NE(data.find(1), data.end()) << "user key must remain after emptying";
    EXPECT_TRUE(data.at(1).empty());

    clean(path);
}


// The file must be rewritten so that a fresh DataManager instance
// loading from the same file reflects the deletion.
// This is what proves that append-only is no longer sufficient
// and that the rewriteFile helper actually persists state.
TEST(DataManagerDeleteTest, DeletePersists_AcrossInstances) {
    const string path = "test_delete_persist.txt";
    clean(path);

    {
        DataManager dbWriter(path);
        dbWriter.writeInteraction(1, {101, 102, 103});
        dbWriter.writeInteraction(2, {201, 202});
        dbWriter.deleteProducts(1, {102});
    }

    {
        DataManager dbReader(path);
        const auto& data = dbReader.getAllData();
        ASSERT_EQ(data.size(), 2u);
        ASSERT_EQ(data.at(1).size(), 2u);
        EXPECT_EQ(data.at(1).at(0), 101);
        EXPECT_EQ(data.at(1).at(1), 103);
        EXPECT_EQ(data.at(2).size(), 2u);
    }

    clean(path);
}


// Defensive: DataManager.deleteProducts is the low-level data layer.
// Logical validation (does the user exist?) belongs in DeleteCommand,
// not here. A call with an unknown userId must be a silent no-op,
// not throw.
TEST(DataManagerDeleteTest, DeleteFromNonExistentUser_IsNoOp) {
    const string path = "test_delete_unknown_user.txt";
    clean(path);

    DataManager db(path);
    db.writeInteraction(1, {101});

    // userId 999 was never written
    db.deleteProducts(999, {101});

    const auto& data = db.getAllData();
    EXPECT_EQ(data.size(), 1u);
    EXPECT_EQ(data.at(1).size(), 1u);
    EXPECT_EQ(data.find(999), data.end());

    clean(path);
}


// Defensive: requesting deletion of products that are not in the
// user's list must leave the existing products untouched and not throw.
// Mix of present + absent: the present ones are removed, the absent
// ones are simply ignored.
TEST(DataManagerDeleteTest, DeleteMixOfFoundAndUnknownProducts_RemovesOnlyFound) {
    const string path = "test_delete_mixed.txt";
    clean(path);

    DataManager db(path);
    db.writeInteraction(1, {101, 102, 103});

    db.deleteProducts(1, {102, 999, 888});

    const auto& data = db.getAllData();
    ASSERT_EQ(data.at(1).size(), 2u);
    EXPECT_EQ(data.at(1).at(0), 101);
    EXPECT_EQ(data.at(1).at(1), 103);

    clean(path);
}
