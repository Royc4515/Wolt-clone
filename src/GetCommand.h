#ifndef GETCOMMAND_H
#define GETCOMMAND_H

#include <string>
#include "Recommender.h"
#include "ICommand.h"

class GetCommand : public ICommand {
    private:
        Recommender& recommender;
        const IDataReadable* data;
        std::string userIdStr;
        std::string productIdStr;
    
    public:
        GetCommand(Recommender& rec, const IDataReadable* data, const std::string& userId, const std::string& productId);
        [[nodiscard]]std::string execute() const override;
};

#endif