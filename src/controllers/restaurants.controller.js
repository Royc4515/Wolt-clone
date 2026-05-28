// Temporary array for mock restaurants data.
const mockRestaurants = [
    {
        id: "ffc76e45-2353",
        name: "Burger Place",
        address: "Rothschild 12, Tel Aviv"
    },
    {
        id: "5e3d043c-5666",
        name: "Sushi Master",
        address: "Dizengoff 100, Tel Aviv"
    }
];

const getRestaurants = (req, res) => {
    res.status(200).json(mockRestaurants);
};

module.exports = {
    getRestaurants
};