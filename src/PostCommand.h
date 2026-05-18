// PostCommand implements the POST verb of the Wolt-Clone protocol.
// Inherits the shared (reader, userId, productIds) state from
// UserDataCommand and adds its own dependency: an IDataWriteable
// used to persist new users.
//
// Logical contract:
//   - if the user is NOT in the data store, the products are
//     written and the response is "201 Created\n"
//   - if the user IS in the data store, no write happens and the
//     response is "404 Not Found\n"
// Syntactic validation (numeric ids, argument count) is the CLI's
// responsibility upstream and is not enforced here.

#ifndef POST_COMMAND_H
#define POST_COMMAND_H

#include <string>
#include <vector>
#include "UserDataCommand.h"
#include "IDataReadable.h"
#include "IDataWriteable.h"

class PostCommand : public UserDataCommand {
public:
    PostCommand(const IDataReadable& reader,
                IDataWriteable& writer,
                int userId,
                std::vector<int> productIds);

    std::string execute() const override;

private:
    IDataWriteable& writer_;
};

#endif // POST_COMMAND_H
