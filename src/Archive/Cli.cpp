#include "Cli.h"
#include "Recommender.h"
#include <sstream>
#include <vector>
#include <string>
#include <cctype>

namespace {
    /**
     * Verifies if a string consists only of numeric digits.
     * Essential for preventing std::stoi exceptions when processing IDs.
     */
    bool isNumber(const std::string& str) {
        if (str.empty()) return false;
        for (char c : str) {
            if (!std::isdigit(c)) return false;
        }
        return true;
    }
}

/**
 * Initializes the CLI with input/output streams and data interfaces.
 * Uses dependency injection to allow for easier testing (e.g., with stringstreams).
 */
Cli::Cli(std::istream& input, std::ostream& output, IDataWriteable* dataWriter, IDataReadable* dataReader) 
    : input(input), output(output), dataWriter(dataWriter), dataReader(dataReader) {}

void Cli::run() {
    std::string line;

    /**
     * Main loop: Processes commands line-by-line to ensure stability.
     * This approach prevents "garbage" text from spilling over into subsequent commands.
     */
    while (std::getline(input, line)) {
        // Requirement: Ignore empty lines and strictly reject lines containing tab characters.
        if (line.empty() || line.find('\t') != std::string::npos) {
            continue;
        }

        std::stringstream ss(line);
        std::string command;
        if (!(ss >> command)) continue;

        if (command == "help") {
            // Requirement: 'help' followed by any text is considered an invalid command.
            std::string extra;
            if (ss >> extra) continue; 

            output << "add [userid] [productid1] [productid2] ...\n"
                   << "recommend [userid] [productid]\n"
                   << "help\n";
        } 
        else if (command == "add") {
            std::string userIdStr;
            // Validate User ID format before conversion.
            if (!(ss >> userIdStr) || !isNumber(userIdStr)) continue;
            
            int userId = std::stoi(userIdStr);
            std::vector<int> products;
            std::string prodIdStr;
            bool validBatch = true;

            // Collect all product IDs from the rest of the line.
            while (ss >> prodIdStr) {
                if (isNumber(prodIdStr)) {
                    products.push_back(std::stoi(prodIdStr));
                } else {
                    // Stop processing if an invalid product ID (non-numeric) is encountered.
                    validBatch = false;
                    break;
                }
            }

            /**
             * Save interaction only if all product IDs are valid and 
             * at least one product was provided (per Ex1 specs).
             */
            if (validBatch && !products.empty() && dataWriter != nullptr) {
                dataWriter->writeInteraction(userId, products);
            }
        } 
        else if (command == "recommend") {
            std::string userIdStr, productIdStr;
            // Expect exactly two numeric arguments for the recommendation command.
            if (!(ss >> userIdStr >> productIdStr)) continue;
            
            // Requirement: Reject command if more than two arguments are provided.
            std::string extra;
            if (ss >> extra) continue;

            if (isNumber(userIdStr) && isNumber(productIdStr) && dataReader != nullptr) {
                int userId = std::stoi(userIdStr);
                int productId = std::stoi(productIdStr);

                // Invoke recommendation logic based on collaborative filtering.
                Recommender recommender(dataReader);
                std::vector<int> recoms = recommender.recommend(userId, productId);

                // Print recommended product IDs separated by spaces.
                for (size_t i = 0; i < recoms.size(); ++i) {
                    output << recoms[i] << (i == recoms.size() - 1 ? "" : " ");
                }
                output << "\n";
            }
        }
    }
}