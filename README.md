# Typescript snapshots plugin
Language service support for viewing/navigating to your test snapshots

## Features

### Snapshot content on quick info (hover):
![quickinfo](/images/quickinfo.gif)

### Navigation to snapshot (Go to definition):
![navigation](/images/navigating.gif)

### Dynamically constructed test names (Constants only)
![dynamic](/images/dynamic.png)

### Installation

```npm install typescript-snapshots-plugin --save-dev```

```yarn add typescript-snapshots-plugin --dev```

Add to your tsconfig.json:
```json
    "plugins": [{
        "name": "typescript-snapshots-plugin",
    }]
```

**If you are using VScode, tell it to use your local project TS version instead the VSCode bundled one**

### Configuration
In most cases you must be OK with default configuration. If it doesn't work for you, the plugin exposes few options:

**snapshotCallIdentifiers**
List of snapshot matching call identifiers, such as ```toMatchSnapshot()```, default:
```json
[
    "toMatchSnapshot",
    "toThrowErrorMatchingSnapshot"
]
```

**testBlockIdentifiers**
List of test call identifiers, such as ```it()```, or ```describe()```, default:
```json
    "it",
    "it.only",
    "it.skip",
    "it.concurrent",
    "describe",
    "describe.only",
    "describe.skip",
    "context",
    "suite"
```

**snapshotFileExtensions**
List of snapshot names extensions. These will be used to search the snapshot file for test path. First existing path wins, default:
```json
[ ".snap" ]

```

**snapshotDir**
Snapshot directory relative to the test file, default:
```json
"__snapshots__"
```

**useJSTagsForSnapshotHover**
Setting to true will render snapshot within fake jsdoc definition block. Since VSCode hover jsdoc supports markdown \`\`\`syntax\`\`\` the snapshot in hover widget will have slightly better syntax coloring. If you're using VSCode you may want to enable this, otherwise leave as false. Default:
```false```

To pass your values, add them in tsconfig.json:
```json
    "plugins": [{
        "name": "typescript-snapshots-plugin",
        "snapshotCallIdentifiers": [
            "toMatchSnapshot",
            "myMatchSnapshot"
        ],
        "testBlockIdentifiers": [
            ...
        ]
    }]
```

**snapshotFileFlavor**
Snapshot file flavor, default:
```json
"jest"
```

You can set it to `vitest` to support [vitest snapshots](https://vitest.dev/guide/snapshot.html).
