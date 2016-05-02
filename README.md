# Signet

## A function type signature library for Javascript

Signet is, first and foremost, a documentation library.  Rather than using the Javadoc method for documenting functions and
behaving as if Javascript were a classical OO language, signet assumes Javascript is a Prototypal OO language, like 
Smalltalk or Io and behaves more like a functional language in action than a classical OO language like Java.

With this in mind, the immediate goal is to create a library which makes it easy to add a read-only signature property to any
function definition, avoiding typos, post hoc modifications and so on.  Ideally, signet will also allow for type guarantees
to be tested when the type signature is testable, ensuring the signet definition does not get stale.

Signet will allow for single-line strings which contain all of the following:

- Type names -- All primary type names should adhere to the list of supported types below
- Subtype names -- Subtype names must not contain any reserved characters as listed next
- `<>` -- Angle brackets for declaring type on collections like arrays and object literals
- `[]` -- Brackets are meant to enclose optional values and should always come in a matched pair
- `=>` -- Function output "fat-arrow" notation used for expressing output from input
- `,` -- Commas are required for separating types on functions
- `:` -- Colons allow for object:instanceof annotation
- `()` -- Optional parentheses to group types, which will be treated as spaces by interpreter

Spaces are allowed around commas and fat arrows, however spaces cannot be used inside type declarations. For instance
`"object:subtype, number => array"` is valid, but `"object : subtype, number => array"` is not.

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

Example function signatures:

- Empty argument list: `"() => function"`
- Simple argument list: `"number, string => boolean"`
- Subtyped object: `"object:InstantiableName => string"`
- Typed array: `"array<foo> => string"`
- Optional argument: `"array, [number] => number"`
- Curried function: `"number => number => number"`

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
    
Functions can be signed and verified all in one call with the enforce function:

    function add (a, b) {
        return a + b;
    }
    
    const enforcedAdd = enforce('number, number => number', add);

Curried functions are also fully enforced all the way down:

    function curriedAdd (a) {
        return function (b) {
            return a + b;
        }
    }
    
    const enforcedCurriedAdd = enforce('number => number => number', curriedAdd);
    
    enforcedCurriedAdd(1)('foo'); // Throws -- Expected type number, but got string

### Types and subtypes

New types can be added by using the extend function with a key and a predicate function describing the behavior of the data type

    signet.extend('foo', function (value) { return value !== 'bar'; });
    
    signet.enforce('foo => int', function (value) { return parseInt(value, 10); })('bar'); // Throws error

Subtypes can be added by using the subtype function. This is particularly useful for defining and using business types or defining restricted types.

    signet.subtype('number')('int', function (value) { return Math.floor(value) === value; });
    
    var enforcedIntAdd = signet.enforce('int, int => int', function (a, b) { a + b; });
    
    enforcedIntAdd(1.2, 5); // Throws error
    enforcedIntAdd(99, 3000); // 3099

Using secondary type information for higher-kinded subtype definition. Any secondary type strings for higher-kinded
types will be automatically split on ';' to allow for multiple type arguments.

    signet.subtype('array')('triple', function (value, typeObj, isTypeOf) {
        return isTypeOf(typeObj.valueType[0])(value[0]) &&
               isTypeOf(typeObj.valueType[1])(value[1]) &&
               isTypeOf(typeObj.valueType[2])(value[2]);
    });

    var multiplyTripleBy5 = signet.enforce('triple<int; int; int> => triple<int; int; int>', function (values) {
        return values.map(x => x * 5);
    });
    
    multiplyTripleBy5([1, 2]); // Throws error
    multiplyTripleBy5([1, 2, 3]); // [5, 10, 15]

### Direct type checking

Types can be checked from outside of a function call with isTypeOf.  The isTypeOf function is curried, so a specific
type check can be reused without recomputing the type object definition:

    var isInt = signet.isTypeOf('int');
    isInt(7); // true
    isInt(83.7); // false
    
    var isRanged3to4 = signet.isTypeOf('ranged<3;4>');
    isRanged3to4(3.72); // true
    isRanged3to4(4000); // false

## Development

Signet development will proceed following the checklist below.  The intent is to deliver useful behavior at each step, so
the list should be viewed as a planned output order.

- Core functionality
    - [x] Set type signature string on a function with the signature property (signet.sign)
    - [x] Preliminary validation of signature string for general format (full correctness not required)
    - [x] Validation of signature string, ensuring only valid signature strings are added (parsing and interpretation)
    - [x] Validate signature encompasses all values in length of function
    - [x] Validate signature primary types are native Javascript types (includes custom types array and any)
    - [x] Add function to verify passed arguments for all types
    - [x] Extend argument verification function to handle optional type specs
    - [x] Add enforce functions
    - [x] Update AST to reflect rich types including object subtypes, array value types and optional types
    - [x] Add build step to integrate minification for browsers

- Test and development module
    - [ ] Function to run tests against types as property tests, so type info can be kept fresh
    - [ ] Function to return argument/signature mapping as key/value pairs

## Breaking Changes

### 0.9.x

- valueType is now an array instead of a string; any higher-kinded type definitions relying on a string will need updating

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
