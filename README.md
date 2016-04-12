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
- : -- Colons allow for object:instanceof annotation
- () -- Optional parentheses to group types, which will be treated as spaces by interpreter
- Spaces are allowed but not required as all types should be separated by either commas or fat arrows dependent upon case
spaces, however, are disallowed in type names

**Important note about data types:**

Data types are either primary or secondary. Primary types can only be from the list
specified below, which ensures that all variables can be validated in some meaningful way. Secondary data types can be
anything as they are not checked.

Only arrays and objects can have secondary types. Arrays with secondary types are annotated as `array<typeName>`. Objects
with secondary types are annotated as `object:typeName`. The reason for the syntactical difference is beyond the scope
of this document. 

List of supported primary types

- ()
- any
- array
- boolean
- function
- number
- object
- string
- symbol

Example function signature:

- `"array<number>, [number] => number"`
- `"array<foo> => string"`
- `"object:InstantiableName => string"`
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

Example of curried function type annotation:

    signet.sign('number => number => number', add);
    
    function curriedAdd (a) {
        return function (b) {
            return a + b;
        }
    }

Signet signatures are immutable, which means once they are declared, they cannot be tampered with. This adds a guarantee
to the stability of your in-code documentation. Let's take a look:

    signet.sign('number, number => number', add);
    
    add.signature = 'I am trying to change the signature property';
    console.log(add.signature); // number, number => number

Arguments can be verified against the function signature by calling verify inside your function:

    function verifiedAdd (a, b) {
        signet.verify(add, arguments);
        
        return a + b;
    }
    
    signet.sign('number, number => number', verifiedAdd);

## Development

Signet development will proceed following the checklist below.  The intent is to deliver useful behavior at each step, so
the list should be viewed as a planned output order.

- [x] Set type signature string on a function with the signature property (signet.sign)
- [x] Preliminary validation of signature string for general format (full correctness not required)
- [x] Validation of signature string, ensuring only valid signature strings are added (parsing and interpretation)
- [x] Validate signature encompasses all values in length of function
- [x] Validate signature primary types are native Javascript types (includes custom types array and any)
- [x] Add function to verify passed arguments for all types
- [x] Extend argument verification function to handle optional type specs
- [ ] Add enforce and signAndEnforce functions
- [ ] Add function to return argument/signature mapping as key/value pairs
- [ ] Add separate module for running tests against types as unit tests, so type info can be kept fresh

## Breaking Changes

### 0.4.x

- Any top-level types will now cause an error if they are not part of the core Javascript types or in the following list:
    - ()
    - any
    - array
    - boolean
    - function
    - number
    - object
    - string
    - symbol
