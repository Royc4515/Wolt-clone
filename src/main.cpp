#include <iostream>
#include <string>
#include <cstdlib>
#include <stdexcept>

#include "DataManager.h"
#include "Recommender.h"
#include "RouterCommand.h"
#include "Server/Server.h"

using namespace std;

int main(int argc, char* argv[]) {
    // Validate command-line arguments: expects program name and port.
    if (argc != 2) {
        return 1;
    }

    // Convert the provided port argument from string to integer.
    int port = atoi(argv[1]);

    try {
        // Initialize Database Manager, Recommender, Router.
        DataManager dataManager("data/database.txt");
        Recommender recommender(&dataManager);
        RouterCommand router(recommender, &dataManager, &dataManager, &dataManager);

        // Start the TCP server.
        Server server(port, router);
        server.start();

    } catch (const exception& e) {
        // Catch initialization errors, and exit silently.
        return 1;
    }

    return 0;
}