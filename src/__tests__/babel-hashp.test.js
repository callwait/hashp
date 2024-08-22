const babel = require('@babel/core');
const plugin = require('../babel-hashp');

function transform(code) {
  return babel.transform(code, {
    plugins: [plugin],
    babelrc: false
  }).code;
}

describe('babel-plugin-hashp', () => {
  it('1. should transform basic variable declaration', () => {
    const input = `let #p count = 1;`;
    const output = transform(input);
    expect(output).toContain('let count = 1;');
    expect(output).toContain('console.log("#p count => ", count);');
  });

  it('2. should transform expression in variable declaration', () => {
    const input = `let #p sum = 1 + 1;`;
    const output = transform(input);
    expect(output).toContain('let sum = 1 + 1;');
    expect(output).toContain('console.log("#p sum => ", sum);');
  });

  it('3. should transform object property', () => {
    const input = `const obj = { name: "John", #p age: 3 };`;
    const output = transform(input);
    expect(output).toContain('name: "John"');
    expect(output).toContain('console.log("#p age => ", value);');
  });

  it('4. should transform array element', () => {
    const input = `const arr = [1, 2, 3, #p 4, 5];`;
    const output = transform(input);
    expect(output).toContain('[1, 2, 3,');
    expect(output).toContain('console.log("#p 4 => ", value);');
    expect(output).toContain(', 5]');
  });

  it('5. should transform function argument', () => {
    const input = `function greet(#p name) { return name + '!'; }`;
    const output = transform(input);
    expect(output).toContain('function greet(name)');
    expect(output).toContain('console.log("#p name => ", name);');
    expect(output).toContain('return name + \'!\';');
  });

  it('6. should transform return value', () => {
    const input = `function calculateArea(width, height) { return #p (width * height); }`;
    const output = transform(input);
    expect(output).toContain('function calculateArea(width, height)');
    expect(output).toContain('console.log("#p (width * height) => ", value);');
  });

  it('7. should transform conditional expression', () => {
    const input = `const isEven = #p (count === 1 ? 7 : "wrong");`;
    const output = transform(input);
    expect(output).toContain('const isEven =');
    expect(output).toContain('console.log("#p (count === 1 ? 7 : \\"wrong\\") => ", value);');
  });

  it('8. should transform template literal', () => {
    const input = "const message = `The count is ${#p (count + 7)}`;";
    const output = transform(input);
    expect(output).toContain('const message = `The count is ${');
    expect(output).toContain('console.log("#p (count + 7) => ", value);');
  });

  it('9. should transform arrow function', () => {
    const input = `const double = (x) => #p (x * 2 - 1);`;
    const output = transform(input);
    expect(output).toContain('const double = x =>');
    expect(output).toContain('console.log("#p (x * 2 - 1) => ", value);');
  });

  it('10. should transform object method', () => {
    const input = `const calculator = { add: (a, b) => #p (a + b), };`;
    const output = transform(input);
    expect(output).toContain('const calculator = {');
    expect(output).toContain('console.log("#p (a + b) => ", value);');
  });

  it('11. should transform destructuring assignment', () => {
    const input = `const { #p x, y } = { x: 11, y: 20 };`;
    const output = transform(input);
    expect(output).toContain('console.log("#p x => ", x);');
  });

  it('12. should transform spread operator', () => {
    const input = `const newArr = [...#p arr, 6, 7, 8];`;
    const output = transform(input);
    expect(output).toContain('const newArr = [...');
    expect(output).toContain('console.log("#p arr => ", value);');
    expect(output).toContain(', 6, 7, 8];');
  });

  it('13. should transform default parameter', () => {
    const input = `function welcome(#p name = "12") { console.log(\`Welcome, \${name}!\`); }`;
    const output = transform(input);
    expect(output).toContain('function welcome(name = "12")');
    expect(output).toContain('console.log("#p name => ", name);');
  });

  it('14. should transform nested object', () => {
    const input = `const user = { details: { #p id: 13, email: "user@example.com" } };`;
    const output = transform(input);
    expect(output).toContain('console.log("#p id => ", value);');
  });

  it('15. should transform array method argument', () => {
    const input = `const doubled = numbers.map(n => #p (n + 1));`;
    const output = transform(input);
    expect(output).toContain('const doubled = numbers.map(n =>');
    expect(output).toContain('console.log("#p (n + 1) => ", value);');
  });

  it('16. should transform async function', () => {
    const input = `async function fetchData() { const response = await fetch('url'); return #p (await response.json()); }`;
    const output = transform(input);
    expect(output).toContain('async function fetchData()');
    expect(output).toContain('console.log("#p (await response.json()) => ", value);');
  });

  it('17. should transform class property', () => {
    const input = `class Counter { #p count = 17; increment() { this.count++; } }`;
    const output = transform(input);
    expect(output).toContain('class Counter {');
    expect(output).toContain('console.log("#p count => ", value);');
  });

  it('18. should transform multiple debug points in one expression', () => {
    const input = `const result = #p (1 + #p (9 * 2));`;
    const output = transform(input);
    expect(output).toContain('const result =');
    expect(output).toContain('console.log("#p (9 * 2) => ", value);');
    expect(output).toContain('console.log("#p (1 + (9 * 2)) => ", value);');
  });

  it('19. should transform ternary operator', () => {
    const input = `const status = #p (isEven ? "Even" : "Odd");`;
    const output = transform(input);
    expect(output).toContain('const status =');
    expect(output).toContain('console.log("#p (isEven ? \\"Even\\" : \\"Odd\\") => ", value);');
  });

  it('20. should transform tagged template literal', () => {
    const input = `
      function debug(strings, ...values) {
        return strings.reduce((acc, str, i) => 
          acc + str + (#p values[i] || ''), '');
      }
      const debugMessage = debug\`Count: \${count}, Sum: \${sum}\`;
    `;
    const output = transform(input);
    expect(output).toContain('function debug(strings, ...values)');
    expect(output).toContain('console.log("#p values => ", value);');
    expect(output).toContain('const debugMessage = debug`Count: ${count}, Sum: ${sum}`;');
  });
});