# Signet

## A function type signature library for Javascript

Signet is, first and foremost, a documentation library.  Rather than using the Javadoc method for documenting functions and
behaving as if Javascript were a classical OO language, signet assumes Javascript is a Prototypal OO language, like 
Smalltalk or Io and behaves more like a functional language in action than a classical OO language like Java.

With this in mind, the immediate goal is to create a library which makes it easy to add a read-only signature property to any
function definition, avoiding typos, post hoc modifications and so on.  Ideally, signet will also allow for type guarantees
to be tested when the type signature is testable, ensuring the signet definition does not get stale.

Signet will allow for single-line strings which contain all of the following:

- Variable characters -- Anything which can be expressed as a valid function or variable name is acceptable in signet
- <> -- Angle brackets for declaring type on collections like arrays and object literals
- [] -- Brackets are meant to enclose optional values and should always come in a matched pair
- => -- Function output "fat-arrow" notation used for expressing output from input
- , -- Commas are required for separating types on functions
- () -- Optional parentheses to group types, which will be treated as spaces by interpreter
- \s -- Spaces are allowed but not required as all types should be separated by either commas or fat arrows dependent upon case

Example function signature:

"Array`<number>`, `[number]` => number"

Signet development will proceed following the checklist below.  The intent is to deliver useful behavior at each step, so
the list should be viewed as a planned output order.

- [ ] Set type signature string on a function with the signature property (signet.sign)
- [ ] Validation of signature string, ensuring only valid signature strings are added (parsing and interpretation)
- [ ] Test validation of signature string, when possible, to ensure signature is fresh and valid; only basic Javascript types will be tested