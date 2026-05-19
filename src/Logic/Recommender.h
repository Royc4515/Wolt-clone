// Interface that will define the Recommender class and declare all relevant functions.

#ifndef RECOMMENDER_H
#define RECOMMENDER_H

#include "../Data/IDataReadable.h"
#include <vector>
#include <map>
#include <algorithm>

class Recommender {

    private:
        IDataReadable* dataReader; // Recommender object holds a pointer to the user's list of products.

    protected:
        // Function to calculate each users similarity to target user. Gets the user id, returns a map of similarities.
        std::map<int, int> similarityCalc(int userId) const;

        // Function to filter the users who have shared items with target user. Gets the list of similarities and target product, returns the relevant users.
        std::map<int, int> filterByProduct(const std::map<int, int>& similarUsers, int productId) const;

        // Function to calculate final score of each item. Gets a map of relevant users and target user, returns a map of final scores.
        std::map<int, int> productWeightCalc(const std::map<int, int>& relevantUsers, int userId, int productId) const;

        // Function to sort the list by score. Gets a map of final scores and max number of recommendations, returns a sorted list.
        std::vector<int> sortDescendind(const std::map<int, int>& resultTable, int maxRecommendations);

    public:
        Recommender(IDataReadable* products); //builder
        ~Recommender(); // destructor

        // Recommend function that gets the user id and a product id and returns a vector of recommended products.
        std::vector<int> recommend(int userId, int productId);
};

#endif