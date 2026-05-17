#include "GetCommand.h"

using namespace std;

GetCommand::GetCommand(Recommender& rec, const IDataReadable* dataPtr, const string& userId, const string& productId) 
    : recommender(rec), data(dataPtr), userIdStr(userId), productIdStr(productId) {}

// Empty implementation only for the tests.
string GetCommand::execute() const {
    try {
        // Converting input from string to int.
        int userId = stoi(userIdStr);
        int productId = stoi(productIdStr);

        // Checking if the user exists in the dataset.
        if (!data->isUserExists(userId)) {
            return "404 Not Found\n";
        }

        // Calling recommender algorithm.
        vector<int> recoms = recommender.recommend(userId, productId);
        
        // Creating the string to print.
        string result = "200 Ok\n\n";
        for (size_t i = 0; i < recoms.size(); i++) {
            result += to_string(recoms[i]);
            if (i < recoms.size() - 1) {
                result += " ";
            }
        }
        result += "\n";
        return result;

    } catch (const invalid_argument& e) {
        return "404 Not Found\n";
    } catch (const out_of_range& e) {
        return "404 Not Found\n";
    }
}