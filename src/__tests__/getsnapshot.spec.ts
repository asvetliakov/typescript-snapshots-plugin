import { getSnapshotPathForFileName } from "../getsnapshot";


describe("getSnapshotPathForFileName", () => {
    it("Returns snapshot path for file name", () => {
        expect(getSnapshotPathForFileName("/abc/def/test.ts")).toBe("/abc/def/__snapshots__/test.ts.snap");
    });
})