import * as ts from "typescript";
import { findNodeAtPosition, isMatchingCallExpression, isMatchingIdentifier, getParentTestBlocks, getCountOfIdentifiersInBlock, parseSnapshotFile } from "../utils";

const source = `
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
`;
const file = ts.createSourceFile("a.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

describe("findNodeAtPosition", () => {
    it("Returns node at position", () => {
        let node = findNodeAtPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 1, 2));
        expect(node!.getText()).toBe("it");

        node = findNodeAtPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 2, 7));
        expect(node!.getText()).toBe("expect");

        node = findNodeAtPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 2, 25));
        expect(node!.getText()).toBe("toMatchSnapshot");

        node = findNodeAtPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 4, 0));
        expect(node).toBeUndefined();

        node = findNodeAtPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 11, 27));
        expect(node!.getText()).toBe("toMatchSnapshot");
    })
});

describe("isMatchingIdentifier", () => {
    it("Returns true if node is identifier and matches given identifiers", () => {
        let node = findNodeAtPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 1, 2));
        expect(isMatchingIdentifier(ts as any, node!, ["it"])).toBeTruthy();
        expect(isMatchingIdentifier(ts as any, node!, ["its"])).toBeFalsy();

        node = findNodeAtPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 2, 21));
        expect(isMatchingIdentifier(ts as any, node!, ["toMatchSnapshot"])).toBeTruthy();
        expect(isMatchingIdentifier(ts as any, node!, ["toMatchSnapsht"])).toBeFalsy();
    });
});

describe("isMatchingCallExpression", () => {
    it("Returns true if node is call expression and matches given identifiers", () => {
        let node = findNodeAtPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 1, 2));
        expect(isMatchingCallExpression(ts as any, node!.parent!, ["it"])).toBeTruthy();
        expect(isMatchingCallExpression(ts as any, node!.parent!, ["its"])).toBeFalsy();

        node = findNodeAtPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 5, 5));
        // identifier -> property access -> call exp
        expect(isMatchingCallExpression(ts as any, node!.parent!.parent!, ["it.only"])).toBeTruthy();
        expect(isMatchingCallExpression(ts as any, node!.parent!.parent!, ["it"])).toBeFalsy();

        node = findNodeAtPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 9, 4));
        expect(isMatchingCallExpression(ts as any, node!.parent!, ["describe"])).toBeTruthy();
    });
})

describe("getParentTestBlocks", () => {
    it("Returns last test block and all parent names", () => {
        let res = getParentTestBlocks(ts as any, file, ["describe", "it"], ts.getPositionOfLineAndCharacter(file, 2, 17));
        expect(res).toBeDefined();
        expect(res!.blockNames).toEqual(["test"]);
        expect(res!.lastNode).toBeDefined();
        expect(res!.lastNode.getText()).toMatchSnapshot();

        res = getParentTestBlocks(ts as any, file, ["describe", "it"], ts.getPositionOfLineAndCharacter(file, 6, 20));
        expect(res).toBeUndefined();
        res = getParentTestBlocks(ts as any, file, ["describe", "it", "it.only"], ts.getPositionOfLineAndCharacter(file, 6, 20));
        expect(res).toBeDefined();
        expect(res!.blockNames).toEqual(["test2"]);
        expect(res!.lastNode.getText()).toMatchSnapshot();

        res = getParentTestBlocks(ts as any, file, ["describe", "it"], ts.getPositionOfLineAndCharacter(file, 11, 22));
        expect(res).toBeDefined();
        expect(res!.blockNames).toEqual(["a", "test2"])
        expect(res!.lastNode.getText()).toMatchSnapshot();

        res = getParentTestBlocks(ts as any, file, ["describe", "it"], ts.getPositionOfLineAndCharacter(file, 32, 32));
        expect(res).toBeDefined();
        expect(res!.blockNames).toEqual(["valid", "inner", "test2"]);
        expect(res!.lastNode.getText()).toMatchSnapshot();

        res = getParentTestBlocks(ts as any, file, ["describe", "it"], ts.getPositionOfLineAndCharacter(file, 36, 36));
        expect(res).toBeDefined();
        expect(res!.blockNames).toEqual(["valid", "inner", "test3"]);
        expect(res!.lastNode.getText()).toMatchSnapshot();

        res = getParentTestBlocks(ts as any, file, ["describe", "it"], ts.getPositionOfLineAndCharacter(file, 27, 27));
        expect(res).toBeDefined();
        expect(res!.blockNames).toEqual(["valid", "test1"]);
        expect(res!.lastNode.getText()).toMatchSnapshot();
    });
});

describe("getCountOfIdentifiersInBlock", () => {
    it("Returns number of identifiers in given block", () => {
        let node = findNodeAtPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 1, 1));
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 2, 29))).toBe(1);
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 2, 13))).toBe(0);

        node = findNodeAtPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 10, 5));
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 12, 9))).toBe(1);
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 13, 17))).toBe(1);
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 13, 34))).toBe(2);

        node = findNodeAtPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 24, 5));
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 24, 23))).toBe(0);
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 25, 9))).toBe(0);
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 26, 9))).toBe(1);
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 27, 9))).toBe(2);
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 27, 18))).toBe(2);
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 28, 5))).toBe(3);
    });
});

describe("parseSnapshotFile", () => {
    const snapshot = `
        exports["abc"] = "abc";

        exports[\`abc\`] = \`
        abc,
        def
        \`;

        module.exports["bb"] = "abc";

        exports["def"] = "";
    `;

    const empty = ``;

    it("Returns empty array for empty snapshot", () => {
        expect(parseSnapshotFile(ts as any, empty).length).toBe(0);
    });

    it("Returns snapshot definitions", () => {
        const res = parseSnapshotFile(ts as any, snapshot);
        expect(res).toMatchSnapshot();
    });
})