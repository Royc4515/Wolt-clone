// Interface that will read the user's data, to be used in recommender class and in tests.

#ifndef IDATA_READABLE_H
#define IDATA_READABLE_H
#include <vector>
#include <map>

class IDataReadable {
    public:
        virtual ~IDataReadable() {} // Simple destructor. Needed to destruct objects that hold a pointer to IDataReadable.

        // Getter of the entire dataset.
        virtual const std::map<int, std::vector<int>>& getAllData() const = 0;

        // Funtions to check existence of a user/product.
        virtual bool isUserExists(int userId) const = 0;
        virtual bool isProdInUser(int userId, int productId) const = 0;
};

#endif