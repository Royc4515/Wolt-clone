// A class that will hold the mock data for the recommendations tests.

#include "MockData.h"
using namespace std;

MockData::MockData() {
    // Building the fake data as shown in instructions.
    fakeData[1] = {100, 101, 102, 103};
    fakeData[2] = {101, 102, 104, 105, 106};
    fakeData[3] = {100, 104, 105, 107, 108};
    fakeData[4] = {101, 105, 106, 107, 109, 110};
    fakeData[5] = {100, 102, 103, 105, 108, 111};
    fakeData[6] = {100, 103, 104, 110, 111, 112, 113};
    fakeData[7] = {102, 105, 106, 107, 108, 109, 110};
    fakeData[8] = {101, 104, 105, 106, 109, 111, 114};
    fakeData[9] = {100, 103, 105, 107, 112, 113, 115};
    fakeData[10] = {100, 102, 105, 106, 107, 109, 110, 116};
}

// Getter of the dataset, by reference.
const map<int, vector<int>>& MockData::getAllData() const {
    return MockData::fakeData;
}