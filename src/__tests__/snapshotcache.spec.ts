import * as ts from "typescript";
import * as fsMock from "mock-fs";
import { SnapshotCache } from "../snapshotcache";
import { parseSnapshotFile } from "../utils";
jest.mock("../utils");

let cache: SnapshotCache;
beforeEach(() => {
    cache = new SnapshotCache(ts as any);
});

afterEach(() => {
    fsMock.restore();
})

it("Returns empty array if file doesn't exist", () => {
    fsMock({
        "/abc/tt.ts.snap": ""
    });

    expect(cache.parseSnapshot("/abc/dd.ts.snap")).toEqual([]);
    expect(parseSnapshotFile).not.toBeCalled();
});

it("Reads file, parses it and returns definitions", () => {
    fsMock({
        "/abc/tt.ts.snap": fsMock.file({
            mtime: new Date(2017, 10, 10, 10, 1, 1),
            content: "some content"
        })
    });
    (parseSnapshotFile as jest.Mock).mockReturnValue([
        "this is definition, not important for test"
    ]);

    const def = cache.parseSnapshot("/abc/tt.ts.snap");
    expect(def).toEqual([
        "this is definition, not important for test"
    ]);
    expect(parseSnapshotFile).toBeCalledWith(ts, "some content");
});

it("Returns definitions from cache if mtime of file is same", () => {
    fsMock({
        "/abc/tt.ts.snap": fsMock.file({
            mtime: new Date(2017, 10, 10, 10, 1, 1),
            content: "some content"
        })
    });
    (parseSnapshotFile as jest.Mock).mockReturnValue([
        "this is definition, not important for test"
    ]);

    cache.parseSnapshot("/abc/tt.ts.snap");
    (parseSnapshotFile as jest.Mock).mockReset();

    const def = cache.parseSnapshot("/abc/tt.ts.snap");
    expect(def).toEqual([
        "this is definition, not important for test"
    ]);
    expect(parseSnapshotFile).not.toBeCalled();
});

it("Re-parses file if mtime was changed", () => {
    fsMock({
        "/abc/tt.ts.snap": fsMock.file({
            mtime: new Date(2017, 10, 10, 10, 1, 1),
            content: "some content"
        })
    });
    (parseSnapshotFile as jest.Mock).mockReturnValue([
        "this is definition, not important for test"
    ]);

    cache.parseSnapshot("/abc/tt.ts.snap");
    (parseSnapshotFile as jest.Mock).mockReset();

    fsMock({
        "/abc/tt.ts.snap": fsMock.file({
            mtime: new Date(2017, 10, 10, 10, 1, 2),
            content: "another content"
        })
    });

    cache.parseSnapshot("/abc/tt.ts.snap");
    expect(parseSnapshotFile).toBeCalledWith(ts, "another content");
});