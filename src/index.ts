import * as ts_module from "typescript/lib/tsserverlibrary";
import { defaultConfig, Configuration } from "./config";
import { SnapshotResolver } from "./snapshotcache";
import { tryGetSnapshotForPosition } from "./getsnapshot";
import { formatSnapshot } from "./utils";


function init(modules: { typescript: typeof ts_module }) {
    const ts = modules.typescript;
    const config: Configuration = defaultConfig;
    const snapshotCache = new SnapshotResolver(ts);
    snapshotCache.extensions = defaultConfig.snapshotFileExtensions;
    snapshotCache.dir = defaultConfig.snapshotDir;


    /**
     * Create TS plugin
     */
    function create(info: ts.server.PluginCreateInfo) {
        const proxy = Object.create(null) as ts.LanguageService;
        const oldLS = info.languageService;
        if (info.config.snapshotCallIdentifiers) {
            config.snapshotCallIdentifiers = info.config.snapshotCallIdentifiers;
        }
        if (info.config.testBlockIdentifiers) {
            config.testBlockIdentifiers = info.config.testBlockIdentifiers;
        }
        if (info.config.snapshotFileExtensions) {
            snapshotCache.extensions = info.config.snapshotFileExtensions;
        }
        if (info.config.snapshotDir) {
            snapshotCache.dir = info.config.snapshotDir;
        }
        if (typeof info.config.useJSTagsForSnapshotHover !== "undefined") {
            config.useJSTagsForSnapshotHover = info.config.useJSTagsForSnapshotHover;
        }
        if (typeof info.config.extractCSSForJSTag !== "undefined") {
            config.extractCSSForJSTag = info.config.extractCSSForJSTag;
        }
        if (typeof info.config.snapshotFileFlavor !== "undefined") {
            config.snapshotFileFlavor = info.config.snapshotFileFlavor
        }

        for (const k in oldLS) {
            (proxy as any)[k] = function () {
                return oldLS[k as keyof ts.LanguageService]!.apply(oldLS, arguments);
            }
        }

        /**
         * Hover
         */
        proxy.getQuickInfoAtPosition = (fileName, position) => {
            const originalQuickInfo = oldLS.getQuickInfoAtPosition(fileName, position);
            const program = info.project.getLanguageService().getProgram();
            // const program = oldLS.getProgram();
            if (!program) {
                return originalQuickInfo;
            }
            const sourceFile = program.getSourceFile(fileName);
            const snapshotDef = tryGetSnapshotForPosition(ts, sourceFile, position, snapshotCache, config, program);
            if (snapshotDef) {
                return {
                    kind: ts.ScriptElementKind.string,
                    kindModifiers: "",
                    documentation: originalQuickInfo ? originalQuickInfo.documentation : undefined,
                    tags: config.useJSTagsForSnapshotHover
                        // looks like the hover widget is screwed up when using both css + jsx
                        ? formatSnapshot(snapshotDef.snapshot.trim(), /*config.extractCSSForJSTag*/ false).map(def => ({
                            name: def.type === "css" ? "CSS" : snapshotDef.name,
                            text: def.type === "css" ? "```css\n" : "```jsx\n" + def.text + "```\n",
                        }))
                        : undefined,
                    textSpan: originalQuickInfo ? {
                        start: originalQuickInfo.textSpan.start,
                        length: originalQuickInfo.textSpan.length,
                    } : {
                        start: snapshotDef.position,
                        length: snapshotDef.length,
                    },
                    displayParts: config.useJSTagsForSnapshotHover ? [] : [
                        {
                            kind: ts.ScriptElementKind.string,
                            text: snapshotDef.snapshot.trim(),
                        }
                    ],
                };
            }
            return originalQuickInfo;
        }

        /**
         * Go to definition
         */
        proxy.getDefinitionAtPosition = (fileName, position) => {
            let prior = oldLS.getDefinitionAtPosition(fileName, position);
            const program = info.project.getLanguageService().getProgram();
            if (!program) {
                return prior;
            }
            const sourceFile = program.getSourceFile(fileName);
            const snapshotDef = tryGetSnapshotForPosition(ts, sourceFile, position, snapshotCache, config, program);
            if (snapshotDef) {
                // LS can return undefined. Also need to preserve undefined in case if snapshot is not available
                if (!prior) {
                    prior = [];
                }
                prior.unshift({
                    fileName: snapshotDef.file,
                    name: snapshotDef.name,
                    containerName: "Snapshots",
                    containerKind: ts.ScriptElementKind.variableElement,
                    textSpan: {
                        start: snapshotDef.position,
                        length: snapshotDef.length
                    },
                    kind: ts.ScriptElementKind.variableElement
                });
            }

            return prior;
        }

        proxy.getDefinitionAndBoundSpan = (fileName, position) => {
            let prior = oldLS.getDefinitionAndBoundSpan(fileName, position);
            const program = info.project.getLanguageService().getProgram();
            if (!program) {
                return prior;
            }
            const sourceFile = program.getSourceFile(fileName);
            const snapshotDef = tryGetSnapshotForPosition(ts, sourceFile, position, snapshotCache, config, program);
            if (snapshotDef) {
                if (!prior) {
                    prior = {
                        definitions: [],
                        textSpan: {
                            start: snapshotDef.position,
                            length: snapshotDef.length,
                        }
                    }
                }
                prior.definitions = [
                    {
                        fileName: snapshotDef.file,
                        name: snapshotDef.name,
                        containerKind: ts.ScriptElementKind.moduleElement,
                        containerName: "Snapshots",
                        kind: ts.ScriptElementKind.variableElement,
                        textSpan: {
                            start: snapshotDef.position,
                            length: snapshotDef.length,
                        },
                    },
                    ...(prior.definitions ? prior.definitions : []),
                ]
            }
            return prior;
        }


        return proxy;
    }

    function getExternalFiles(project: ts_module.server.Project): string[] {
        // Return snapshot file for each opened file, seems enough for our needs
        let openFiles: ts_module.server.NormalizedPath[] = [];
        if (typeof (project.projectService.openFiles as any).map === "function") {
            // TS 2.6, openFiles is array of ScriptInfo
            openFiles.push(...(project.projectService.openFiles as any as ts_module.server.ScriptInfo[]).map(f => f.fileName));
        } else if (typeof project.projectService.openFiles.keys === "function") {
            // TS 2.7, openFiles is Map of normalized paths (key is the full path, value is the project root path)
            openFiles.push(...project.projectService.openFiles.keys() as any);
        }
        openFiles = openFiles.filter(f => !snapshotCache.extensions.find(ext => f.endsWith(ext))).filter(f => project.containsFile(f));
        const externalFiles = openFiles.map(file => snapshotCache.getAllPossiblePathsForFile(file))
            .reduce((all, paths) => all.concat(paths), [])
            .filter(f => project.projectService.host.fileExists(f));
        return externalFiles;
    }

    return { create, getExternalFiles };
}
export = init;