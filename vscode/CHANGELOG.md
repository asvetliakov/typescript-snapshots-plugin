### [0.3.0]
- Support concatenating test block names, e.g. it("a" + "b")
- Support snapshot files with different basefile extension, e.g: ```a.spec.ts -> ./__snapshots__/a.spec.js.snap```

### [0.2.2]
- Return only snapshot when hovering

### [0.2.0]
- Update typescript-snapshots-plugin to 1.5.0 version
- Resolve constans in test block names, e.g. ```const A = "dynamic"; it(`Some test ${A}`, () => {});```. Supported constructs: ```it(Constant, () => {})```, ```it(`Template with constant ${Constant}`, () => {})```, ```it(`Propery access - ${Obj.Constant}`, () => {}) ```

### [0.1.2]
- Add snapshot syntax file back

### [0.1.1]
- Fix Go to definition for snapshot

### [0.1.0]
- Replace with typescript-snapshots-plugin