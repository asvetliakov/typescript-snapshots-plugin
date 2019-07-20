import * as path from "path";
import * as ts from "typescript";
import { tryGetSnapshotForPosition } from "../getsnapshot";
import { SnapshotResolver } from "../snapshotcache";
import { source } from "./fixtures/testsource";
import { Configuration } from "../config";
import { SnapshotDefinition } from "../utils";

function cleanPathFromSnapshotDef(def: SnapshotDefinition | undefined): SnapshotDefinition {
    return {
        ...def!,
        file: def!.file.substr(def!.file.lastIndexOf("/")),
    };
}

describe("tryGetSnapshotForPosition", () => {
    const cache = new SnapshotResolver(ts as any);
    cache.extensions = [".snap"];
    const file = ts.createSourceFile(path.resolve(__dirname, "./fixtures/testsource.ts"), source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const config: Configuration = {
        snapshotCallIdentifiers: ["toMatchSnapshot"],
        testBlockIdentifiers: ["it", "it.only", "describe"],
        snapshotFileExtensions: [".snap"],
        snapshotDir: "__snapshots__",
        useJSTagsForSnapshotHover: false,
        extractCSSForJSTag: false,
    }
    // const testIdentifiers = [
    // ];
    // const snapshotIdentifiers = ["toMatchSnapshot"];

    it("Returns undefined for invalid position", () => {
        expect(tryGetSnapshotForPosition(ts as any, file, 2000, cache, config)).toBeUndefined();
    });

    it("Returns undefined if position is not at snapshot identifier call", () => {
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 4, 0), cache, config)).toBeUndefined();
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 5, 6), cache, config)).toBeUndefined();
        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 20, 16), cache, config)).toBeUndefined();
    });

    it("Returns undefined for invalid node", () => {

        expect(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 13, 21), cache, config)).toBeUndefined();
    });

    it("Returns snapshot definition", () => {
        expect(cleanPathFromSnapshotDef(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 2, 18), cache, config))).toMatchSnapshot();
        expect(cleanPathFromSnapshotDef(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 6, 19), cache, config))).toMatchSnapshot();
        expect(cleanPathFromSnapshotDef(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 11, 21), cache, config))).toMatchSnapshot();
        expect(cleanPathFromSnapshotDef(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 25, 21), cache, config))).toMatchSnapshot();
        expect(cleanPathFromSnapshotDef(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 26, 21), cache, config))).toMatchSnapshot();
        expect(cleanPathFromSnapshotDef(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 27, 21), cache, config))).toMatchSnapshot();
        expect(cleanPathFromSnapshotDef(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 32, 33), cache, config))).toMatchSnapshot();
        expect(cleanPathFromSnapshotDef(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 36, 33), cache, config))).toMatchSnapshot();

        // custom names
        expect(cleanPathFromSnapshotDef(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 43, 21), cache, config))).toMatchSnapshot();
        expect(cleanPathFromSnapshotDef(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 44, 21), cache, config))).toMatchSnapshot();
        expect(cleanPathFromSnapshotDef(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 45, 21), cache, config))).toMatchSnapshot();
        expect(cleanPathFromSnapshotDef(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 46, 21), cache, config))).toMatchSnapshot();
        expect(cleanPathFromSnapshotDef(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 47, 21), cache, config))).toMatchSnapshot();
        expect(cleanPathFromSnapshotDef(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 48, 21), cache, config))).toMatchSnapshot();
        expect(cleanPathFromSnapshotDef(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 49, 21), cache, config))).toMatchSnapshot();
        expect(cleanPathFromSnapshotDef(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 50, 21), cache, config))).toMatchSnapshot();

        // prop matchers
        expect(cleanPathFromSnapshotDef(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 55, 16), cache, config))).toMatchSnapshot();
        expect(cleanPathFromSnapshotDef(tryGetSnapshotForPosition(ts as any, file, ts.getPositionOfLineAndCharacter(file, 56, 16), cache, config))).toMatchSnapshot();

    });
});