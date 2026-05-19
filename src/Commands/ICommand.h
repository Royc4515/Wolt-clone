// Pure interface for all server commands (POST, PATCH, DELETE, GET).
// Implements the Command Pattern + Open/Closed Principle:
// new commands plug into the routing layer as new classes,
// without requiring changes to existing code.

#ifndef ICOMMAND_H
#define ICOMMAND_H

#include <string>

class ICommand {
public:
    virtual ~ICommand() = default;

    // Executes the command and returns the HTTP-like response
    // that should be sent back to the client (terminated by '\n').
    // Marked const so the contract does not promise mutating the Command
    // itself; any side effects belong to the data layer the concrete
    // command holds (writer/deleter), not to the command object's state.
    // [[nodiscard]] guarantees the routing layer cannot silently drop
    // the response by forgetting to capture it.
    [[nodiscard]] virtual std::string execute() const = 0;
};

#endif // ICOMMAND_H
