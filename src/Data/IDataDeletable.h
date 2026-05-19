// Interface for removing specific products from a user's record.
// Separated from IDataWriteable (which is append-only) to honour the
// Interface Segregation Principle: code that only writes new interactions
// should not depend on delete semantics, and vice versa.

#ifndef IDATA_DELETABLE_H
#define IDATA_DELETABLE_H

#include <vector>

class IDataDeletable {
public:
    virtual ~IDataDeletable() = default;

    // Removes the given product ids from the user's record.
    // Implementations must keep the user's key in the store even if
    // the user's product list becomes empty as a result of this call.
    // Logical validation (is the user known? is the product in the list?)
    // is the caller's responsibility (e.g. DeleteCommand).
    virtual void deleteProducts(int userId,
                                const std::vector<int>& productIds) = 0;
};

#endif // IDATA_DELETABLE_H
