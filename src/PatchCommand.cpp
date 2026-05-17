#include "PatchCommand.h"
#include <utility>

namespace {
    // Exact response strings mandated by Ex2.pdf. Kept here as
    // constants so the format (including the trailing newline)
    // lives in exactly one place; tests assert character-for-character.
    constexpr const char* kNoContentResponse = "204 No Content\n";
    constexpr const char* kNotFoundResponse  = "404 Not Found\n";
}

PatchCommand::PatchCommand(IDataReadable& reader,
                           IDataWriteable& writer,
                           int userId,
                           std::vector<int> productIds)
    : UserDataCommand(reader, userId, std::move(productIds)),
      writer_(writer) {}

std::string PatchCommand::execute() const {
    // PATCH extends an EXISTING user's product list. If the user does
    // not yet exist, the request is logically invalid (per Ex2.pdf:
    // structurally valid but inconsistent with existing data => 404).
    //
    // Note: writeInteraction is append-only by design, so this call
    // simply adds the new products to the user's vector without
    // replacing what was already there.
    if (!reader_.isUserExists(userId_)) {
        return kNotFoundResponse;
    }

    writer_.writeInteraction(userId_, productIds_);
    return kNoContentResponse;
}
