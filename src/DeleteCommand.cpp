#include "DeleteCommand.h"
#include <utility>

namespace {
    // Exact response strings mandated by Ex2.pdf. Kept here as
    // constants so the format (including the trailing newline)
    // lives in exactly one place; tests assert character-for-character.
    constexpr const char* kNoContentResponse = "204 No Content\n";
    constexpr const char* kNotFoundResponse  = "404 Not Found\n";
}

DeleteCommand::DeleteCommand(IDataReadable& reader,
                             IDataDeletable& deleter,
                             int userId,
                             std::vector<int> productIds)
    : UserDataCommand(reader, userId, std::move(productIds)),
      deleter_(deleter) {}

std::string DeleteCommand::execute() const {
    // 1. The user must already exist. Per Ex2.pdf, a DELETE against
    //    a user that was never POSTed is logically invalid (404).
    if (!reader_.isUserExists(userId_)) {
        return kNotFoundResponse;
    }

    // 2. Strict reading of Ex2.pdf: every requested product must
    //    already be in the user's list. If even one is missing,
    //    the whole request is logically invalid and we must NOT
    //    apply a partial deletion.
    for (int productId : productIds_) {
        if (!reader_.isProdInUser(userId_, productId)) {
            return kNotFoundResponse;
        }
    }

    // 3. All checks passed — delete the products.
    deleter_.deleteProducts(userId_, productIds_);
    return kNoContentResponse;
}
