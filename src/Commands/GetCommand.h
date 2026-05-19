#ifndef GETCOMMAND_H
#define GETCOMMAND_H

#include <string>
#include "../Logic/Recommender.h"
#include "ICommand.h"

class GetCommand : public ICommand {
    private:
        Recommender& recommender;
        const IDataReadable* data;
        int userId;
        int productId;
    
    public:
        GetCommand(Recommender& rec, const IDataReadable* data, int userId, int productId);
        [[nodiscard]]std::string execute() const override;
};

#endif