#include "GetCommand.h"
#include <vector>

using namespace std;

GetCommand::GetCommand(Recommender& rec, const IDataReadable* dataPtr, int userId, int productId) 
    : recommender(rec), data(dataPtr), userId(userId), productId(productId) {}

// Empty implementation only for the tests.
string GetCommand::execute() const {

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
}