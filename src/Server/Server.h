#ifndef SERVER_H
#define SERVER_H

#include "../Commands/RouterCommand.h"
#include<string>

/**
 * @class Server
 * @brief Represents a sequential TCP server that handles client requests.
 * The server processes one client at a time and uses a RouterCommand 
 * to execute the appropriate logic for each incoming request.
 */
class Server {
    private:
        int port;
        int serverSocket;
        bool isRunning;

        RouterCommand& router;

        // Handles continuous communication with a single client.
        void handleClient(int clientSocket);
    
    public:
        Server(int port, RouterCommand& router);
        ~Server();
        void start();       // Initializes the socket and enters the accept loop.
        void stop();        // Stops the server and closes the socket.
};

#endif