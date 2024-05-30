export interface Configuration {
    /**
     * Snapshot call identifiers, i.e. toMatchSnapshot, etc..
     */
    snapshotCallIdentifiers: string[];

    /**
     * Test block identifiers, i.e. it/describe/context/etc...
     */
    testBlockIdentifiers: string[];

    /**
     * Snapshot file extensions
     */
    snapshotFileExtensions: string[];

    /**
     * Relative directory to snapshot
     */
    snapshotDir: string;
    /**
     * Instead returning snapshot content in displayParts[] of protocol,
     * return it in tags[] prefixed with markdown ```jsx ```. VSCode supports markdown
     * tags & highligting so hover will look slightly better
     */
    useJSTagsForSnapshotHover: boolean;
    /**
     * Try to extract and format css declarations from snapshots (e.g. from styled-components),
     * and put them into separate js tag for proper syntax highlighting. Applicable only when
     * useJSTagsForSnapshotHover is true. Default true.
     * Note: vscode doesn't render correctly both css + jsx in separate tags, so this option doesn't do anything now
     */
    extractCSSForJSTag: boolean;

    snapshotFileFlavor: 'jest' | 'vitest';
}

export const defaultConfig: Configuration = {
    snapshotCallIdentifiers: [
        "toMatchSnapshot",
        "toThrowErrorMatchingSnapshot"
    ],
    testBlockIdentifiers: [
        "test",
        "test.only",
        "test.skip",
        "it",
        "it.only",
        "it.skip",
        "it.concurrent",
        "describe",
        "describe.only",
        "describe.skip",
        "context",
        "suite"
    ],
    snapshotFileExtensions: [".snap"],
    snapshotDir: "__snapshots__",
    useJSTagsForSnapshotHover: false,
    extractCSSForJSTag: true,
    snapshotFileFlavor: 'jest',
}
