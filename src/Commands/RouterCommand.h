#ifndef ROUTER_COMMAND_H
#define ROUTER_COMMAND_H

#include <string>
#include "../Logic/Recommender.h"
#include "../Data/IDataReadable.h"
#include "../Data/IDataDeletable.h"
#include "../Data/IDataWriteable.h"

class RouterCommand {
    private:
        Recommender& recommender;
        const IDataReadable* readData;
        IDataDeletable* deleteData;
        IDataWriteable* writeData;

    public:
        RouterCommand(Recommender& rec, const IDataReadable* rData, IDataDeletable* dData, IDataWriteable* wData);

        [[nodiscard]]std::string route(const std::string& request) const;
};

#endif