// This will contain all tests regarding the implementation of "recommend" command, using gtest.

#include <gtest/gtest.h>
#include "MockData.h"
#include "../src/Recommender.h"

using namespace std;

// Since inner functions are protected, we will create a test class that inherits the origin class and will test all function through it.
class RecommendTest : public Recommender {
    public:
        RecommendTest(IDataReadable* data) : Recommender(data) {}

        map<int, int> publicSimCalc(int userId) const {
            return similarityCalc(userId);
        }

        map<int, int> publicFilterByProd(const map<int, int>& similarUsers, int productId) const {
            return filterByProduct(similarUsers, productId);
        }

        map<int, int> publicProductWeightCalc(const std::map<int, int>& relevantUsers, int userId, int productId) const {
            return productWeightCalc(relevantUsers, userId, productId);
        }

        vector<int> publicSortDescendind(const std::map<int, int>& resultTable, int maxRecommendations) {
            return sortDescendind(resultTable, maxRecommendations);
        }

};

MockData mock;
RecommendTest testable(&mock);

// Test to check only the similarityCalc function. According to base example.
TEST(similarityCalc__Test, baseExample) {
    int testUser = 1;
    int testProduct = 104;
    map<int, int> result = testable.publicSimCalc(testUser);

    EXPECT_FALSE(result.empty());
    EXPECT_EQ(result.size(), 9);

    map<int, int> expected = {
        {2, 2}, {3, 1}, {4, 1}, {5, 3}, {6, 2}, {7, 1}, {8, 1}, {9, 2}, {10, 2}
    };
    EXPECT_EQ(result, expected);
}

// Test to check only the filtering function. According to base example.
TEST(filterByProd__Test, baseExample) {
    int testUser = 1;
    int testProduct = 104;

    map<int, int> similarities = {
        {2, 2}, {3, 1}, {4, 1}, {5, 3}, {6, 2}, {7, 1}, {8, 1}, {9, 2}, {10, 2}
    };
    map<int, int> result = testable.publicFilterByProd(similarities, testProduct);

    EXPECT_FALSE(result.empty());
    EXPECT_EQ(result.size(), 4);

    map<int,int> expected = {
        {2, 2}, {3, 1}, {6, 2}, {8, 1}
    };
    EXPECT_EQ(result, expected);
}

// Test case for a product that isn't in the dataset.
TEST(filterByProd__Test, productNotFound) {
    int testProduct = 999;
    map<int, int> similarities = {
        {2, 2}, {3, 1}, {4, 1}
    };

    map<int, int> result = testable.publicFilterByProd(similarities, testProduct);

    EXPECT_TRUE(result.empty());
}

// Test to check only the final calculation function. According to base example.
TEST(productWeight__Test, baseExample) {
    int testUser = 1;
    int testProduct = 104;

    map<int, int> relevant = {
        {2, 2}, {3, 1}, {6, 2}, {8, 1}
    };
    map<int, int> result = testable.publicProductWeightCalc(relevant, testUser, testProduct);

    EXPECT_FALSE(result.empty());
    EXPECT_EQ(result.size(), 10);

    map<int, int> expected = {
        {105, 4}, {106, 3}, {107, 1}, {108, 1}, {109, 1}, {110, 2}, {111, 3}, {112, 2}, {113, 2}, {114, 1}
    };
    
    EXPECT_EQ(result, expected);
}

// Test case for an empty relevant users list.
TEST(productWeight__Test, noRelevantUsers) {
    int testUser = 1;
    int testProduct = 104;
    map<int, int> emptyRel;

    map<int, int> result = testable.publicProductWeightCalc(emptyRel, testUser, testProduct);
    EXPECT_TRUE(result.empty());
}

// Test to check only the sorting function. According to base example.
TEST(sort__Test, baseExample) {
    map<int, int> finalScores = {
        {105, 4}, {106, 3}, {107, 1}, {108, 1}, {109, 1}, {110, 2}, {111, 3}, {112, 2}, {113, 2}, {114, 1}
    };

    vector<int> result = testable.publicSortDescendind(finalScores, 10);

    EXPECT_FALSE(result.empty());
    EXPECT_EQ(result.size(), 10);

    vector<int> expected = {105, 106, 111, 110, 112, 113, 107, 108, 109, 114};
    EXPECT_EQ(result, expected);
}

// Test to check a score tie breaker logic.
TEST(sort__Test, tieBreaker) {
    map<int, int> finalScores = {
        {100, 5}, {40, 5}, {80, 5}
    };

    vector<int> result = testable.publicSortDescendind(finalScores, 10);
    vector<int> expected = {40, 80, 100};

    EXPECT_EQ(result.size(), 3);
    EXPECT_EQ(result, expected);
}

// A test based on the example in the instructions file. Testing the entire recommend function.
TEST(recomAlgo, baseExample) {
    MockData mock;
    Recommender recommender(&mock);

    int testUser = 1;
    int testProduct = 104;
    vector<int> result = recommender.recommend(testUser, testProduct);

    ASSERT_FALSE(result.empty()); // Critical for the rest of the tests. If fails, the run stops.
    EXPECT_EQ(result.size(), 10);
    EXPECT_EQ(result[0], 105); // Checked earlier that the list isn't empty.

}

int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}