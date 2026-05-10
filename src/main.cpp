#include <iostream>
#include "Cli.h"
#include "DataManager.h"

int main() {
    // Create an instance of the data manager
    DataManager db;

    // Create an instance of the CLI, passing the data writer and reader to it.
    Cli cli(std::cin, std::cout, &db, &db);

    // Run the CLI
    cli.run();

    return 0;
}