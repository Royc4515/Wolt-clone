#ifndef CLI_H                 
#define CLI_H               
#include <iostream>          
#include "IDataWriteable.h"    // Include interface for writing data operations
#include "IDataReadable.h"     // Include interface for reading data operations

class Cli {                   
private:
    std::istream& input;       // Reference to the input stream (e.g., cin or a file)
    std::ostream& output;      // Reference to the output stream (e.g., cout or a file)
    IDataWriteable* dataWriter; // Pointer to a concrete implementation of the writer interface
    IDataReadable* dataReader;  // Pointer to a concrete implementation of the reader interface

public:
    // Constructor: accepts streams and optional interface pointers (defaulting to nullptr)
    Cli(std::istream& input, std::ostream& output, IDataWriteable* dataWriter = nullptr, IDataReadable* dataReader = nullptr);

    void run();                // Main method to start the CLI loop and process commands
};

#endif // CLI_H               