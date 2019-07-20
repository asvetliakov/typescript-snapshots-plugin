import * as ts from "typescript";
import * as path from "path";
import { findNodeAtPosition, isMatchingCallExpression, isMatchingIdentifier, getParentTestBlocks, getCountOfIdentifiersInBlock, parseSnapshotFile } from "../utils";
import { source } from "./fixtures/testsource";

const file = ts.createSourceFile("a.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const file2path = path.join(__dirname, "./fixtures/valid.ts");
const fileConstantPath = path.join(__dirname, "./fixtures/testConstant.ts");
const program = ts.createProgram({
    options: {
        target: ts.ScriptTarget.Latest,
        noLib: true,
        module: ts.ModuleKind.ES2015,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
    },
    host: {
        ...ts.createCompilerHost({
            target: ts.ScriptTarget.Latest,
            module: ts.ModuleKind.ES2015,
            moduleResolution: ts.ModuleResolutionKind.NodeJs,
            noLib: true,
        }, true),
    },
    rootNames: [file2path, fileConstantPath],
});
const file2 = program.getSourceFile(file2path)

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

        res = getParentTestBlocks(ts as any, file2!, ["describe", "it"], ts.getPositionOfLineAndCharacter(file2!, 5, 5), program);
        expect(res).toBeDefined();
        expect(res!.blockNames).toEqual(["via constant"]);
        expect(res!.lastNode.getText()).toMatchSnapshot();

        res = getParentTestBlocks(ts as any, file2!, ["describe", "it"], ts.getPositionOfLineAndCharacter(file2!, 9, 8), program);
        expect(res).toBeDefined();
        expect(res!.blockNames).toEqual(["substitution via constant"]);
        expect(res!.lastNode.getText()).toMatchSnapshot();

        res = getParentTestBlocks(ts as any, file2!, ["describe", "it"], ts.getPositionOfLineAndCharacter(file2!, 16, 7), program);
        expect(res).toBeDefined();
        expect(res!.blockNames).toEqual(["another via constant, 5, via constant"]);
        expect(res!.lastNode.getText()).toMatchSnapshot();

        res = getParentTestBlocks(ts as any, file2!, ["describe", "it"], ts.getPositionOfLineAndCharacter(file2!, 20, 5), program);
        expect(res).toBeDefined();
        expect(res!.blockNames).toEqual(["exported constant"]);
        expect(res!.lastNode.getText()).toMatchSnapshot();

        res = getParentTestBlocks(ts as any, file2!, ["describe", "it"], ts.getPositionOfLineAndCharacter(file2!, 24, 5), program);
        expect(res).toBeDefined();
        expect(res!.blockNames).toEqual(["imported exported constant"]);
        expect(res!.lastNode.getText()).toMatchSnapshot();

        res = getParentTestBlocks(ts as any, file2!, ["describe", "it"], ts.getPositionOfLineAndCharacter(file2!, 28, 5), program);
        expect(res).toBeDefined();
        expect(res!.blockNames).toEqual(["Import star: exported constant"]);
        expect(res!.lastNode.getText()).toMatchSnapshot();

        res = getParentTestBlocks(ts as any, file2!, ["describe", "it"], ts.getPositionOfLineAndCharacter(file2!, 32, 5), program);
        expect(res).toBeDefined();
        expect(res!.blockNames).toEqual(["expa5"]);
        expect(res!.lastNode.getText()).toMatchSnapshot();

        res = getParentTestBlocks(ts as any, file2!, ["describe", "it"], ts.getPositionOfLineAndCharacter(file2!, 36, 5), program);
        expect(res).toBeDefined();
        expect(res!.blockNames).toEqual(["exp multiline abc def"]);
        expect(res!.lastNode.getText()).toMatchSnapshot();

        res = getParentTestBlocks(ts as any, file2!, ["describe", "it"], ts.getPositionOfLineAndCharacter(file2!, 43, 5), program);
        expect(res).toBeDefined();
        expect(res!.blockNames).toEqual(["exp exported constant via constant"]);
        expect(res!.lastNode.getText()).toMatchSnapshot();
    });
});

describe("getCountOfIdentifiersInBlock", () => {
    it("Returns number of identifiers in given block", () => {
        let node = findNodeAtPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 1, 1));
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 2, 29))).toEqual({
            anonymousCalls: 1,
            namedCalls: {},
        });
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 2, 13))).toEqual({
            anonymousCalls: 0,
            namedCalls: {},
        })

        node = findNodeAtPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 10, 5));
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 12, 9))).toEqual({
            anonymousCalls: 1,
            namedCalls: {},
        });
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 13, 17))).toEqual({
            anonymousCalls: 1,
            namedCalls: {},
        });
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 13, 34))).toEqual({
            anonymousCalls: 2,
            namedCalls: {},
        });

        node = findNodeAtPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 24, 5));
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 24, 23))).toEqual({
            anonymousCalls: 0,
            namedCalls: {},
        });
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 25, 9))).toEqual({
            anonymousCalls: 0,
            namedCalls: {},
        });
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 26, 9))).toEqual({
            anonymousCalls: 1,
            namedCalls: {},
        });
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 27, 9))).toEqual({
            anonymousCalls: 2,
            namedCalls: {},
        });
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 27, 18))).toEqual({
            anonymousCalls: 3,
            namedCalls: {},
        });
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 28, 5))).toEqual({
            anonymousCalls: 3,
            namedCalls: {},
        });


        node = findNodeAtPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 42, 5));
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 43, 21))).toEqual({
            anonymousCalls: 1,
            namedCalls: {},
        });
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 44, 21))).toEqual({
            anonymousCalls: 1,
            namedCalls: {
                custom: 1
            },
        });
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 46, 21))).toEqual({
            anonymousCalls: 2,
            namedCalls: {
                custom: 2
            },
        });
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 49, 21))).toEqual({
            anonymousCalls: 3,
            namedCalls: {
                custom: 3,
                custom2: 1,
            },
        });
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent!, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 50, 21))).toEqual({
            anonymousCalls: 3,
            namedCalls: {
                custom: 3,
                custom2: 2,
            },
        });

        node = findNodeAtPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 54, 2));
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 55, 16))).toEqual({
            anonymousCalls: 1,
            namedCalls: {},
        });
        expect(getCountOfIdentifiersInBlock(ts as any, node!.parent, ["toMatchSnapshot"], ts.getPositionOfLineAndCharacter(file, 56, 16))).toEqual({
            anonymousCalls: 1,
            namedCalls: {
                "Snapshot name": 1
            },
        });
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
        expect(parseSnapshotFile(ts as any, "test", empty).length).toBe(0);
    });

    it("Returns snapshot definitions", () => {
        const res = parseSnapshotFile(ts as any, "test", snapshot);
        expect(res).toMatchSnapshot();
    });
})