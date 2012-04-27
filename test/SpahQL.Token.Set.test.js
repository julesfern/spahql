exports["SpahQL.Token.Set"] = {
  
  "Returns a correct new index and found set when reading ahead for set literals": function(test) {
    test.expect(6);
    
    test.deepEqual(
      SpahQL.Token.Set.parseAt(0, "{1,'2,',true}"), 
      [13, new SpahQL.Token.Set([
        new SpahQL.Token.Numeric(1),
        new SpahQL.Token.String("2,"),
        new SpahQL.Token.Boolean(true)
      ])]
    );
    test.deepEqual(
      SpahQL.Token.Set.parseAt(2, "--{1.5,false,true}--"), 
      [18, new SpahQL.Token.Set([
        new SpahQL.Token.Numeric(1.5),
        new SpahQL.Token.Boolean(false),
        new SpahQL.Token.Boolean(true)
      ])]
    );
    test.deepEqual(
      SpahQL.Token.Set.parseAt(2, "--{'a'..'d'}--"), 
      [12, new SpahQL.Token.Set([
        new SpahQL.Token.String("a"),
        new SpahQL.Token.String("d")
      ], true)]
    );
    
    test.deepEqual(
      SpahQL.Token.Set.parseAt(2, "--{1,2,/foo}--"), 
      [12, new SpahQL.Token.Set([
        new SpahQL.Token.Numeric(1),
        new SpahQL.Token.Numeric(2),
        new SpahQL.Token.SelectionQuery([
          new SpahQL.Token.PathComponent(new SpahQL.Token.KeyName("foo"))
        ])
      ])]
    );
    
    // Errors
    try { SpahQL.Token.Set.parseAt(0, "{'a'..'d',2}--") } catch(e) { test.ok(e, e.message) };
    try { SpahQL.Token.Set.parseAt(0, "{'b','a'..'d'}--") } catch(e) { test.ok(e, e.message) };
    
    test.done();
  },

  "Evaluates a numeric range": function(test) {
    var forwardToken = SpahQL.Token.Set.parseAt(0, "{1..3}")[1];
    var reverseToken = SpahQL.Token.Set.parseAt(0, "{3..1}")[1];

    test.deepEqual(forwardToken.evaluate(), [
      {path: null, value: 1, sourceData: 1}, {path: null, value: 2, sourceData: 2}, {path: null, value: 3, sourceData: 3}
    ]);
    test.deepEqual(reverseToken.evaluate(), [
      {path: null, value: 3, sourceData: 3}, {path: null, value: 2, sourceData: 2}, {path: null, value: 1, sourceData: 1}
    ]);

    test.done();
  },

  "Evaluates a string range": function(test) {
    var token = SpahQL.Token.Set.parseAt(0, "{'aa'..'ac'}")[1];

    test.deepEqual(token.evaluate(), [
      {path: null, value: "aa", sourceData: "aa"}, {path: null, value: "ab", sourceData: "ab"}, {path: null, value: "ac", sourceData: "ac"}
    ]);
    test.done();    
  },

  "Evalutes a set of literals": function(test) {
    var token = SpahQL.Token.Set.parseAt(0, "{1.5,2,'a',true,false}")[1];

    test.deepEqual(token.evaluate(), [
      {path: null, value: 1.5, sourceData: 1.5}, 
      {path: null, value: 2, sourceData: 2}, 
      {path: null, value: "a", sourceData: "a"},
      {path: null, value: true, sourceData: true},
      {path: null, value: false, sourceData: false}
    ]);
    test.done();    
  },

  "Evalutes a set of mixed literals and selection queries": function(test) {
    var token = SpahQL.Token.Set.parseAt(0, "{//a,1.5,2,'a',true,false}")[1];
    var data = {b: {a: {a: "aa"}}}

    test.deepEqual(token.evaluate(data, data.b, "/b"), [
      {path: "/b/a", value: data.b.a, sourceData: data}, 
      {path: "/b/a/a", value: data.b.a.a, sourceData: data},
      {path: null, value: 1.5, sourceData: 1.5}, 
      {path: null, value: 2, sourceData: 2}, 
      {path: null, value: "a", sourceData: "a"},
      {path: null, value: true, sourceData: true},
      {path: null, value: false, sourceData: false}
    ]);
    test.done();  
  }
  
}