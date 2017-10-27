# Typescript snapshots plugin
Language service support for viewing/navigating to your test snapshots

## Features

### Snapshot content on quick info (hover):
![quickinfo](/images/quickinfo.gif)

### Navigating to snapshot (Go to definition):
![navigation](/images/navigating.gif)

### Installation

```npm install typescript-snapshots-plugin --save-dev```

Add to your tsconfig.json:
```json
    "plugins": [{
        "name": "typescript-snapshots-plugin",
    }]
```

### Configuration
In most cases you must be OK with default configuration. If this doesn't work for you, plugin exposes two options:

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

To pass your values, add them in tsconfig.json:
```json
    "plugins": [{
        "name: "typescript-snapshots-plugin",
        "snapshotCallIdentifiers": [
            "toMatchSnapshot",
            "myMatchSnapshot"
        ],
        "testBlockIdentifiers": [
            ...
        ]
    }]
```