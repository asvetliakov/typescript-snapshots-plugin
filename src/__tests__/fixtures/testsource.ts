export const source = `
it("test", () => {
    expect(a).toMatchSnapshot();
});

it.only("test2", () => {
    expect(a).toMatchSnapshot();
});

describe("a", () => {
    it("test2", () => {
        expect(b).toMatchSnapshot();
        // invalid
        expect(c).toMatchSnapshot(
    });
});

describe();
describe("test", () => {});
it("test", () => {
    expect(a).toBe(1);
});

describe("valid", () => {
    it("test1", () => {
        expect(a).toMatchSnapshot();
        expect(a).toMatchSnapshot();
        expect(a).toMatchSnapshot();
    });

    describe("inner", () => {
        it("test2", () => {
            expect(b).toMatchSnapshot();
        });

        it("test3", () => {
            expect(b).toMatchSnapshot();
        });
    });
});

describe("custom", () => {
    it("with custom names", () => {
        expect(a).toMatchSnapshot();
        expect(a).toMatchSnapshot("custom");
        expect(a).toMatchSnapshot("custom");
        expect(a).toMatchSnapshot();
        expect(a).toMatchSnapshot("custom2");
        expect(a).toMatchSnapshot();
        expect(a).toMatchSnapshot("custom");
        expect(a).toMatchSnapshot("custom2");
    });
})

it("property matchers", () => {
    expect(a).toMatchSnapshot({ a: expect.any(String) });
    expect(a).toMatchSnapshot({ a: expect.any(String) }, "Snapshot name");
});
`;