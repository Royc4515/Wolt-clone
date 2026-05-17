#include "GetCommand.h"

using namespace std;

GetCommand::GetCommand(Recommender& rec) : recommender(rec) {}

// Empty implementation only for the tests.
string GetCommand::execute(const string& userIdStr, const string& productIdStr) const {
    try {
        // Converting input from string to int.
        int userId = stoi(userIdStr);
        int productId = stoi(productIdStr);

        // Calling recommender algorithm.
        vector<int> recoms = recommender.recommend(userId, productId);
        // TODO: continue implementation for failing cases.
        

    } catch (const invalid_argument& e) {
        return "404 Not Found\n";
    }
    return "";
}