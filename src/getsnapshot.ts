import * as ts_module from "typescript/lib/tsserverlibrary"
import * as path from "path";
import { SnapshotDefinition, findNodeAtPosition, isMatchingIdentifier, getParentTestBlocks, getCountOfIdentifiersInBlock } from "./utils";
import { SnapshotCache } from "./snapshotcache";

/**
 * Try to get snapshot definition for given position in source file
 *
 * @export
 * @param ts
 * @param sourceFile
 * @param position
 * @param snapshotCache
 * @param snapshotCallIdentifiers
 * @param testBlockIdentifiers
 * @returns
 */
export function tryGetSnapshotForPosition(
    ts: typeof ts_module,
    sourceFile: ts_module.SourceFile | undefined,
    position: number,
    snapshotCache: SnapshotCache,
    snapshotCallIdentifiers: string[],
    testBlockIdentifiers: string[]
): SnapshotDefinition | undefined {
    if (!sourceFile) {
        return;
    }
    try {
        const node = findNodeAtPosition(ts, sourceFile, position);
        if (node && isMatchingIdentifier(ts, node, snapshotCallIdentifiers) && node.parent && node.parent.parent && ts.isCallExpression(node.parent.parent)) {
            const snapshotPath = getSnapshotPathForFileName(sourceFile.fileName);

            // avoid reading snapshot file until there will be real case for snapshot existing, i.e. blockInfo not undefined
            const blockInfo = getParentTestBlocks(ts, sourceFile, testBlockIdentifiers, node.getStart(sourceFile));
            if (blockInfo) {
                const snapshotBlocks = snapshotCache.parseSnapshot(snapshotPath);
                const snapshotCallsInBlock = getCountOfIdentifiersInBlock(ts, blockInfo.lastNode, snapshotCallIdentifiers, node.getStart(sourceFile));

                const customName = node.parent.parent.arguments[0] && ts.isStringLiteralLike(node.parent.parent.arguments[0]) ? node.parent.parent.arguments[0] : undefined;
                // let snapshotName = blockInfo.blockNames.join(" ") + " " + (snapshotCallsInBlock + 1);
                let snapshotName = blockInfo.blockNames.join(" ");
                if (customName) {
                    snapshotName += ": " + (customName as ts.StringLiteralLike).text + " " + snapshotCallsInBlock.namedCalls[(customName as ts.StringLiteralLike).text];
                } else {
                    snapshotName += " " + (snapshotCallsInBlock.anonymousCalls);
                }
                return snapshotBlocks.find(t => t.name === snapshotName);
            }
        }
    } catch {
        /* ignore */
    }
    return undefined;
}


/**
 * Return snapshot file path for given file path
 *
 * @export
 * @param filePath
 * @returns
 */
export function getSnapshotPathForFileName(filePath: string): string {
    return path.dirname(filePath) + "/__snapshots__/" + path.basename(filePath) + ".snap";
}