import socket
import sys

def main():
    # Get the server IP address and port number from command line arguments
    if len(sys.argv) != 3:
        sys.exit(1)

    server_ip = sys.argv[1]
    server_port = int(sys.argv[2])

    #  create a TCP/IP socket
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM) # AF_INET: IPv4, SOCK_STREAM: TCP 

    try:
        client_socket.connect((server_ip, server_port)) # connect to the server at the specified IP address and port number
    except Exception:
        sys.exit(1) # if the connection fails, exit with a non-zero status code

    # process does not terminate until the user inputs EOF (Ctrl+D) in the console
    try:
        while True:
            try:
                #wait for user input from the console
                command = input()
            except EOFError:
                break # if the user inputs EOF, break out of the loop and close the connection

            # Dummy Client: Don't send anything to the server, just print the command to the console
            message = command + "\n"
            client_socket.sendall(message.encode('utf-8'))

            # block until we receive a response from the server
            response = client_socket.recv(4096)

            # if the server closes the connection, recv will return an empty bytes object
            if not response:
                break

            # Print the response from the server to the console
            print(response.decode('utf-8'), end="")
    finally:
        client_socket.close()

if __name__ == "__main__":
    main()