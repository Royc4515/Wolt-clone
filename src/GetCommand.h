#ifndef GETCOMMAND_H
#define GETCOMMAND_H

#include <string>
#include "Recommender.h"

class GetCommand {
    private:
        Recommender& recommender;
    
    public:
        GetCommand(Recommender& rec);
        std::string execute(const std::string& userIdStr, const std::string& productIdStr) const;
};

#endif