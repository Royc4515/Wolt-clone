#include "Server.h"
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <cstring>

using namespace std;

Server::Server(int port, RouterCommand& router)
    : port(port), serverSocket(-1), isRunning(false), router(router) {}

Server::~Server() {
    stop();         // Ensure the socket is closed when the object is destroyed.
}

void Server::start() {
    // 1. Create a TCP socket (IPv4, Stream).
    serverSocket = socket(AF_INET, SOCK_STREAM, 0);
    if (serverSocket < 0) {
        return;         // Return nothing if socket creation failed.
    }

    // 2. Define the server's address structure.
    struct sockaddr_in sin;
    memset(&sin, 0, sizeof(sin));
    sin.sin_family = AF_INET;
    sin.sin_addr.s_addr = INADDR_ANY;
    sin.sin_port = htons(port);

    // 3. Bind the socket to the specified port.
    if (::bind(serverSocket, (struct sockaddr *) &sin, sizeof(sin)) < 0) {
        return;
    }

    // 4. Start listening for incoming connections (queue size of 5).
    if (listen(serverSocket, 5) < 0) {
        return;
    }

    isRunning = true;

    // 5. Main server loop: Wait for and accept clients sequentially.
    while (isRunning) {
        struct sockaddr_in clientSin;
        socklen_t clientLen = sizeof(clientSin);

        // Block and wait until a client connects.
        int clientSocket = accept(serverSocket, (struct sockaddr *) &clientSin, &clientLen);
        if (clientSocket < 0) {
            continue;
        }

        // Process the connected client.
        handleClient(clientSocket);
    }
}

void Server::handleClient(int clientSocket) {
    char buffer[1024];
    string input = "";

    // Keep the connection open for continuous requests from the same client.
    while (true) {
        memset(buffer, 0, sizeof(buffer));

        // Read data from the socket.
        int bytesRead = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
        if (bytesRead <= 0) {
            break;          // Client disconnected or network error occurred.
        }

        input += buffer;    // Accumulate received chunks of data.

        // Extract and process complete commands ending with a (\n).
        size_t pos;
        while ((pos = input.find('\n')) != string::npos) {
            // Extract the exact command.
            string request = input.substr(0, pos);

            // Remove the processed command (including \n) from the buffer.
            input.erase(0, pos + 1);

            // Ignore empty lines or carriage returns.
            if (request.empty() || request == "\r") continue;

            // Route the request to business logic and get the formatted response.
            string response = router.route(request);

            // Send the response back to the client.
            send(clientSocket, response.c_str(), response.length(), 0);
        }
    }

    // Close the client's socket when they disconnect.
    close(clientSocket);
}

void Server::stop() {
    isRunning = false;
    if (serverSocket != -1) {
        close(serverSocket);
        serverSocket = -1;
    }
}