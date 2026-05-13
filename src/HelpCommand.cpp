#include "HelpCommand.h"
#include <map>
#include <string>

using namespace std;

// Constructor.
HelpCommand::HelpCommand(const map<string, string>& supportedCommands)
     : commandsInfo(supportedCommands) {}

string HelpCommand::execute() const {
    string output = "";

    // For every command in the map, create a string that fitts its arguments and the format.
    for (const auto& pair : commandsInfo) {
        if (pair.first == "help") {
            continue;
        }

        output += pair.first;

        if (!pair.second.empty()) {
            output += ", arguments: " + pair.second;
        }

        output += "\n";
    }

    // Add "help" command at the very end.
    output += "help\n";
    
    return output;
}