#include "GetCommand.h"

using namespace std;

GetCommand::GetCommand(Recommender& rec) : recommender(rec) {}

// Empty implementation only for the tests.
string GetCommand::execute(const string& userIdStr, const string& productIdStr) const {
    return "";
}