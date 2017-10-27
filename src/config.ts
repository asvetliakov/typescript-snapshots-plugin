export interface Configuration {
    /**
     * Snapshot call identifiers, i.e. toMatchSnapshot, etc..
     */
    snapshotCallIdentifies: string[];

    /**
     * Test block identifiers, i.e. it/describe/context/etc...
     */
    testBlockIdentifiers: string[];
}

export const defaultConfig: Configuration = {
    snapshotCallIdentifies: [
        "toMatchSnapshot",
        "toThrowErrorMatchingSnapshot"
    ],
    testBlockIdentifiers: [
        "it",
        "it.only",
        "it.skip",
        "it.concurrent",
        "describe",
        "describe.only",
        "describe.skip",
        "context",
        "suite"
    ]
}