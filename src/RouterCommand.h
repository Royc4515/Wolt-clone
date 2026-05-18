#ifndef ROUTER_COMMAND_H
#define ROUTER_COMMAND_H

#include <string>
#include "Recommender.h"
#include "IDataReadable.h"
#include "IDataDeletable.h"
#include "IDataWriteable.h"

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