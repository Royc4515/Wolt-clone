#include "RouterCommand.h"

using namespace std;

RouterCommand::RouterCommand(Recommender& rec, const IDataReadable* rData, IDataDeletable* dData, IDataWriteable* wData)
    : recommender(rec), readData(rData), deleteData(dData), writeData(wData) {}

string RouterCommand::route(const string& request) const {
    // Empty for now to fail the tests.
    return "";
}