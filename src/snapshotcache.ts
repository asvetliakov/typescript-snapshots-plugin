import * as ts_module from "typescript/lib/tsserverlibrary";
import * as fs from "fs";
import { SnapshotDefinition, parseSnapshotFile } from "./utils";

interface Cache {
    definitions: SnapshotDefinition[];
    lastModifiedTime: number;
}

/**
 * Simple snapshot source cache
 */
export class SnapshotCache {
    public constructor(
        private ts: typeof ts_module,
        private cacheMap: Map<string, Cache> = new Map()
    ) { }

    /**
     * Return snapshot definitions for given snapshot file name.
     * May return definitions from cache if snapshot file hasn't been changed
     *
     * @param fileName
     * @returns
     */
    public parseSnapshot(fileName: string): SnapshotDefinition[] {
        if (!fs.existsSync(fileName)) {
            return [];
        }
        try {
            const { mtime } = fs.statSync(fileName);
            const cacheEntry = this.cacheMap.get(fileName);
            if (cacheEntry && cacheEntry.lastModifiedTime === mtime.getTime()) {
                return cacheEntry.definitions;
            }
            const file = fs.readFileSync(fileName, "utf8");
            const newEntry: Cache = {
                lastModifiedTime: mtime.getTime(),
                definitions: parseSnapshotFile(this.ts, file)
            };
            this.cacheMap.set(fileName, newEntry);
            return newEntry.definitions;
        } catch {
            return [];
        }
    }
}