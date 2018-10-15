import * as ts_module from "typescript/lib/tsserverlibrary";


/**
 * Find closest node at given position
 *
 * @export
 * @param ts
 * @param sourceFile
 * @param position
 * @returns
 */
export function findNodeAtPosition(ts: typeof ts_module, sourceFile: ts.SourceFile, position: number): ts_module.Node | undefined {
    function find(node: ts.Node): ts_module.Node | undefined {
        if (position >= node.getStart(sourceFile) && position <= node.getEnd()) {
            return ts.forEachChild(node, find) || node;
        }
        return;
    }
    return ts.forEachChild(sourceFile, find);
}

/**
 * Check if given node is the call expression with matching identifiers.
 * Main use is the checking is the node is toMatchSnapshot identifier call
 *
 * @export
 * @param ts
 * @param node
 * @param identifiers
 * @returns
 */
export function isMatchingCallExpression(ts: typeof ts_module, node: ts_module.Node, identifiers: string[]): node is ts_module.CallExpression {
    if (!ts.isCallExpression(node)) {
        return false;
    }
    const text = node.expression.getText();
    return identifiers.indexOf(text) !== -1;
}

/**
 * Check if given node is identifiers and match any of given identifiers
 *
 * @export
 * @param ts
 * @param node
 * @param identifiers
 * @returns
 */
export function isMatchingIdentifier(ts: typeof ts_module, node: ts_module.Node, identifiers: string[]): node is ts_module.Identifier {
    if (!ts.isIdentifier(node)) {
        return false;
    }
    return identifiers.indexOf(node.getText()) !== -1;
}

export interface TestBlockInfo {
    /**
     * Parent + current test block names
     */
    blockNames: string[]
    /**
     * Last test block node
     */
    lastNode: ts.Node;
}

/**
 * Return all parent test blocks
 *
 * @export
 * @param ts
 * @param sourceFile
 * @param testBlockIdentifiers
 * @param lookupUntil
 * @returns
 */
export function getParentTestBlocks(
    ts: typeof ts_module,
    sourceFile: ts.SourceFile,
    testBlockIdentifiers: string[],
    lookupUntil: number,
    program?: ts_module.Program,
): TestBlockInfo | undefined {
    const blocks: string[] = [];
    let lastBlockNode: ts.Node | undefined;
    function find(node: ts.Node): void {
        if (lookupUntil >= node.getStart() && lookupUntil <= node.getEnd()) {
            if (isMatchingCallExpression(ts, node, testBlockIdentifiers) && node.arguments.length >= 1) {
                const arg = node.arguments[0];
                if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
                    lastBlockNode = node;
                    blocks.push(arg.text);
                    ts.forEachChild(node, find);
                } else if ((ts.isIdentifier(arg) || ts.isPropertyAccessExpression(arg)) && program) {
                    const typeChecker = program.getTypeChecker();
                    const type = typeChecker.getTypeAtLocation(arg);
                    if (type && (type.getFlags() & ts.TypeFlags.StringLiteral)) {
                        lastBlockNode = node;
                        blocks.push((type as ts.StringLiteralType).value);
                        ts.forEachChild(node, find);
                    }
                } else if (ts.isTemplateExpression(arg) && program) {
                    // try to resolve template literal
                    let blockName = arg.head.text;
                    let allResolved = true;
                    const typeChecker = program.getTypeChecker();
                    // const type = typeChecker.getTypeAtLocation(arg);
                    for (const span of arg.templateSpans) {
                        if (ts.isIdentifier(span.expression) || ts.isPropertyAccessExpression(span.expression)) {
                            const spanType = typeChecker.getTypeAtLocation(span.expression);
                            if (spanType && (spanType.getFlags() & (ts.TypeFlags.StringLiteral | ts.TypeFlags.NumberLiteral))) {
                                const literal = span.literal.text;
                                blockName += (spanType as ts.StringLiteralType | ts.NumberLiteralType).value + literal;
                            } else {
                                allResolved = false;
                                break;
                            }
                        } else {
                            allResolved = false;
                            break;
                        }
                    }
                    if (allResolved) {
                        lastBlockNode = node;
                        blocks.push(blockName);
                        ts.forEachChild(node, find);
                    }
                }
            } else {
                ts.forEachChild(node, find);
            }
        }
    }
    find(sourceFile);
    if (!lastBlockNode) {
        return undefined;
    }
    return {
        blockNames: blocks,
        lastNode: lastBlockNode
    };
}

/**
 * Calculate count of given identifiers in the bloc
 *
 * @export
 * @param ts
 * @param block
 * @param lookupUntil
 * @returns
 */
export function getCountOfIdentifiersInBlock(
    ts: typeof ts_module,
    block: ts_module.Node,
    identifiers: string[],
    lookupUntil: number
): { anonymousCalls: number; namedCalls: { [key: string]: number } } {
    let anonymousCalls = 0;
    const namedCalls: { [key: string]: number } = { };
    function visit(node: ts.Node): void {
        if (ts.isIdentifier(node) && identifiers.indexOf(node.text) !== -1 && lookupUntil >= node.getStart()) {
            if (node.parent && node.parent.parent && ts.isCallExpression(node.parent.parent)) {
                const customName = node.parent.parent.arguments[0];
                if (customName && ts.isStringLiteralLike(customName)) {
                    const snapshotName = customName.text;
                    namedCalls[snapshotName] = namedCalls[snapshotName] ? namedCalls[snapshotName] + 1 : 1;
                } else {
                    anonymousCalls++;
                }
            }
        }
        ts.forEachChild(node, visit);
    }
    ts.forEachChild(block, visit);
    return {
        anonymousCalls,
        namedCalls,
    };
}

export interface SnapshotDefinition {
    file: string;
    /**
     * Snapshot export name
     */
    name: string;
    /**
     * Snapshot source
     */
    snapshot: string;
    /**
     * Snapshot position
     */
    position: number;
    /**
     * Length of snapshot export
     */
    length: number;
}

/**
 * Parse snapshot-like file and return snapshot definitions
 *
 * @export
 * @param ts
 * @param path
 * @param source
 * @returns
 */
export function parseSnapshotFile(ts: typeof ts_module, path: string, source: string): SnapshotDefinition[] {
    try {
        const file = ts.createSourceFile("temp.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        const blocks: SnapshotDefinition[] = [];

        const visit = (node: ts.Node) => {
            if (ts.isBinaryExpression(node) &&
                ts.isElementAccessExpression(node.left) &&
                node.left.argumentExpression &&
                (ts.isStringLiteral(node.left.argumentExpression) || ts.isNoSubstitutionTemplateLiteral(node.left.argumentExpression)) &&
                (ts.isStringLiteral(node.right) || ts.isNoSubstitutionTemplateLiteral(node.right))
            ) {
                blocks.push({
                    file: path,
                    name: node.left.argumentExpression.text,
                    snapshot: node.right.text,
                    position: node.getStart(),
                    length: node.getText().length
                });
            } else {
                ts.forEachChild(node, visit);
            }
        }
        ts.forEachChild(file, visit);
        return blocks;
    } catch {
        return [];
    }
}