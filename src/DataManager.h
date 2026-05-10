#ifndef DATAMANAGER_H
#define DATAMANAGER_H

#include <map>
#include <vector>
#include <string>
#include "IDataWriteable.h"
#include "IDataReadable.h"

/*
 * DataManager serves as the central database.
 * It implements IDataWriteable for data entry (Add logic)
 * and IDataReadable for data retrieval (Recommendation logic).
 * It persists data to a text file in the data/ directory.
 */
class DataManager : public IDataWriteable, public IDataReadable {
private:
    std::map<int, std::vector<int>> memoryMap;
    std::string filePath; // The path to the persistence file

    // Helper function to load data from the file upon initialization
    void loadDataFromFile();

public:
    // Constructor defaults to the required path
    explicit DataManager(const std::string& path = "");
    ~DataManager() override = default;

    // --- IDataWriteable implementation ---
    void writeInteraction(int userId, const std::vector<int>& productIds) override;

    // --- IDataReadable implementation ---
    // Returns a table of the entire dataset.
    const std::map<int, std::vector<int>>& getAllData() const override;
};

#endif // DATAMANAGER_H