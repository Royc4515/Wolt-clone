// In-memory mock of the data layer used by PostCommand/PatchCommand
// (and later DeleteCommand) unit tests. Implements IDataReadable
// and IDataWriteable so the commands can run without touching the
// filesystem.

#ifndef MOCK_DATABASE_H
#define MOCK_DATABASE_H

#include <algorithm>
#include <map>
#include <utility>
#include <vector>
#include "../src/IDataReadable.h"
#include "../src/IDataWriteable.h"
#include "../src/IDataDeletable.h"

class MockDatabase : public IDataReadable,
                     public IDataWriteable,
                     public IDataDeletable {
public:
    // --- IDataReadable implementation ---

    const std::map<int, std::vector<int>>& getAllData() const override {
        return data_;
    }

    bool isUserExists(int userId) const override {
        return data_.find(userId) != data_.end();
    }

    bool isProdInUser(int userId, int productId) const override {
        auto it = data_.find(userId);
        if (it == data_.end()) {
            return false;
        }
        return std::find(it->second.begin(), it->second.end(), productId)
               != it->second.end();
    }

    // --- IDataWriteable implementation ---
    // Matches DataManager's semantics: append-only push_back. Calling
    // this on an unknown userId creates the key (consistent with how
    // std::map::operator[] works in DataManager::writeInteraction).
    void writeInteraction(int userId,
                          const std::vector<int>& productIds) override {
        for (int productId : productIds) {
            data_[userId].push_back(productId);
        }
    }

    // --- IDataDeletable implementation ---
    // Matches DataManager's semantics: no-op if the user is unknown
    // or none of the requested products are present; the user key is
    // preserved even if their product vector becomes empty.
    void deleteProducts(int userId,
                        const std::vector<int>& productIds) override {
        auto it = data_.find(userId);
        if (it == data_.end()) {
            return;
        }
        auto& userProducts = it->second;
        for (int productId : productIds) {
            userProducts.erase(
                std::remove(userProducts.begin(), userProducts.end(), productId),
                userProducts.end()
            );
        }
    }

    // --- Test helper ---
    // Seeds the mock with a pre-existing state.
    void setData(std::map<int, std::vector<int>> data) {
        data_ = std::move(data);
    }

private:
    std::map<int, std::vector<int>> data_;
};

#endif // MOCK_DATABASE_H
