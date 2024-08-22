# babel-plugin-hashp

babel-plugin-hashp is a Babel plugin inspired by Clojure's Hashp library. It provides an easy way to add debug logging to your JavaScript code.

## Usage

Once installed, you can use the `#p` prefix to log expressions in various contexts:

```javascript
// 1. Basic variable declaration
let #p count = 1;
// Transforms to:
let count = 1;
console.log("#p count => ", count);


// 2. Expression in variable declaration
let #p sum = 1 + 1;
// Transforms to:
let sum = 1 + 1;
console.log("#p sum => ", sum);


// 3. Object property
const obj = { name: "John", #p age: 3 };
// Transforms to:
const obj = {
  name: "John",
  age: (value => {
    console.log("#p age => ", value);
    return value;
  })(3)
};


// 4. Array element
const arr = [1, 2, 3, #p 4, 5];
// Transforms to:
const arr = [1, 2, 3, (value => {
  console.log("#p 4 => ", value);
  return value;
})(4), 5];


// 5. Function argument
function greet(#p name) { return name + '!'}
// Transforms to:
function greet(name) {
  console.log("#p name => ", name);
  return name + '!';
}
greet(5);


// 6. Return value
function calculateArea(width, height) {
  return #p (width * height);
}
// Transforms to:
function calculateArea(width, height) {
  return (value => {
    console.log("#p (width * height) => ", value);
    return value;
  })(width * height);
}
calculateArea(2,3);


// 7. Conditional expression
const isEven = #p (count === 1 ? 7 : "wrong");
// Transforms to:
const isEven = (value => {
  console.log("#p (count === 1 ? 7 : \"wrong\") => ", value);
  return value;
})(count === 1 ? 7 : "wrong");


// 8. Template literal
const message = `The count is ${#p (count + 7)}`;
// Transforms to:
const message = `The count is ${(value => {
  console.log("#p (count + 7) => ", value);
  return value;
})(count + 7)}`;


// 9. Arrow function
const double = (x) => #p (x * 2 - 1);
// Transforms to:
const double = x => (value => {
  console.log("#p (x * 2 - 1) => ", value);
  return value;
})(x * 2 - 1);
double(5);


// 10. Object method
const calculator = {
  add: (a, b) => #p (a + b),
};
// Transforms to:
const calculator = {
  add: (a, b) => (value => {
    console.log("#p (a + b) => ", value);
    return value;
  })(a + b)
};
calculator.add(5, 5);


//11. Destructuring assignment
const { #p x, y } = { x: 11, y: 20 };
// Transforms to:
const _temp = {
  x: 11,
  y: 20
};
const x = _temp.x;
const y = _temp.y;
console.log("#p x => ", x);


// 12. Spread operator
const newArr = [...#p arr, 6, 7, 8];
// Transforms to:
const newArr = [...(value => {
  console.log("#p arr => ", value);
  return value;
})(arr), 6, 7, 8];


// 13. Default parameter
function welcome(#p name = "12") {
  console.log(`Welcome, ${name}!`);
}
// Transforms to:
function welcome(name = "12") {
  console.log("#p name => ", name);
  console.log(`Welcome, ${name}!`);
}
welcome();


// 14. Nested object
const user = {
  details: {
    #p id: 13,
    email: "user@example.com"
  }
};
// Transforms to:
const user = {
  details: {
    id: (value => {
      console.log("#p id => ", value);
      return value;
    })(13),
    email: "user@example.com"
  }
};
Object.keys(user);


// 15. Array method argument
const numbers = [13, 14, 15];
const doubled = numbers.map(n => #p (n + 1));
// Transforms to:
const numbers = [13, 14, 15];
const doubled = numbers.map(n => (value => {
  console.log("#p (n + 1) => ", value);
  return value;
})(n + 1));


// 16. Async function
async function fetchData() {
  const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
  return #p (await response.json());
}
// Transforms to:
async function fetchData() {
  const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
  return (value => {
    console.log("#p (await response.json()) => ", value);
    return value;
  })(await response.json());
}
fetchData();


// 17. Class property
class Counter {
  #p count = 17;
  
  increment() {
    this.count++;
  }
}
// Transforms to:
class Counter {
  count = (value => {
    console.log("#p count => ", value);
    return value;
  })(17);
  increment() {
    this.count++;
  }
}
const counter = new Counter();


// 18. Multiple debug points in one expression
const result = #p (1 + #p (9 * 2));
// Transforms to:
const result = (value => {
  console.log("#p (1 + (9 * 2)) => ", value);
  return value;
})(1 + (value => {
  console.log("#p (9 * 2) => ", value);
  return value;
})(9 * 2));


// 19. Ternary operator
const status = #p (isEven ? "Even" : "Odd");
// Transforms to:
const status = (value => {
  console.log("#p (isEven ? \"Even\" : \"Odd\") => ", value);
  return value;
})(isEven ? "Even" : "Odd");


// 20. Tagged template literal
function debug(strings, ...values) {
  return strings.reduce((acc, str, i) => 
    acc + str + (#p values[i] || ''), '');
}
// Transforms to:
function debug(strings, ...values) {
  return strings.reduce((acc, str, i) => acc + str + ((value => {
    console.log("#p values => ", value);
    return value;
  })(values)[i] || ''), '');
}
const debugMessage = debug`Count: ${count}, Sum: ${sum}`;
```

## Install

### npm

```bash
npm install --save-dev babel-plugin-hashp
```

### yarn

```bash
yarn add --dev babel-plugin-hashp
```

## Configuration

You can configure the plugin by adding the following to your `.babelrc` file:

```json
{
  "plugins": [
    ["babel-plugin-hashp"]
  ]
}
```

## License

babel-plugin-hashp is released under the MIT license.