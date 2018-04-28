import * as path from "path";
import * as ts from "typescript";
import { getSnapshotPathForFileName, tryGetSnapshotForPosition } from "../getsnapshot";
import { SnapshotCache } from "../snapshotcache";
import { source } from "./testsource";


describe("getSnapshotPathForFileName", () => {
    it("Returns snapshot path for file name", () => {
        expect(getSnapshotPathForFileName("/abc/def/test.ts")).toBe("/abc/def/__snapshots__/test.ts.snap");
    });
})

describe("tryGetSnapshotForPosition", () => {
    const cache = new SnapshotCache(ts as any);
    const file = ts.createSourceFile(path.resolve(__dirname, "./testsource.ts"), source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const testIdentifiers = [
        "it", "it.only", "describe"
    ];
    const snapshotIdentifiers = ["toMatchSnapshot"];

    it("Returns undefined for invalid position", () => {
        expect(tryGetSnapshotForPosition(ts as any, file, 2000, cache, snapshotIdentifiers, testIdentifiers)).toBeUndefined();
    });

    it("Returns undefined if position is not at snapshot identifier call", () => {
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 4, 0), cache, snapshotIdentifiers, testIdentifiers)).toBeUndefined();
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 5, 6), cache, snapshotIdentifiers, testIdentifiers)).toBeUndefined();
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 20, 16), cache, snapshotIdentifiers, testIdentifiers)).toBeUndefined();
    });

    it("Returns undefined for invalid node", () => {

        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 13, 21), cache, snapshotIdentifiers, testIdentifiers)).toBeUndefined();
    });

    it("Returns snapshot definition", () => {
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 2, 18), cache, snapshotIdentifiers, testIdentifiers)).toMatchSnapshot();
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 6, 19), cache, snapshotIdentifiers, testIdentifiers)).toMatchSnapshot();
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 11, 21), cache, snapshotIdentifiers, testIdentifiers)).toMatchSnapshot();
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 25, 21), cache, snapshotIdentifiers, testIdentifiers)).toMatchSnapshot();
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 26, 21), cache, snapshotIdentifiers, testIdentifiers)).toMatchSnapshot();
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 27, 21), cache, snapshotIdentifiers, testIdentifiers)).toMatchSnapshot();
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 32, 33), cache, snapshotIdentifiers, testIdentifiers)).toMatchSnapshot();
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 36, 33), cache, snapshotIdentifiers, testIdentifiers)).toMatchSnapshot();

        // custom names
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 43, 21), cache, snapshotIdentifiers, testIdentifiers)).toMatchSnapshot();
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 44, 21), cache, snapshotIdentifiers, testIdentifiers)).toMatchSnapshot();
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 45, 21), cache, snapshotIdentifiers, testIdentifiers)).toMatchSnapshot();
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 46, 21), cache, snapshotIdentifiers, testIdentifiers)).toMatchSnapshot();
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 47, 21), cache, snapshotIdentifiers, testIdentifiers)).toMatchSnapshot();
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 48, 21), cache, snapshotIdentifiers, testIdentifiers)).toMatchSnapshot();
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 49, 21), cache, snapshotIdentifiers, testIdentifiers)).toMatchSnapshot();
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 50, 21), cache, snapshotIdentifiers, testIdentifiers)).toMatchSnapshot();

    });
});