#ifndef DATAMANAGER_H
#define DATAMANAGER_H

#include <map>
#include <vector>
#include <string>
#include "IDataWriteable.h"
#include "IDataReadable.h"
#include "IDataDeletable.h"

/*
 * DataManager serves as the central database.
 * It implements IDataWriteable for data entry (Add logic),
 * IDataReadable for data retrieval (Recommendation logic),
 * and IDataDeletable for product removal (DELETE logic).
 * It persists data to a text file in the data/ directory.
 */
class DataManager : public IDataWriteable,
                    public IDataReadable,
                    public IDataDeletable {
private:
    std::map<int, std::vector<int>> memoryMap;
    std::string filePath; // The path to the persistence file

    // Helper function to load data from the file upon initialization
    void loadDataFromFile();

    // Helper function that rewrites the persistence file from the
    // current in-memory map. Needed because deletion cannot be
    // expressed in an append-only file.
    void rewriteFile() const;

public:
    // Constructor defaults to the required path
    explicit DataManager(const std::string& path = "");
    ~DataManager() override = default;

    // --- IDataWriteable implementation ---
    void writeInteraction(int userId, const std::vector<int>& productIds) override;

    // --- IDataReadable implementation ---
    // Returns a table of the entire dataset.
    const std::map<int, std::vector<int>>& getAllData() const override;

    // --- IDataDeletable implementation ---
    // Removes the given product ids from the user's record.
    // No-op if the user does not exist or none of the products are
    // in their list. The user key remains in the map even if its
    // product vector becomes empty.
    void deleteProducts(int userId, const std::vector<int>& productIds) override;
    // Functions to check existence of a user/product.
    virtual bool isUserExists(int userId) const override;
    virtual bool isProdInUser(int userId, int productId) const override;
};

#endif // DATAMANAGER_H