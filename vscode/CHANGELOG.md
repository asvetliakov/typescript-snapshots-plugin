### [0.1.3]
- Update typescript-snapshots-plugin to 1.5.0 version
- Resolve constans in test block names, e.g. ```const A = "dynamic"; it(`Some test ${A}`, () => {});```. Supported constructs: ```it(Constant, () => {})```, ```it(`Template with constant ${Constant}`, () => {})```, ```it(`Propery access - ${Obj.Constant}`, () => {}) ```

### [0.1.2]
- Add snapshot syntax file back

### [0.1.1]
- Fix Go to definition for snapshot

### [0.1.0]
- Replace with typescript-snapshots-plugin