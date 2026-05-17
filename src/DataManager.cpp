#include "DataManager.h"
#include <fstream>
#include <sstream>
#include <iostream>

#ifndef DATABASE_PATH
#define DATABASE_PATH "data/database.txt" // Default file for the one created in CMakeLists.
#endif

using namespace std;

/**
 *constructor of DataManager
 * if path is empty, use the DATABASE_PATH defined in CMakeLists.txt
 */
DataManager::DataManager(const string& path) : filePath(path.empty() ? DATABASE_PATH : path) {
    loadDataFromFile();
}

void DataManager::loadDataFromFile() {
    ifstream file(filePath);
    
    // If the file doesn't exist yet (e.g., first run), just return
    if (!file.is_open()) {
        return;
    }

    string line;
    // Read the file line by line
    while (getline(file, line)) {
        stringstream ss(line);
        int userId;
        
        // The first number in the line is the userId
        if (ss >> userId) {
            int productId;
            // The rest of the numbers are productIds
            while (ss >> productId) {
                memoryMap[userId].push_back(productId);
            }
        }
    }
    file.close();
}

void DataManager::writeInteraction(int userId, const vector<int>& productIds) {
    // 1. Save to in-memory map
    for (int productId : productIds) {
        memoryMap[userId].push_back(productId);
    }

    // 2. Persist to file. Using ios::app to append to the end of the file.
    ofstream file(filePath, ios::app);
    if (file.is_open()) {
        file << userId;
        for (int productId : productIds) {
            file << " " << productId;
        }
        file << "\n";
        file.close();
    }
}

const map<int, vector<int>>& DataManager::getAllData() const {
    return memoryMap;
}

// Function to check existence of a user.
bool DataManager::isUserExists(int userId) const {
    return DataManager::memoryMap.find(userId) != DataManager::memoryMap.end();
}

// Function to check existence of a product in a given user's list.
bool DataManager::isProdInUser(int userId, int productId) const {
    if (!isUserExists(userId)) {
        return false;
    }

    const auto& userProds = DataManager::memoryMap.at(userId);
    return find(userProds.begin(), userProds.end(), productId) != userProds.end();
}