// A cpp class that will contain all implementation regarding the recommendation command.

#include "Recommender.h"
using namespace std;

Recommender::Recommender(IDataReadable* data) {
    dataReader = data;
}

Recommender::~Recommender() {
// Since the Recommender object doesn't manage information on its own (only holding a pointer to the info interface), the destructor is empty.
}

// Function to calculate the similarity rank of each user to the target user. Gets the user id, returns a table with the rank of each user.
map<int, int> Recommender::similarityCalc(int userId) const {
    map<int, int> similarities;

    const map<int, vector<int>>& allData = dataReader->getAllData(); // Fetch all data from database.
    const vector<int>& userProds = allData.at(userId); // Hold a reference to target user's list of products.

    // Iterating all the data by user id.
    for (auto& userData : allData) {
        int currUser = userData.first;
        
        // If the current user is the target user, we will skip the similarity calculation.
        if (currUser == userId) {
            continue;
        }

        const vector<int>& currProds = userData.second; // Reference to current user's list of products.
        int counter = 0; // Similarity counter.

        // Iterating current user's list of products and summing the number of shared items.
        for (int productId : currProds) {

            // For each product, search it in the target user's list.
            vector<int>::const_iterator it = find(userProds.begin(), userProds.end(), productId);

            // If found before reaching the end, add 1 to counter.
            if (it != userProds.end()) {
                counter += 1;
            }
        }

        // If found shared items, add the similarity count to similarities table.
        if (counter > 0) {
            similarities.insert({currUser, counter});
        }
    }

    return similarities;
}

// Function to filter the relevant users by the chosen product. Gets the calculated map of similarity and producy id, returns a map with only relevant users.
map<int, int> Recommender::filterByProduct(const std::map<int, int>& similarUsers, int productId) const {

    map<int, int> relevantUsers;
    const map<int, vector<int>>& allData = dataReader->getAllData(); // Fetch all data from database.

    // Iterating the similar users.
    for (const auto& userData : similarUsers) {

        // Fetching the user id and calculated similarity.
        int currUser = userData.first;
        int currScore = userData.second;

        // Fetching the user list of products and searching it for the chosen product.
        const vector<int>& currProds = allData.at(currUser);
        vector<int>::const_iterator it = find(currProds.begin(), currProds.end(), productId);

        // If we found the product, add the user and corresponded score to the map.
        if (it != currProds.end()) {
            relevantUsers.insert({currUser, currScore});
        }
    }

    return relevantUsers;
}

// Function to calculate final scores for each product. Gets the map of relevant users, the user and product id requested. Returns a map of final scores.
map<int, int> Recommender::productWeightCalc(const std::map<int, int>& relevantUsers, int userId, int productId) const {

    // Organize the needed data.
    map<int, int> finalScores;
    const map<int, vector<int>>& allData = dataReader->getAllData(); // Fetch all data from database.
    const vector<int>& userProds = allData.at(userId); // Hold a reference to target user's list of products.

    // Iterate the relevant users map, and for each fetch the user id, the score, and the list of products.
    for (const auto& currData : relevantUsers) {
        int currUser = currData.first;
        int currScore = currData.second;
        const vector<int>& currProds = allData.at(currUser);

        // For each product of the current user, search it in the requested user (from input) list of products.
        for (int product : currProds) {
            vector<int>::const_iterator it = find(userProds.begin(), userProds.end(), product);

            // If not found OR is identical to requested product - continue.
            if (product == productId || it != userProds.end()) {
                continue;
            }

            // Else, add the current user's score to the product's final score.
            finalScores[product] += currScore;
        }
    }

    return finalScores;
}

// Function to sort the recommendations list in a descending order. Gets the final scores map and a number of max recommendations, returns a vector of sorted items.
vector<int> Recommender::sortDescendind(const std::map<int, int>& resultTable, int maxRecommendations) {

    // Copying the map to a vector of pairs to sort efficiently.
    vector<pair<int, int>> resultVector(resultTable.begin(), resultTable.end());

    // The recommendations number will be the minimum between the amount of items in the list and the max number of recommendations.
    int recomNum = min((int)resultVector.size(), maxRecommendations);

    // Sort using k-sort algorithm, meaning sort the k (recomNum) biggest values, and ignore the rest.
    // Define a lambda compare function to match our requirements, as an argument to the sort function.
    partial_sort(resultVector.begin(), resultVector.begin() + recomNum, resultVector.end(), 
        [] (pair<int, int>& a, pair<int, int>& b) {             // Compare func gets 2 pairs of ints and returns their correct order.

            if (a.second != b.second) {                         // If a's score is different than b's, check if it's bigger. If so, a is first. Else, b is first.
                return a.second > b.second;
            }
            return a.first < b.first;                           // If the scores are equal, return the smaller id first.
        }
    );

    // Create a vector (only product id) with the size of recommendations number.
    vector<int> sorted(recomNum);

    // Copy the sorted data (only product id, no score) to the vector.
    for (int i = 0; i < recomNum; i++) {
        sorted[i] = resultVector[i].first;
    }

    return sorted;
}

// Recommend's main function. Calls all the helpers by order and returns the result.
vector<int> Recommender::recommend(int userId, int productId) {
    const map<int, vector<int>>& allData = dataReader->getAllData();

    // If the user dosen't exist in dataset, return an empty list.
    if(allData.find(userId) == allData.end()) {
        return vector<int>();
    }

    // Call helper functions by algorithm order.
    map<int, int> similarities = similarityCalc(userId);
    map<int, int> filterUsers = filterByProduct(similarities, productId);
    map<int, int> finalScores = productWeightCalc(filterUsers, userId, productId);
    vector<int> recommendations = sortDescendind(finalScores, 10);

    return recommendations;
}