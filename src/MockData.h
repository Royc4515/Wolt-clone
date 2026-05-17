// An abstract class that will inherit from the IDataReadable interface. Will be used to give the Recommender class "fake" data for tests.

#ifndef MOCK_DATA_H
#define MOCK_DATA_H

#include "../src/IDataReadable.h"
#include <map>
#include <vector>

class MockData : public IDataReadable {
        private:
            std::map<int, std::vector<int>> fakeData; // The class object is a map with two fields: one is the user id, and the second is a vector of the user's products.

        public:
            MockData(); // Constructor.
            ~MockData() override = default; // Default destructor.
            const std::map<int, std::vector<int>>& getAllData() const override; // Override the original function from IDataReadable.

            // Functions to check existence of a user/product.
            virtual bool isUserExists(int userId) const override;
            virtual bool isProdInUser(int userId, int productId) const override;
};

#endif