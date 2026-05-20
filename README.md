# Ex2: Distributed Wolt-Clone — Python Client & C++ Server over TCP

[![C++](https://img.shields.io/badge/Language-C%2B%2B17-blue.svg)](https://isocpp.org/)
[![Python](https://img.shields.io/badge/Client-Python%203-yellow.svg)](https://www.python.org/)
[![Testing](https://img.shields.io/badge/Tests-GoogleTest-green.svg)](https://github.com/google/googletest)
[![Environment](https://img.shields.io/badge/Environment-Docker-blue.svg)](https://www.docker.com/)

A client–server product recommendation system. The **server** (C++17) owns all
business logic — it manages the data and computes recommendations. The
**client** (Python 3) is a thin terminal front-end: it forwards whatever the
user types to the server and prints whatever the server sends back. The two
communicate over a **TCP socket**.

This is the Ex2 evolution of the Ex1 CLI recommender (see [Ex1_README.md](Ex1_README.md)):
the same recommendation logic, now split across a network boundary.

---

## Team Members

| Name |
| :--- |
| **Dana Sela** |
| **Roy Carmelli** |

---

## Project Overview

The system tracks which products users have interacted with and recommends
related products using a cross-user "similar taste" algorithm.

- The **server** listens on a TCP port (passed as a command-line argument) and
  handles **one client at a time**, sequentially. Neither program terminates on
  its own — both run until the process is killed.
- The **client** receives the server IP and port as command-line arguments,
  opens **one** TCP connection at startup, and reuses that single connection for
  every command throughout its run.
- The client is intentionally **"dumb"**: it does not know which commands are
  valid. It sends each line the user enters and prints the server's reply.
- Every command sent and every response returned is terminated by a newline
  (`\n`).

### Status-code rules

The success code for each individual command is listed in the
[Command Reference](#command-reference) below. Two rules apply across *all*
commands:

| Situation | Server response |
| :--- | :--- |
| A command is structurally valid but logically inconsistent with stored data (e.g. `PATCH` on a user that was never `POST`ed) | `404 Not Found` |
| A command is unknown or malformed | `400 Bad Request` |

---

## Architecture

The design follows **loose coupling** and the **SOLID** principles so that new
commands, new response formats, and the move from console to sockets all plug in
as *extensions* rather than *modifications* (see the
[SOLID / OCP Design](#solid--ocp-design) section below).

```text
Client (Python)  — one persistent TCP connection; sends a command, prints the reply
      │
      ▼
Server           — accepts one client, reads newline-terminated requests
      │
      ▼
RouterCommand    — parses verb + integer args, dispatches (unknown/malformed → 400)
      │
      ▼
ICommand         — PostCommand · PatchCommand · DeleteCommand · GetCommand · HelpCommand
      │
      ├──► Recommender  — computes recommendations (used by GET)
      └──► DataManager  — implements IDataReadable / IDataWriteable / IDataDeletable,
                          persists to data/database.txt
```

- **`Server`** — owns the TCP socket: binds, listens, accepts one client, and
  loops on `recv`, extracting newline-terminated requests. It knows nothing about
  command semantics; it just forwards each request line to the router and writes
  back the string it gets.
- **`RouterCommand`** — parses a request line into a verb plus integer arguments,
  then dispatches via a verb→command dispatch table. Unknown verbs and malformed
  input return `400 Bad Request` here.
- **`ICommand`** — the command interface: every command exposes
  `std::string execute() const`.
- **`UserDataCommand`** — abstract base shared by `POST`, `PATCH`, and `DELETE`;
  holds the common state (data reader, user id, product ids).
- **Data layer** — three segregated interfaces (`IDataReadable`,
  `IDataWriteable`, `IDataDeletable`), all implemented by `DataManager`, which
  persists state to a text file under `data/`.
- **`Recommender`** — the recommendation algorithm; depends only on
  `IDataReadable`. Given a user and a product, it scores candidate products by
  how many "similar" users (users who viewed the same items) also viewed them,
  and returns a ranked list of up to 10 product ids — highest score first, ties
  broken by the smaller product id.

---

## Project Structure

```text
Wolt-clone-Ex2/
├── src/
│   ├── main.cpp                 # Server entry point: parses the port, wires components
│   ├── Server/
│   │   └── Server.{h,cpp}       # Sequential TCP server (accept loop, per-client recv)
│   ├── Commands/
│   │   ├── ICommand.h           # Command interface — execute()
│   │   ├── UserDataCommand.h    # Abstract base for POST / PATCH / DELETE
│   │   ├── PostCommand.{h,cpp}
│   │   ├── PatchCommand.{h,cpp}
│   │   ├── DeleteCommand.{h,cpp}
│   │   ├── GetCommand.{h,cpp}
│   │   ├── HelpCommand.{h,cpp}
│   │   └── RouterCommand.{h,cpp}# Parses the request line, dispatches to a command
│   ├── Data/
│   │   ├── IDataReadable.h      # Read interface
│   │   ├── IDataWriteable.h     # Append (write) interface
│   │   ├── IDataDeletable.h     # Delete interface
│   │   └── DataManager.{h,cpp}  # File-backed implementation of all three
│   ├── Logic/
│   │   └── Recommender.{h,cpp}  # Similarity-based recommendation algorithm
│   ├── Client/
│   │   └── client.py            # Python 3 TCP client
│   └── Archive/                 # Ex1 CLI sources, kept for reference only
├── tests/                       # GoogleTest unit + integration tests
├── data/                        # Persistent storage (database.txt is created at runtime)
├── screenshots/                 # Images used by this README
├── Dockerfile.server            # Server container image
├── Dockerfile.client            # Client container image
├── docker-compose.yml           # Builds & runs server, client, and tests together
├── CMakeLists.txt               # Build configuration
├── SOLID_TRACKING.md            # OCP design tracking notes
└── README.md
```

---

## Command Reference

All command names are case-insensitive (the router upper-cases the verb).

| Command | Syntax | Valid when | Response |
| :--- | :--- | :--- | :--- |
| `POST` | `POST [userid] [productid1] [productid2] ...` | the user does **not** exist yet | `201 Created` |
| `PATCH` | `PATCH [userid] [productid1] [productid2] ...` | the user **already** exists | `204 No Content` |
| `DELETE` | `DELETE [userid] [productid1] [productid2] ...` | the user exists **and** every listed product is in their list | `204 No Content` |
| `GET` | `GET [userid] [productid]` | the user exists | `200 Ok` + blank line + recommended product ids |
| `HELP` | `HELP` | always | the command list (see below) |

`HELP` lists every command with parameters in alphabetical order, each followed
by its arguments, with `help` itself last:

```
DELETE, arguments: [userid] [productid1] [productid2] ...
GET, arguments: [userid] [productid]
PATCH, arguments: [userid] [productid1] [productid2] ...
POST, arguments: [userid] [productid1] [productid2] ...
help
```

`DELETE` is **all-or-nothing**: if any requested product is missing from the
user's list, the whole request is rejected with `404 Not Found` and nothing is
deleted.

---

## How to Run

The exercise ships as two separate programs — run the **server** first, then the
**client**.

### Option 1 — Manual build (CMake)

Requires CMake (≥ 3.15), a C++17 compiler (GCC/Clang), the GoogleTest dev
package, and Python 3.

**Build the server and tests:**

```bash
mkdir build && cd build
cmake ..
make
```

This produces `build/WoltClone` (the server) and `build/tests/run_tests` (the
test suite).

**Run the server** (listens on the given port — here `8080`):

```bash
./build/WoltClone 8080
```

**Run the client** (connects to the server IP and port — in another terminal):

```bash
python3 src/Client/client.py 127.0.0.1 8080
```

**Run the automated tests:**

```bash
./build/tests/run_tests
```

### Option 2 — Docker

The repository ships a `docker-compose.yml` that builds and runs the server, the
client, and the test suite from `Dockerfile.server` and `Dockerfile.client`.
Compose is the easiest way to run the project — it wires up the networking so
the client reaches the server automatically.

**Run the server** (builds the images on first use; listens on port `8080`):

```bash
docker compose up --build server
```

**Run the client** (in another terminal — interactive):

```bash
docker compose run --rm client
```

The client connects to the server container by its hostname (`server`) on port
`8080`, so no IP configuration is needed.

**Run the automated tests:**

```bash
docker compose run --rm tests
```

#### Without Compose

The server image and the tests can also be built and run directly:

```bash
# Server (the image defaults to running on port 8080):
docker build -f Dockerfile.server -t wolt_server .
docker run -p 8080:8080 wolt_server

# Tests (reuse the server image — tests are compiled into it):
docker run --rm wolt_server ./tests/run_tests
```

The client image is built with
`docker build -f Dockerfile.client -t wolt_client .` and takes the server IP and
port as arguments. Because a container's own `127.0.0.1` is not the server,
running the client standalone needs an explicit route to the server (e.g.
`--network host` on Linux, or `host.docker.internal` on Docker Desktop). Compose
avoids this entirely, so it is the recommended way to run the client.

> Note: the Compose setup does not mount a host volume, so data created during a
> run lives only inside the container and is not kept after it is removed.

### Run Example

A sample session, with the server in one terminal and the client in another.
The client itself prints no prompt; in the transcript below, lines beginning
with `>` are what the user types into the client, and the lines under them are
the server's reply.

**Terminal 1 — server:**

```text
$ ./build/WoltClone 8080
```

**Terminal 2 — client:**

```text
$ python3 src/Client/client.py 127.0.0.1 8080
> POST 1 100 200
201 Created
> POST 2 100 300
201 Created
> PATCH 1 300
204 No Content
> GET 1 100
200 Ok

(recommended product ids — depends on the data stored on the server)
> DELETE 1 300
204 No Content
> POST 1 400
404 Not Found
> ADD 1 100
400 Bad Request
> HELP
DELETE, arguments: [userid] [productid1] [productid2] ...
GET, arguments: [userid] [productid]
PATCH, arguments: [userid] [productid1] [productid2] ...
POST, arguments: [userid] [productid1] [productid2] ...
help
```

Notes on the example:

- `POST 1 400` returns `404 Not Found` — user `1` already exists, and `POST`
  only creates *new* users, so the request is logically invalid.
- `ADD 1 100` returns `400 Bad Request` — `ADD` was the Ex1 verb; it is no
  longer a recognized command.
- The `GET` reply body lists recommended product ids. It depends on the data
  currently stored on the server, and is empty when there is too little data
  to recommend anything.

---

## Screenshots

<!-- TODO(Roy): capture fresh Ex2 screenshots and drop them into screenshots/.
     The existing screenshots/ images are from Ex1 (add / recommend / help) and
     do NOT match Ex2 (POST/PATCH/DELETE/GET over TCP, the new HELP output).
     Suggested captures:
       1. A client/server TCP session: POST -> PATCH -> GET -> DELETE          -> screenshots/ex2_session.png
       2. The HELP command output                                             -> screenshots/ex2_help.png
       3. 404 Not Found and 400 Bad Request cases                             -> screenshots/ex2_errors.png
       4. The GoogleTest suite passing (run_tests)                            -> screenshots/ex2_tests.png
     Then replace the placeholder links below with the real image paths. -->

### TCP session (client and server)

_Placeholder — add `screenshots/ex2_session.png`._

### HELP command

_Placeholder — add `screenshots/ex2_help.png`._

### Error responses (404 / 400)

_Placeholder — add `screenshots/ex2_errors.png`._

### GoogleTest suite

_Placeholder — add `screenshots/ex2_tests.png`._

---

## SOLID / OCP Design

Ex2 changes the Ex1 system in four ways. Ex2.pdf asks, for each, whether the
change forced edits to code that was supposed to be **closed for modification
but open for extension**. The four answers below are also tracked in
[SOLID_TRACKING.md](SOLID_TRACKING.md).

### Q1 — Renaming commands (`add`→`POST`, `recommend`→`GET`)

**It did not require modifying the command classes.** Each command class exposes
only `execute()` and never references its own verb name. The verb strings live
in exactly one place: the dispatch table inside `RouterCommand.cpp`, which maps a
verb to the command it creates. Renaming a verb is a one-line change to that
data table.

In Ex1 the CLI was a chain of `if (command == "add")` branches — that was the
code that should have been closed. Ex2 replaces those branches with the
verb→command dispatch table, so adding or renaming a verb is now *data*, not
*code*.

### Q2 — Adding new commands (`PATCH`, `DELETE`)

**No existing code had to change.** Each new command is a new class:

- `ICommand` is the polymorphic interface — any new verb implements
  `std::string execute() const`.
- `UserDataCommand` is an abstract base that holds the state shared by
  `POST`/`PATCH`/`DELETE` (the data reader, user id, product ids). `PATCH` and
  `DELETE` were added by inheriting from it and supplying their own dependency
  (`IDataWriteable` or `IDataDeletable`) — no member declarations were
  duplicated, and `PostCommand` was never touched.

The only addition per new command is one entry in the `RouterCommand` dispatch
table. That table is precisely the "open for extension" surface.

### Q3 — Changing the output format (`201 Created`, `404 Not Found`, ...)

**No.** Each command's response format lives entirely inside its own
`execute()`. `RouterCommand` and `Server` forward the returned string verbatim —
they never inspect, parse, or build a response. If the spec changed
`"201 Created\n"` to something else, only `PostCommand.cpp` would change; every
other file compiles and runs unchanged.

Inside each command file the response strings are anonymous-namespace
`constexpr` constants, so each literal appears in exactly one place and the
tests can assert it character-for-character.

### Q4 — Switching input/output from console to TCP sockets

**No — by design the command and data layers are I/O-agnostic.** A command
receives **already-parsed** primitive arguments (`int userId`,
`std::vector<int> productIds`) and returns a `std::string`. It has no idea
whether those values came from `stdin`, a TCP socket, or a unit test holding a
`MockDatabase`.

All transport-specific code (socket creation, `bind`/`listen`/`accept`, the
`recv` loop, `send`) lives in the new `Server` class. Moving from console to
sockets meant *adding* that class, not editing the existing logic. The data
layer is equally transport-agnostic, which is also what lets the GoogleTest
suite run with zero network or filesystem I/O.

### Looking ahead — supporting many clients at once

The current `Server` handles one client at a time (a single `accept` →
`handleClient` loop). The routing and command layers are already concurrency-
friendly: `RouterCommand::route()` is `const`, and commands are short-lived
stack objects created per request. The shared mutable state is `DataManager`'s
in-memory map, which is the one place a future multi-client server would need
synchronization. Making the server concurrent is therefore an *extension* of the
`Server` class (e.g. a thread per accepted client) plus locking in
`DataManager` — the command and routing code would not need to change.

---

## Project Management

Developed with **Agile Scrum**, tracked in **JIRA**:

- Work is broken into epics, user stories, and tasks; each task is assigned
  before work starts and is linked to its `feature/SCRUM-###` branch.
- **Feature-branch workflow:** every change is merged into `main` only through a
  **pull request** reviewed and approved by another team member.
- **Server developed with TDD** (Red → Green → Refactor) using **GoogleTest**;
  the Python client follows the same process standards but, per the spec, has no
  test suite.
