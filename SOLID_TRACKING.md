# SOLID / OCP Design Tracking

> This file is updated continuously during Ex2 development.
> It will be merged into README.md before submission.
> Each section answers one of the four required design questions from Ex2.pdf.

---

## Q1: Did renaming commands (add→POST, recommend→GET) require touching "closed" code?

**Status:** IN PROGRESS

**What changed:** Command names in the routing layer.

**Answer:** [TO FILL after implementation]

Hypothesis: If command names were hard-coded in a switch/if-else in Cli.cpp, yes — that code would need to change. The Cli from Ex1 has a hard-coded `if (command == "add")` block. This IS code that should have been "closed." We will document how we restructured it.

---

## Q2: Did adding new commands (PATCH, DELETE) require touching "closed" code?

**Status:** IN PROGRESS

**What changed:** Three new command classes introduced.

**Answer:** [TO FILL after implementation]

Hypothesis: With the Command Pattern + `ICommand` interface, new commands are new classes only. The routing layer should not change if we use a map of `string → ICommand factory`. If we had to add a new if-else branch for each command — that is a violation of OCP.

Design decision made: We will use a `std::map<std::string, std::function<ICommand*(...)>>` or similar in the server/CLI layer so that new commands register themselves without touching existing routing logic.

---

## Q3: Did changing the output format (added "201 Created", "404 Not Found", etc.) require touching "closed" code?

**Status:** IN PROGRESS

**What changed:** Response strings are now HTTP-like instead of plain text.

**Answer:** [TO FILL after implementation]

Hypothesis: Output format is encapsulated inside each Command class's `execute()`. The routing layer just calls `execute()` and forwards whatever string it gets — it never inspects or constructs the response. So format changes should require touching ONLY the specific command class, not any shared infrastructure.

---

## Q4: Did switching input/output from console to TCP sockets require touching "closed" code?

**Status:** IN PROGRESS

**What changed:** Cli previously read from `cin` and wrote to `cout`. Now must read/write via TCP socket.

**Answer:** [TO FILL after implementation]

Hypothesis: The biggest OCP violation risk. If Cli directly uses `cin`/`cout`, we must touch it. Mitigation: abstract I/O behind a stream interface (e.g., pass `std::istream&` and `std::ostream&` to Cli). A `TCPStream` wrapper or a `SocketStream` can then satisfy the same interface. Console mode uses `cin`/`cout`; TCP mode uses socket-backed streams — zero change to Cli logic.

---

## Data Layer Design Decisions

### Why `IDataDeletable` (new interface) instead of modifying `IDataWriteable`

DELETE requires removing specific products from a user's record and rewriting the file.
`writeInteraction` is append-only by design (append to file + push_back in memory).
Adding deletion semantics to `IDataWriteable` would violate ISP (Interface Segregation):
clients that only write should not be forced to depend on deletion methods.

Solution: New `IDataDeletable` interface. `DataManager` implements all three interfaces.
`DeleteCommand` depends on `IDataReadable + IDataDeletable` only.

### Why the user key is NEVER removed from the map on DELETE

DELETE removes products, not users. A user with an empty product list still "exists."
Future POST to that userId should return 404 (user exists), not 201.
`memoryMap[userId]` key stays; only the vector contents change.

---

## Architecture Decisions Log

| Decision | Reason | Date |
|---|---|---|
| Introduced `ICommand` interface | OCP hinge point for all commands | 2026-05-17 |
| Introduced `IWriteCommand` abstract base | Avoid duplicate member declarations across POST/PATCH/DELETE | 2026-05-17 |
| Introduced `IDataDeletable` interface | ISP — deletion semantics don't belong in IDataWriteable | 2026-05-17 |
| HelpCommand stays standalone (no ICommand yet) | Partner owns that code; retrofit in next sprint | 2026-05-17 |
| PATCH reuses `writeInteraction` as-is | Append-only file works: loadDataFromFile accumulates all lines for a user | 2026-05-17 |
