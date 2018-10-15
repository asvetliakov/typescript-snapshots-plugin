# Typescript snapshots plugin
Language service support for viewing/navigating to your test snapshots

## Features

### Snapshot content on quick info (hover):
![quickinfo](/images/quickinfo.gif)

### Navigating to snapshot (Go to definition):
![navigation](/images/navigating.gif)

### Dynamically constructed test names (Constants only)
![dynamic](/images/dynamic.png)

## Configuration
You can configure various plugin settings in ```tsconfig.json/jsconfig.json``` file:
```json
{
    "compilerOptions": {
        "plugins": [
            {
                "name": "typescript-snapshots-plugin",
                "snapshotDir": "__snapshots__",
                "snapshotCallIdentifiers": [
                    "toMatchSnapshot",
                    "myMatchSnapshot"
                ]
            }
        ],
    }
}
```
Look [here](https://github.com/asvetliakov/typescript-snapshots-plugin#configuration) for available configuration options


## Snapshot syntax
Snapshot syntax file was copied from [vscode-jest](https://github.com/jest-community/vscode-jest) extension. Syntax issues/suggestions must be filled against vscode-jest repo.

## Notes
If you're using a workspace version of Typescript, you must configure the TS server plugin manually by following [these instructions](https://github.com/asvetliakov/typescript-snapshots-plugin#installation)