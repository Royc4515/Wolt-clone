// DeleteCommand implements the DELETE verb of the Wolt-Clone protocol.
// Inherits the shared (reader, userId, productIds) state from
// UserDataCommand and adds its own specific dependency: an
// IDataDeletable used to remove products from the user's record.
//
// Logical contract (STRICT per Ex2.pdf):
//   - if the user does NOT exist                    -> "404 Not Found\n"
//   - if the user exists but ANY requested product
//     is missing from their list                    -> "404 Not Found\n"
//     (no partial deletion; the user's list is untouched)
//   - if the user exists AND every requested
//     product is in their list                      -> "204 No Content\n"
//     (all requested products are removed)
//
// Syntactic validation is the CLI's responsibility upstream.

#ifndef DELETE_COMMAND_H
#define DELETE_COMMAND_H

#include <string>
#include <vector>
#include "UserDataCommand.h"
#include "IDataReadable.h"
#include "IDataDeletable.h"

class DeleteCommand : public UserDataCommand {
public:
    DeleteCommand(const IDataReadable& reader,
                  IDataDeletable& deleter,
                  int userId,
                  std::vector<int> productIds);

    std::string execute() const override;

private:
    IDataDeletable& deleter_;
};

#endif // DELETE_COMMAND_H
