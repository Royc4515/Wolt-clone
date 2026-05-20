# SOLID / OCP Design Tracking

> Answers the four design questions from Ex2.pdf section "הנחיות".
> Status as of SCRUM-104 (DELETE) — the last command in Roy's track.
> Will be merged into README.md before submission.

---

## Q1: Did renaming commands (add→POST, recommend→GET) require touching "closed" code?

**Yes — but only in the routing layer (RouterCommand), which was deliberately refactored to be more "Open/Closed" going forward.**

The command classes themselves never reference their own verb names; they
just expose `execute()`. The string `"POST"` lives only in the place that
parses the incoming request line, so any future renaming would be a
one-line change in the routing table — not a touch of `PostCommand`,
`PatchCommand`, or `DeleteCommand`.

The only modification occurred in the routing layer (`RouterCommand`), which simply maps the new incoming string (e.g., "POST") to the instantiation of the correct command object. Therefore, the core command implementations remained perfectly closed for modification.

---

## Q2: Did adding new commands (PATCH, DELETE) require touching "closed" code?

**No. Each new command is a new class that drops into the existing
infrastructure without modifying it.**

This is the core OCP payoff of the design we put in place in SCRUM-100:

- `ICommand` is the polymorphic interface: any new verb implements
  `std::string execute() const`.
- `UserDataCommand` is an abstract base that holds the state shared
  by `POST/PATCH/DELETE` (`IDataReadable&`, `userId`, `productIds`).
  PATCH and DELETE were added by inheriting from it and supplying
  their own specific dependency (`IDataWriteable&` or `IDataDeletable&`)
  — no member declarations were duplicated, and the existing PostCommand
  never had to change.

The only piece that needs an additional line per new command is the
routing table that maps the verb string to a factory. That is the
"open for extension" surface, not "closed code being modified".

---

## Q3: Did changing the output format (added "201 Created", "404 Not Found", etc.) require touching "closed" code?

**No. The response format lives entirely inside each command's
`execute()` and is owned by that command.**

The `Server` and `RouterCommand` classes are entirely agnostic to the content of the responses. The Router calls `execute()`, and the Server takes the returned `std::string` and sends it directly over the TCP socket, appending the required newline.
If the specification changes a response from "201 Created" to "201 OK", only the specific command's `.cpp` file changes. The networking layer, the routing layer, and all other commands compile and run unchanged.

If tomorrow the spec switches `"201 Created\n"` to `"201 OK\n"`, only
`PostCommand.cpp` changes; every other file in the project compiles and
runs unchanged.

Inside each command file we keep the literal strings as
anonymous-namespace `constexpr` constants so they appear in exactly
one place per file. We chose not to extract a project-wide
`HttpResponses.h` because the actual duplication today (`"404 Not Found\n"`
in three of my files) does not yet justify a shared header — premature
abstraction. If a fourth or fifth consumer appears, the extraction is
trivial and would not require touching call sites' logic.

---

## Q4: Did switching input/output from console to TCP sockets require touching "closed" code?

**No, by design. Our architecture completely decouples the transport layer from the business logic.**

Our command classes (PostCommand, GetCommand, etc.) are completely I/O-agnostic.
A command receives **already-parsed** primitive arguments (`int userId`,
`std::vector<int> productIds`) from the Router and returns a `std::string`. It has no
knowledge of where those values came from or where the response is
going. The same `PostCommand` object would behave identically whether
the request came from `stdin`, a TCP socket, an HTTP server, or a unit
test holding a `MockDatabase`.

This is also what makes the tests fast and deterministic: `MockDatabase`
is an in-memory implementation of the same `IDataReadable` /
`IDataWriteable` / `IDataDeletable` interfaces that `DataManager` uses,
so the commands run with zero filesystem or network I/O during testing.

To support TCP sockets, we introduced the `Server` class, which handles the raw byte transmission and the `accept`/`recv`/`send` loop. The `Server` passes raw strings to the `RouterCommand`, which parses the arguments and invokes the commands. Because the business logic never relied on console I/O, transitioning to a Client-Server architecture over TCP  required zero changes to the data layer or the command implementations.
---

## Data Layer Design Decisions

### Why `IDataDeletable` is a separate interface, not part of `IDataWriteable`

DELETE requires removing specific products from a user's record and
rewriting the persistence file. `writeInteraction` was designed
append-only (file append + in-memory `push_back`), and DELETE
fundamentally cannot be expressed that way.

Adding deletion semantics to `IDataWriteable` would have forced every
consumer of "writing" (POST, PATCH) to depend on deletion methods they
do not need — an ISP violation. Instead we introduced `IDataDeletable`
(SCRUM-100), which `DataManager` implements alongside the existing two
interfaces (SCRUM-103). `DeleteCommand` therefore depends on
`IDataReadable + IDataDeletable` only.

### Why the user key is never removed from the in-memory map on DELETE

DELETE removes products, not users. A user whose product vector is
emptied by a sequence of deletions must still "exist" — otherwise a
subsequent POST against that same userId would mistakenly return 201
instead of 404.

`DataManager::deleteProducts` erases only from the vector, never from
the map. `loadDataFromFile` was extended (SCRUM-103) with a single
`memoryMap[userId];` line so the invariant survives across server
restarts: a file line containing only a userId (no products) re-creates
the empty-vector entry on load.

### Strict reading of DELETE semantics

Per Ex2.pdf: *"DELETE [for] something that wasn't PATCH/POSTed → 404
Not Found."* We adopted the strict interpretation: every requested
product must already be in the user's list, otherwise the entire
request is rejected with 404 and no modifications are made.
`DeleteCommand::execute` validates each productId with
`IDataReadable::isProdInUser` before calling `deleteProducts`, which
guarantees no partial deletion.

---

## Architecture Decisions Log

| Decision | Reason | Story |
|---|---|---|
| Introduced `ICommand` interface | OCP hinge: future commands plug in without touching routing | SCRUM-100 |
| Introduced `UserDataCommand` ABC | Avoid duplicate `reader_`/`userId_`/`productIds_` declarations across POST/PATCH/DELETE | SCRUM-100 |
| Introduced `IDataDeletable` interface | ISP — deletion semantics don't belong in `IDataWriteable` | SCRUM-100 |
| `execute()` is `const` + `[[nodiscard]]` | Routing layer cannot drop the response; `const` is correct because commands don't mutate themselves, only the data layer they hold | SCRUM-100 |
| `UserDataCommand` explicitly deletes copy/move | Commands are one-shot objects; reference member already prevents these, but spelling it out documents intent | SCRUM-100 |
| HelpCommand stays standalone (does not implement ICommand yet) | Partner owns that code; retrofit is a one-line change for the next sprint | SCRUM-100 |
| PATCH reuses `writeInteraction` unchanged | Append-only is exactly the right semantics for "extend a user's list"; `loadDataFromFile` accumulates all lines for a user | SCRUM-102 |
| DataManager uses file rewrite for DELETE (not append-only) | The previous file format cannot express removals; truncate-and-rewrite is the simplest correct solution at this scale | SCRUM-103 |
| `MockDatabase` lives in `tests/`, mirrors DataManager's three interfaces in memory | Tests should not touch the filesystem; in-memory mock gives fast and deterministic command tests | SCRUM-101 / 104 |
| Strict DELETE semantics (all-or-nothing) | Conservative reading of Ex2.pdf; no partial deletion if any requested product is missing | SCRUM-104 |
| Response strings stay as anonymous-namespace constants per file (no shared `HttpResponses.h`) | Real duplication is only `"404 Not Found\n"` across 3 files — below rule-of-three threshold for justification; revisit if more verbs land | SCRUM-104 |
