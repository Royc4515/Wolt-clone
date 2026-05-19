#ifndef HELPCOMMAND_H
#define HELPCOMMAND_H

#include <string>
#include <map>

// A class to handle "help" command for future changes.
class HelpCommand {
    private:
        std::map<std::string, std::string> commandsInfo;

    public:
        HelpCommand(const std::map<std::string, std::string>& supportedCommands);
        std::string execute() const;
};

#endif
