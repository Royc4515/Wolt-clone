#ifndef IDATAWRITEABLE_H
#define IDATAWRITEABLE_H

#include <vector>

// Interface that will write the user's data, to be used in the CLI and in tests.
class IDataWriteable {
public:
    virtual ~IDataWriteable() = default;
    
    // Function to write user interactions. Takes a user ID and a vector of product IDs.
    virtual void writeInteraction(int userId, const std::vector<int>& productIds) = 0;
};

#endif // IDATAWRITEABLE_H