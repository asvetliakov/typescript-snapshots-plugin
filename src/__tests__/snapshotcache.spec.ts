import * as ts from "typescript";
import * as fsMock from "mock-fs";
import { SnapshotResolver } from "../snapshotcache";
import { parseSnapshotFile } from "../utils";
jest.mock("../utils");

let cache: SnapshotResolver;
beforeEach(() => {
    cache = new SnapshotResolver(ts as any);
});

afterEach(() => {
    fsMock.restore();
})

it("Returns undefined array if file doesn't exist", () => {
    fsMock({
        "/abc/__snapshots__/ab.ts.snap": ""
    });

    expect(cache.getSnapshotForFile("/abc/dd.ts")).toBeUndefined();
    expect(parseSnapshotFile).not.toBeCalled();
});

it("Reads file, parses it and returns definitions", () => {
    fsMock({
        "/abc/__snapshots__/tt.ts.snap": fsMock.file({
            mtime: new Date(2017, 10, 10, 10, 1, 1),
            content: "some content"
        })
    });
    (parseSnapshotFile as jest.Mock).mockReturnValue([
        "this is definition, not important for test"
    ]);

    const def = cache.getSnapshotForFile("/abc/tt.ts");
    expect(def).toEqual({
        file: "/abc/__snapshots__/tt.ts.snap",
        definitions: ["this is definition, not important for test"]
    });
    expect(parseSnapshotFile).toBeCalledWith(ts, "/abc/__snapshots__/tt.ts.snap", "some content");
});

it("Returns definitions from cache if mtime of file is same", () => {
    fsMock({
        "/abc/__snapshots__/tt.ts.snap": fsMock.file({
            mtime: new Date(2017, 10, 10, 10, 1, 1),
            content: "some content"
        })
    });
    (parseSnapshotFile as jest.Mock).mockReturnValue([
        "this is definition, not important for test"
    ]);

    cache.getSnapshotForFile("/abc/tt.ts");
    (parseSnapshotFile as jest.Mock).mockReset();

    const def = cache.getSnapshotForFile("/abc/tt.ts");
    expect(def).toEqual({
        file: "/abc/__snapshots__/tt.ts.snap",
        definitions: ["this is definition, not important for test"]
    });
    expect(parseSnapshotFile).not.toBeCalled();
});

it("Re-parses file if mtime was changed", () => {
    fsMock({
        "/abc/__snapshots__/tt.ts.snap": fsMock.file({
            mtime: new Date(2017, 10, 10, 10, 1, 1),
            content: "some content"
        })
    });
    (parseSnapshotFile as jest.Mock).mockReturnValue([
        "this is definition, not important for test"
    ]);

    cache.getSnapshotForFile("/abc/tt.ts");
    (parseSnapshotFile as jest.Mock).mockReset();

    fsMock({
        "/abc/__snapshots__/tt.ts.snap": fsMock.file({
            mtime: new Date(2017, 10, 10, 10, 1, 2),
            content: "another content"
        })
    });

    cache.getSnapshotForFile("/abc/tt.ts");
    expect(parseSnapshotFile).toBeCalledWith(ts, "/abc/__snapshots__/tt.ts.snap", "another content");
});

it("Picks first available file when given multiple extensions", () => {
    cache.extensions = [".story", ".snap"];
    fsMock({
        "/abc/__snapshots__/tt.ts.story": fsMock.file({
            mtime: new Date(2017, 10, 10, 10, 1, 1),
            content: "story content"
        }),
        "/abc/__snapshots__/tt.ts.snap": fsMock.file({
            mtime: new Date(2017, 10, 10, 10, 1, 1),
            content: "some content"
        })
    });
    (parseSnapshotFile as jest.Mock).mockReturnValue([
        "this is definition, not important for test"
    ]);

    const def = cache.getSnapshotForFile("/abc/tt.ts");
    expect(def).toEqual({
        file: "/abc/__snapshots__/tt.ts.story",
        definitions: ["this is definition, not important for test"]
    });
    expect(parseSnapshotFile).toBeCalledWith(ts, "/abc/__snapshots__/tt.ts.story", "story content");
});

it("Customizable snapshot directory", () => {
    cache.dir = "__my__";
    fsMock({
        "/abc/__my__/tt.ts.snap": fsMock.file({
            mtime: new Date(),
            content: "some content"
        }),
        "/abc/__snapshots__/tt.ts.snap": fsMock.file({
            mtime: new Date(),
            content: "another content"
        })
    });
    (parseSnapshotFile as jest.Mock).mockReturnValue([
        "this is definition, not important for test"
    ]);

    let def = cache.getSnapshotForFile("/abc/tt.ts");
    expect(def).toEqual({
        file: "/abc/__my__/tt.ts.snap",
        definitions: ["this is definition, not important for test"]
    });
    expect(parseSnapshotFile).toBeCalledWith(ts, "/abc/__my__/tt.ts.snap", "some content");

    fsMock({
        "/abc/tt.ts.snap": fsMock.file({
            mtime: new Date(),
            content: "some content"
        }),
    });
    cache.dir = "";
    (parseSnapshotFile as jest.Mock).mockClear();
    def = cache.getSnapshotForFile("/abc/tt.ts");
    expect(def).toEqual({
        file: "/abc/tt.ts.snap",
        definitions: ["this is definition, not important for test"]
    });
    expect(parseSnapshotFile).toBeCalledWith(ts, "/abc/tt.ts.snap", "some content");

    cache.dir = "./";
    (parseSnapshotFile as jest.Mock).mockClear();
    def = cache.getSnapshotForFile("/abc/tt.ts");
    expect(def).toEqual({
        file: "/abc/tt.ts.snap",
        definitions: ["this is definition, not important for test"]
    });
})

it("getAllPossiblePathsForFile", () => {
    cache.extensions = [".snap", ".other"];
    const files = cache.getAllPossiblePathsForFile("/a/b/c.spec.tsx");
    expect(files).toMatchSnapshot();
});