#include "PostCommand.h"
#include <utility>

namespace {
    // Exact response strings mandated by Ex2.pdf. Kept here as
    // constants so the format (including the trailing newline)
    // lives in exactly one place; tests assert character-for-character.
    constexpr const char* kCreatedResponse  = "201 Created\n";
    constexpr const char* kNotFoundResponse = "404 Not Found\n";
}

PostCommand::PostCommand(IDataReadable& reader,
                         IDataWriteable& writer,
                         int userId,
                         std::vector<int> productIds)
    : UserDataCommand(reader, userId, std::move(productIds)),
      writer_(writer) {}

std::string PostCommand::execute() const {
    // POST creates a new user. If the user already exists, the request
    // is logically invalid (per Ex2.pdf: structurally valid but
    // inconsistent with existing data => 404 Not Found).
    if (reader_.isUserExists(userId_)) {
        return kNotFoundResponse;
    }

    writer_.writeInteraction(userId_, productIds_);
    return kCreatedResponse;
}
