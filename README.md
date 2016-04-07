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
- `[]` -- Brackets are meant to enclose optional values and should always come in a matched pair
- => -- Function output "fat-arrow" notation used for expressing output from input
- , -- Commas are required for separating types on functions
- () -- Optional parentheses to group types, which will be treated as spaces by interpreter
- Spaces are allowed but not required as all types should be separated by either commas or fat arrows dependent upon case
spaces, however, are disallowed in type names

Example function signature:

- `"Array<number>, [number] => number"`
- `"() => function"`

## Usage

Signet can be used two different ways to sign your functions, as a function wrapper or as a decoration of your function. 
Below are examples of the two use cases:

Function wrapper style:

    const add = signet.sign('number, number => number',
        function add (a, b) {
            return a + b;
        }
    );
    
    console.log(add.signature); // number, number => number

Function decoration style:

    signet.sign('number, number => number', add);
    function add (a, b) {
        return a + b;
    }

Signet signatures are immutable, which means once they are declared, they cannot be tampered with. This adds a guarantee
to the stability of your in-code documentation. Let's take a look:

    signet.sign('number, number => number', add);
    
    add.signature = 'I am trying to change the signature property';
    console.log(add.signature); // number, number => number

## Development

Signet development will proceed following the checklist below.  The intent is to deliver useful behavior at each step, so
the list should be viewed as a planned output order.

- [x] Set type signature string on a function with the signature property (signet.sign)
- [x] Preliminary validation of signature string for general format (full correctness not required)
- [x] Validation of signature string, ensuring only valid signature strings are added (parsing and interpretation)
- [ ] Validate signature encompasses all values in length of function
- [ ] Add function to verify passed arguments for all types
- [ ] Extend argument verification function to handle optional type specs
- [ ] Add separate module for running tests against types as unit tests, so type info can be kept fresh