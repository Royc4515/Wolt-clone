// Import all the needed files.
#include "RouterCommand.h"
#include "PostCommand.h"
#include "PatchCommand.h"
#include "DeleteCommand.h"
#include "GetCommand.h"
#include "HelpCommand.h"

// Import the needed functionalities.
#include <sstream>
#include <vector>
#include <algorithm>
#include <cctype>
#include <functional>
#include <unordered_map>

using namespace std;

namespace {
    enum class CmdType { POST, PATCH, DELETE, GET, HELP, UNKNOWN };
    constexpr const char* kBadRequest = "400 Bad Request\n";
}

RouterCommand::RouterCommand(Recommender& rec, const IDataReadable* rData, IDataDeletable* dData, IDataWriteable* wData)
    : recommender(rec), readData(rData), deleteData(dData), writeData(wData) {}


// Function to check the input's validity and to call the wanted command.
string RouterCommand::route(const string& request) const {
    stringstream ss(request);
    string cmdName;

    // Extract the first word to be the command name.
    if (!(ss >> cmdName)) {
        return kBadRequest;
    }

    // Turn the command name to UPPERCASE in-place.
    transform(cmdName.begin(), cmdName.end(), cmdName.begin(), ::toupper);

    vector<int> args;
    string arg;

    // A loop to go through all the arguments and insert into a vector.
    while (ss >> arg) {
        // If one of the characters is not a digit between 0-9, return error.
        if (!all_of(arg.begin(), arg.end(), ::isdigit)) {
            return kBadRequest;
        }
        // Transform the arg to int and add to the vector.
        args.push_back(stoi(arg));
    }

    // Creating a "command factory" to navigate through the commands using enums.
    static const unordered_map<string, function<string(const vector<int>&) >> cmdFactory = {
        {"POST", [this](const vector<int>& a) {
            if (a.size() < 2) return string(kBadRequest);

            vector<int> products(a.begin() + 1, a.end());
            PostCommand postCmd(*readData, *writeData, a[0], products);
            return postCmd.execute();
        }},

        {"PATCH", [this](const vector<int>& a) {
            if (a.size() < 2) return string(kBadRequest);

            vector<int> products(a.begin() + 1, a.end());
            PatchCommand patchCmd(*readData, *writeData, a[0], products);
            return patchCmd.execute();
        }},

        {"DELETE", [this](const vector<int>& a) {
            if (a.size() < 2) return string(kBadRequest);

            vector<int> products(a.begin() + 1, a.end());
            DeleteCommand deleteCmd(*readData, *deleteData, a[0], products);
            return deleteCmd.execute();
        }},

        {"GET", [this](const vector<int>& a) {
            if (a.size() != 2) return string(kBadRequest);

            GetCommand getCmd(recommender, readData, a[0], a[1]);
            return getCmd.execute();
        }},

        {"HELP", [](const vector<int>& a) {
            if (!a.empty()) return string(kBadRequest);

            map<string, string> commands = {
                {"POST", "[userid] [productid1] [productid2] ..."},
                {"DELETE", "[userid] [productid1] [productid2] ..."},
                {"GET", "[userid] [productid]"},
                {"PATCH", "[userid] [productid1] [productid2] ..."}
            };
            HelpCommand helpCmd(commands);
            return helpCmd.execute();
        }}
    };

    // Iterating through the factory and running.
    auto it = cmdFactory.find(cmdName);
    if (it != cmdFactory.end()) {
        return it->second(args);
    }

    return kBadRequest;
}