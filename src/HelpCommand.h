#ifndef HELPCOMMAND_H
#define HELPCOMMAND_H

#include <string>

class HelpCommand {
    public:
        HelpCommand();
        std::string execute() const;
};

#endif
