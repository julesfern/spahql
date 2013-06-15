exports["SpahQL.Token.PathComponent"] = {
  
  "Returns a correct new index and found number when reading ahead for path components": function(test) {
    test.deepEqual(
              SpahQL.Token.PathComponent.parseAt(0, "/key1"), 
              [5, new SpahQL.Token.PathComponent(new SpahQL.Token.KeyName("key1"))]
            );
    test.deepEqual(
              SpahQL.Token.PathComponent.parseAt(5, "/key1//key2"),
              [11, new SpahQL.Token.PathComponent(new SpahQL.Token.KeyName("key2"), null, true)]
            );
    test.deepEqual(
              SpahQL.Token.PathComponent.parseAt(5, "/key1//.size"),
              [12, new SpahQL.Token.PathComponent(null, new SpahQL.Token.KeyName("size"), true)]
            );
    test.deepEqual(
              SpahQL.Token.PathComponent.parseAt(5, "/key1//foo[/a == /b][/foo == 3]"),
              [31, new SpahQL.Token.PathComponent(new SpahQL.Token.KeyName("foo"), null, true, [
                new SpahQL.Token.FilterQuery(SpahQL.QueryParser.parseQuery("/a == /b")),
                new SpahQL.Token.FilterQuery(SpahQL.QueryParser.parseQuery("/foo == 3"))
              ])]
            );
    
    test.equal(null, SpahQL.Token.PathComponent.parseAt(5, "/key1==3"));
    test.done();
  },

  "Evaluates at the root scope without a key": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "/")[1];
    var data = {a: {aa: "aaval"}};

    test.expect(1);
    test.deepEqual(token.evaluate(data, data, "/"),
      [{path: "/", value: data, sourceData: data}]
    );
    test.done();
  },

  "Evaluates at a given scope without a key": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "/")[1];
    var data = {a: {aa: "aaval"}};

    test.deepEqual(token.evaluate(data, data.a, "/a"),
      [{path: "/a", value: data.a, sourceData: data}]
    );
    test.done();
  },

  "Evaluates with a named key": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "/a")[1];
    var data = {a: {aa: "aaval"}};

    test.deepEqual(token.evaluate(data, data, "/"),
      [{path: "/a", value: data.a, sourceData: data}]
    );
    test.done();
  },

  "Evaluates with a non-existent named key": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "/a")[1];
    var data = {b: {aa: "aaval"}};

    test.deepEqual(token.evaluate(data, data, "/"),
      []
    );
    test.done();
  },

  "Evaluates with an array key": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "/1")[1];
    var data = {arr: ["a", "b", "c"]};

    test.deepEqual(token.evaluate(data, data.arr, "/arr"),
      [{path: "/arr/1", value: data.arr[1], sourceData: data}]
    );
    test.done();
  },

  "Evaluates with a non-existent array key": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "/10")[1];
    var data = {arr: ["a", "b", "c"]};

    test.deepEqual(token.evaluate(data, data.arr, "/arr"),
      []
    );
    test.done();
  },

  "Evaluates with an zero value": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "/zero")[1];
    var data = {hsh: {zero: 0, one: 1}};

    test.deepEqual(token.evaluate(data, data.hsh, "/hsh"),
      [{path: "/hsh/zero", value: 0, sourceData: data}]
    );
    test.done();
  },

  "Evaluates with a named key and the recursive flag": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "//a")[1];
    var data = {a: {a: "aa"}};

    test.deepEqual(token.evaluate(data, data, "/"),
      [
        {path: "/a", value: data.a, sourceData: data}, 
        {path: "/a/a", value: data.a.a, sourceData: data}
      ]
    );
    test.done();
  },

  "Evaluates the type property": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "/.type")[1];
    var data = {a: {a: "aa"}};

    test.deepEqual(token.evaluate(data, data.a, "/a"),
      [
        {path: "/a/.type", value: "object", sourceData: data}
      ]
    );
    test.done();
  },

  "Evaluates the size property": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "/.size")[1];
    var data = {a: {a: "aa"}};

    test.deepEqual(token.evaluate(data, data.a, "/a"),
      [
        {path: "/a/.size", value: 1, sourceData: data}
      ]
    );
    test.done();
  },

  "Evaluates with a named property and the recursive flag": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "//.size")[1];
    var data = {a: {a: "aa"}};

    test.deepEqual(token.evaluate(data, data, "/"),
      [
        {path: "/.size", value: 1, sourceData: data},
        {path: "/a/.size", value: 1, sourceData: data},
        {path: "/a/a/.size", value: 2, sourceData: data}
      ]
    );
    test.done();
  },

  "Evaluates with a single filter query": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "//a[/a/.type == 'string']")[1];
    var data = {a: {a: "aa"}};

    test.deepEqual(token.evaluate(data, data, "/"),
      [
        {path: "/a", value: data.a, sourceData: data}
      ]
    );
    test.done();
  },

  "Evaluates with a single filter query using the root scope": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "//a[/.type == $/useType]")[1];
    var data = {a: {a: "aa"}, useType: "object", b: {a: {ab: "ab"}}, c: {a: 1}};

    test.deepEqual(token.evaluate(data, data, "/"),
      [
        {path: "/a", value: data.a, sourceData: data},
        {path: "/b/a", value: data.b.a, sourceData: data}
      ]
    );
    test.done();
  },

  "Evaluates with a chain of filter queries": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "//a[/.type == $/useType][/ab]")[1];
    var data = {a: {a: "aa"}, useType: "object", b: {a: {ab: "ab"}}, c: {a: 1}};

    test.deepEqual(token.evaluate(data, data, "/"),
      [
        {path: "/b/a", value: data.b.a, sourceData: data}
      ]
    );
    test.done();
  },

  "Evaluates the .path property at the root": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "/.path")[1];
    var data = {a: {a: "aa"}, useType: "object", b: {a: {ab: "ab"}}, c: {a: 1}};

    test.deepEqual(token.evaluate(data, data, "/"),
      [
        {path: "/.path", value: "/", sourceData: data}
      ]
    );
    test.done();
  },

  "Evaluates the .path property at a specified key": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "/.path")[1];
    var data = {a: {a: "aa"}, useType: "object", b: {a: {ab: "ab"}}, c: {a: 1}};

    test.deepEqual(token.evaluate(data, data.a.a, "/a/a"),
      [
        {path: "/a/a/.path", value: "/a/a", sourceData: data}
      ]
    );
    test.done();
  },

  "Evaluates the .path property as a sub-property of another property": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "/.path")[1];
    var data = {a: {a: "aa"}, useType: "object", b: {a: {ab: "ab"}}, c: {a: 1}};

    test.deepEqual(token.evaluate(data, data.a.a.length, "/a/a/.size"),
      [
        {path: "/a/a/.size/.path", value: "/a/a/.size", sourceData: data}
      ]
    );
    test.done();
  },

  "Evaluates the .key property at the root": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "/.key")[1];
    var data = {a: {a: "aa"}, useType: "object", b: {a: {ab: "ab"}}, c: {a: 1}};

    test.deepEqual(token.evaluate(data, data, "/"),
      [
        {path: "/.key", value: "", sourceData: data}
      ]
    );
    test.done();
  },

  "Evaluates the .key property a the specified key": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "/.key")[1];
    var data = {a: {a: "aa"}, useType: "object", b: {a: {ab: "ab"}}, c: {a: 1}};

    test.deepEqual(token.evaluate(data, data.a, "/a"),
      [
        {path: "/a/.key", value: "a", sourceData: data}
      ]
    );
    test.done();
  },

  "Evaluates the .key property as a sub-property of another property": function(test) {
    var token = SpahQL.Token.PathComponent.parseAt(0, "/.key")[1];
    var data = {a: {a: "aa"}, useType: "object", b: {a: {ab: "ab"}}, c: {a: 1}};

    test.deepEqual(token.evaluate(data, data.a.a.length, "/a/a/.size"),
      [
        {path: "/a/a/.size/.key", value: ".size", sourceData: data}
      ]
    );
    test.done();
  },
  
};