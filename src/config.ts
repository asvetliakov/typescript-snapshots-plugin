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
}
