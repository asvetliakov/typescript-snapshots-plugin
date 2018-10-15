import { Test } from "./testConstant";

const a = "via constant";
it(a, () => {
    expect(a).toBe(1);
});

it(`substitution ${a}`, () => {
    expect(a).toBe(1);
});

const b = 5;
const c = a;

it(`another ${a}, ${b}, ${c}`, () => {
    expect(a).toBe(1);
});

it(Test, () => {
    expect(a).toBe(1);
});

it(`imported ${Test}`, () => {
    expect(a).toBe(1);
});

declare function it(...args: any[]): any;