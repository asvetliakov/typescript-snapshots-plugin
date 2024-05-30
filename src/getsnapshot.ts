import * as ts_module from "typescript/lib/tsserverlibrary"
import { SnapshotDefinition, findNodeAtPosition, isMatchingIdentifier, getParentTestBlocks, getCountOfIdentifiersInBlock } from "./utils";
import { SnapshotResolver } from "./snapshotcache";
import { Configuration } from "./config";

/**
 * Try to get snapshot definition for given position in source file
 *
 * @export
 * @param ts
 * @param sourceFile
 * @param position
 * @param snapshotCache
 * @param config
 * @returns
 */
export function tryGetSnapshotForPosition(
    ts: typeof ts_module,
    sourceFile: ts_module.SourceFile | undefined,
    position: number,
    snapshotCache: SnapshotResolver,
    config: Configuration,
    program?: ts_module.Program,
): SnapshotDefinition | undefined {
    if (!sourceFile) {
        return;
    }
    try {
        const node = findNodeAtPosition(ts, sourceFile, position);
        if (node && isMatchingIdentifier(ts, node, config.snapshotCallIdentifiers) && node.parent && node.parent.parent && ts.isCallExpression(node.parent.parent)) {

            // avoid reading snapshot file until there will be real case for snapshot existing, i.e. blockInfo not undefined
            const blockInfo = getParentTestBlocks(ts, sourceFile, config.testBlockIdentifiers, node.getStart(sourceFile), program);
            if (blockInfo) {
                const snapshotInfo = snapshotCache.getSnapshotForFile(sourceFile.fileName);
                if (!snapshotInfo || !snapshotInfo.definitions.length) {
                    return;
                }
                const snapshotCallsInBlock = getCountOfIdentifiersInBlock(ts, blockInfo.lastNode, config.snapshotCallIdentifiers, node.getStart(sourceFile));

                const customName = node.parent.parent.arguments.find(arg => ts.isStringLiteral(arg));
                // let snapshotName = blockInfo.blockNames.join(" ") + " " + (snapshotCallsInBlock + 1);
                let snapshotName = blockInfo.blockNames.join(config.snapshotFileFlavor === "vitest" ? " > " : " ");
                if (customName) {
                    snapshotName += (config.snapshotFileFlavor === "vitest" ? " > " : ": ") + (customName as ts.StringLiteralLike).text + " " + snapshotCallsInBlock.namedCalls[(customName as ts.StringLiteralLike).text];
                } else {
                    snapshotName += " " + (snapshotCallsInBlock.anonymousCalls);
                }
                return snapshotInfo.definitions.find(t => t.name === snapshotName);
            }
        }
    } catch {
        /* ignore */
    }
    return undefined;
}