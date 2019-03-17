import * as ts_module from "typescript/lib/tsserverlibrary";
import * as fs from "fs";
import * as nodePath from "path";
import { SnapshotDefinition, parseSnapshotFile } from "./utils";

interface Cache {
    definitions: SnapshotDefinition[];
    lastModifiedTime: number;
}

export interface SnapshotInfo {
    file: string;
    definitions: SnapshotDefinition[];
}

/**
 * Simple snapshot source cache
 */
export class SnapshotResolver {
    private _extensions: string[] = [".snap"];
    private _dir: string = "__snapshots__"
    public constructor(
        private ts: typeof ts_module,
        private cacheMap: Map<string, Cache> = new Map(),
    ) { }

    public set extensions(ext: string[]) {
        this._extensions = ext;
        this.cacheMap.clear();
    }

    public get extensions(): string[] {
        return this._extensions;
    }

    public set dir(d: string) {
        this._dir = d;
        this.cacheMap.clear();
    }

    public get dir(): string {
        return this._dir;
    }


    /**
     * Return snapshot definitions for given snapshot file name.
     * May return definitions from cache if snapshot file hasn't been changed
     *
     * @param testFile
     * @returns
     */
    public getSnapshotForFile(testFile: string): SnapshotInfo | undefined {
        const snapshotPath = this.getAllPossiblePathsForFile(testFile).find(path => fs.existsSync(path));
        // if (!fs.existsSync(path)) {
        //     return [];
        // }
        if (!snapshotPath) {
            return;
        }
        try {
            const { mtime } = fs.statSync(snapshotPath);
            const cacheEntry = this.cacheMap.get(snapshotPath);
            if (cacheEntry && cacheEntry.lastModifiedTime === mtime.getTime()) {
                return {
                    file: snapshotPath,
                    definitions: cacheEntry.definitions,
                };
            }
            const source = fs.readFileSync(snapshotPath, "utf8");
            const newEntry: Cache = {
                lastModifiedTime: mtime.getTime(),
                definitions: parseSnapshotFile(this.ts, snapshotPath, source)
            };
            this.cacheMap.set(snapshotPath, newEntry);
            return {
                file: snapshotPath,
                definitions: newEntry.definitions,
            };
        } catch {
            return undefined;
        }
    }

    /**
     * Return snapshot path for file
     */
    public getAllPossiblePathsForFile(filePath: string): string[] {
        return [
            ...this.extensions.map(ext => nodePath.join(nodePath.dirname(filePath), this.dir, nodePath.basename(filePath) + ext)),
            // include js.${ext} too, refs #11
            ...this.extensions.map(ext => nodePath.join(nodePath.dirname(filePath), this.dir, nodePath.basename(filePath, nodePath.extname(filePath)) + ".js" + ext)),
        ];
    }
}