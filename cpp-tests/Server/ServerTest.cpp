// Integration tests for the server's connection and full functionality.

#include <gtest/gtest.h>
#include <thread>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <string>

#include "../../src/Server/Server.h"
#include "../../src/Commands/RouterCommand.h"
#include "../../src/Logic/Recommender.h"
#include "../Data/MockDatabase.h"

using namespace std;

// Testing basic connection and output.
TEST(ServerTest, ConnectionAndHelp) {
    // Initializing the data and logic components.
    MockDatabase mockDb;
    Recommender recommender(&mockDb);
    RouterCommand router(recommender, &mockDb, &mockDb, &mockDb);
    Server server(8080, router);

    // A thread to run the serve in the backround.
    thread serverThread([&server]() {
        server.start();
    });

    // Wait for the server to start running and listening.
    this_thread::sleep_for(chrono::milliseconds(100));

    // Create the client socket and send a request.
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in sin;
    sin.sin_family = AF_INET;
    sin.sin_port = htons(8080);
    inet_pton(AF_INET, "127.0.0.1", &sin.sin_addr);

    // Connect the client to the server.
    connect(sock, (struct sockaddr*) &sin, sizeof(sin));

    // Send a request.
    string request = "help\n";
    send(sock, request.c_str(), request.length(), 0);

    // Read the answer.
    char buffer[1024] = {0};
    read(sock, buffer, sizeof(buffer) - 1);
    string response(buffer);

    // Check that the output contains the names of the commands.
    EXPECT_NE(response.find("POST"), string::npos);
    EXPECT_NE(response.find("GET"), string::npos);
    EXPECT_NE(response.find("DELETE"), string::npos);
    EXPECT_NE(response.find("PATCH"), string::npos);

    // Close and clean.
    close(sock);
    server.stop(); // Turn off the isRunning flag.

    // Use a helper socket to make sure the server is closed.
    int dummySock = socket(AF_INET, SOCK_STREAM, 0);
    connect(dummySock, (struct sockaddr*) &sin, sizeof(sin));
    close(dummySock);

    // Wait for the thread to finish running.
    serverThread.join();
}

// Testing an input containing spaces.
TEST(ServerTest, PostWithSpaces) {
    // Initializing the data and logic components.
    MockDatabase mockDb;
    Recommender recommender(&mockDb);
    RouterCommand router(recommender, &mockDb, &mockDb, &mockDb);
    Server server(8081, router); // Using a different port in case the former is occupied.

    // A thread to run the serve in the backround.
    thread serverThread([&server]() {
        server.start();
    });

    // Wait for the server to start running and listening.
    this_thread::sleep_for(chrono::milliseconds(100));

    // Create the client socket and send a request.
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in sin;
    sin.sin_family = AF_INET;
    sin.sin_port = htons(8081);
    inet_pton(AF_INET, "127.0.0.1", &sin.sin_addr);

    // Connect the client to the server.
    connect(sock, (struct sockaddr*) &sin, sizeof(sin));

    // Send a request.
    string request = "POST 1 101 102\n";
    send(sock, request.c_str(), request.length(), 0);

    // Read the answer.
    char buffer[1024] = {0};
    read(sock, buffer, sizeof(buffer) - 1);
    string response(buffer);

    // Check that the output is correct.
    EXPECT_EQ(response, "201 Created\n");

    // Close and clean.
    close(sock);
    server.stop(); // Turn off the isRunning flag.

    // Use a helper socket to make sure the server is closed.
    int dummySock = socket(AF_INET, SOCK_STREAM, 0);
    connect(dummySock, (struct sockaddr*) &sin, sizeof(sin));
    close(dummySock);

    // Wait for the thread to finish running.
    serverThread.join();
}

// Testing invalid input.
TEST(ServerTest, InvalidCommand) {
    // Initializing the data and logic components.
    MockDatabase mockDb;
    Recommender recommender(&mockDb);
    RouterCommand router(recommender, &mockDb, &mockDb, &mockDb);
    Server server(8082, router); // Using a different port in case the formers are occupied.

    // A thread to run the serve in the backround.
    thread serverThread([&server]() {
        server.start();
    });

    // Wait for the server to start running and listening.
    this_thread::sleep_for(chrono::milliseconds(100));

    // Create the client socket and send a request.
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in sin;
    sin.sin_family = AF_INET;
    sin.sin_port = htons(8082);
    inet_pton(AF_INET, "127.0.0.1", &sin.sin_addr);

    // Connect the client to the server.
    connect(sock, (struct sockaddr*) &sin, sizeof(sin));

    // Send a request.
    string request = "blabla 123\n";
    send(sock, request.c_str(), request.length(), 0);

    // Read the answer.
    char buffer[1024] = {0};
    read(sock, buffer, sizeof(buffer) - 1);
    string response(buffer);

    // Check that the output is correct.
    EXPECT_EQ(response, "400 Bad Request\n");

    // Close and clean.
    close(sock);
    server.stop(); // Turn off the isRunning flag.

    // Use a helper socket to make sure the server is closed.
    int dummySock = socket(AF_INET, SOCK_STREAM, 0);
    connect(dummySock, (struct sockaddr*) &sin, sizeof(sin));
    close(dummySock);

    // Wait for the thread to finish running.
    serverThread.join();
}