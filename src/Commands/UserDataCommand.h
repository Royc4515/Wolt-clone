// Abstract Base Class for commands that operate on user data:
// POST (create user), PATCH (extend user's products), DELETE (remove products).
// Holds the state shared by all three: the data reader,
// the target user id, and the list of product ids that the command operates on.
//
// Concrete subclasses add their own specific dependency
// (IDataWriteable for POST/PATCH, IDataDeletable for DELETE)
// and implement execute() from ICommand.

#ifndef USER_DATA_COMMAND_H
#define USER_DATA_COMMAND_H

#include <utility>
#include <vector>
#include "ICommand.h"
#include "../Data/IDataReadable.h"

class UserDataCommand : public ICommand {
public:
    // Commands are one-shot: built, executed, destroyed.
    // The reference member already makes copy/move ill-formed,
    // but spelling this out leaves no doubt about the intent.
    UserDataCommand(const UserDataCommand&)            = delete;
    UserDataCommand& operator=(const UserDataCommand&) = delete;
    UserDataCommand(UserDataCommand&&)                 = delete;
    UserDataCommand& operator=(UserDataCommand&&)      = delete;

protected:
    const IDataReadable&   reader_;
    int              userId_;
    std::vector<int> productIds_;

    UserDataCommand(const IDataReadable& reader,
                    int userId,
                    std::vector<int> productIds)
        : reader_(reader),
          userId_(userId),
          productIds_(std::move(productIds)) {}
};

#endif // USER_DATA_COMMAND_H
