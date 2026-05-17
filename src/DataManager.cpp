#include "DataManager.h"
#include <algorithm>
#include <fstream>
#include <sstream>
#include <iostream>
#include <stdexcept>

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
            // Ensure the user key exists in the map even if the line
            // contains no products (e.g. a user whose products were
            // all deleted but who must still "exist" so a later POST
            // correctly returns 404).
            memoryMap[userId];

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

// --- IDataDeletable implementation ---

void DataManager::deleteProducts(int userId, const vector<int>& productIds) {
    // 1. Look the user up. If they were never written, this is a no-op:
    //    logical validation (returning 404) belongs to DeleteCommand,
    //    not to the data layer.
    auto it = memoryMap.find(userId);
    if (it == memoryMap.end()) {
        return;
    }

    // 2. Remove every requested product from the user's vector using
    //    the erase-remove idiom. Products that are not in the vector
    //    are silently ignored.
    auto& userProducts = it->second;
    for (int productId : productIds) {
        userProducts.erase(
            std::remove(userProducts.begin(), userProducts.end(), productId),
            userProducts.end()
        );
    }

    // 3. Persist by rewriting the whole file. Append-only cannot
    //    express removals.
    //    NOTE: the user's key remains in memoryMap even if their
    //    vector is now empty. This preserves the "user still exists"
    //    invariant required by POST (which must return 404 for a
    //    known userId regardless of whether their list is empty).
    rewriteFile();
}

void DataManager::rewriteFile() const {
    // Open in truncate mode so the previous contents are discarded.
    ofstream file(filePath, ios::trunc);
    if (!file.is_open()) {
        // Same defensive posture as writeInteraction: silently skip
        // persistence if the file cannot be opened.
        return;
    }

    for (const auto& [userId, products] : memoryMap) {
        file << userId;
        for (int productId : products) {
            file << " " << productId;
        }
        file << "\n";
    }
    file.close();
}