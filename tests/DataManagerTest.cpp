#include <gtest/gtest.h>
#include <fstream>
#include <cstdio> // For std::remove
#include <vector>
#include "../src/DataManager.h"

using namespace std;

// Test to verify that DataManager correctly stores and retrieves data
TEST(DataManagerTest, SCRUM_37_WriteAndReadInteraction) {
    // we create a temporary file path for testing
    string testPath = "test_scrum37.txt";
    remove(testPath.c_str()); // cleanup before test in case it already exists

    // we create a DataManager instance with the test file path. This simulates the CLI writing data.
    DataManager db(testPath); 
    
    // 1. Write data (Acting as the CLI)
    vector<int> products = {101, 102};
    db.writeInteraction(1, products);
    
    // 2. Read data (Acting as the Recommender)
    auto data = db.getAllData();
    
    // 3. Assertions
    ASSERT_NE(data.find(1), data.end()); // make sure user 1 exists in the data
    EXPECT_EQ(data.size(), 1); 
    EXPECT_EQ(data.at(1).size(), 2); 
    EXPECT_EQ(data.at(1).at(0), 101); 

    remove(testPath.c_str()); //cleanup after test
}

// Test to verify that DataManager correctly stores and retrieves data from a file
TEST(DataManagerTest, SCRUM_43_FilePersistence) {
    // create a temporary file path for testing persistence. This file will be created in the build directory.
    string testFilePath = "test_persistence.txt";
    remove(testFilePath.c_str());

    // 1. Write data with one instance of DataManager(simulating the CLI)
    {
        DataManager dbWriter(testFilePath);
        dbWriter.writeInteraction(1, {101, 102});
        dbWriter.writeInteraction(2, {201, 202, 203});
    }

    // 2. Read data with a new DataManager instance to verify persistence (simulating the Recommender)
    {
        DataManager dbReader(testFilePath);
        auto data = dbReader.getAllData();
        
        // 3. Assertions
        EXPECT_EQ(data.size(), 2); 
        
        // Check User 1
        ASSERT_NE(data.find(1), data.end());
        EXPECT_EQ(data.at(1).size(), 2); 
        EXPECT_EQ(data.at(1).at(0), 101); 
        
        // Check User 2
        ASSERT_NE(data.find(2), data.end());
        EXPECT_EQ(data.at(2).size(), 3); 
        EXPECT_EQ(data.at(2).at(2), 203); 
    }

    remove(testFilePath.c_str()); // cleanup after test
}