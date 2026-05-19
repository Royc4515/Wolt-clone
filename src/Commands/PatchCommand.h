// PatchCommand implements the PATCH verb of the Wolt-Clone protocol.
// Inherits the shared (reader, userId, productIds) state from
// UserDataCommand and adds its own dependency: an IDataWriteable
// used to extend an existing user's product list.
//
// Logical contract:
//   - if the user IS in the data store, the products are appended
//     to their existing list and the response is "204 No Content\n"
//   - if the user is NOT in the data store, no write happens and
//     the response is "404 Not Found\n"
//
// Note: a user whose product vector was emptied by a previous
// DELETE is still considered to "exist". PATCH on such a user
// is valid (just appends to the empty list).
//
// Syntactic validation is the CLI's responsibility upstream.

#ifndef PATCH_COMMAND_H
#define PATCH_COMMAND_H

#include <string>
#include <vector>
#include "UserDataCommand.h"
#include "../Data/IDataReadable.h"
#include "../Data/IDataWriteable.h"

class PatchCommand : public UserDataCommand {
public:
    PatchCommand(const IDataReadable& reader,
                 IDataWriteable& writer,
                 int userId,
                 std::vector<int> productIds);

    std::string execute() const override;

private:
    IDataWriteable& writer_;
};

#endif // PATCH_COMMAND_H
