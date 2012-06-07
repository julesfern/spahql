exports["SpahQL.QueryParser"] = {
  
  "Throws a parse error on empty or nonsense queries": function(test) {
    test.expect(2);
    try { SpahQL.QueryParser.parseQuery(""); }
    catch(e) { test.ok(e.message.indexOf("Failed") >= 0); }

    try { SpahQL.QueryParser.parseQuery("gibberish"); }
    catch(e) { 
      test.ok(e.message.indexOf("Failed") >= 0);
      test.done();
    }
  },

  "Returns the correct structure when parsing full queries": function(test) {
    var q = SpahQL.QueryParser.parseQuery("/foo//bar/.property/baz[$//bar] == {1,'2', /foo, true}");
    test.deepEqual(
      q.primaryToken,
      new SpahQL.Token.SelectionQuery([
        new SpahQL.Token.PathComponent(new SpahQL.Token.KeyName("foo")),
        new SpahQL.Token.PathComponent(new SpahQL.Token.KeyName("bar"), null, true),
        new SpahQL.Token.PathComponent(null, new SpahQL.Token.KeyName("property")),
        new SpahQL.Token.PathComponent(new SpahQL.Token.KeyName("baz"), null, false, [
          new SpahQL.Token.FilterQuery(SpahQL.QueryParser.parseQuery("$//bar"))
        ])
      ])
    );
    
    test.deepEqual(
      q.comparisonOperator,
      new SpahQL.Token.ComparisonOperator("==")
    );
    
    test.deepEqual(
      q.secondaryToken,
      new SpahQL.Token.Set([
        new SpahQL.Token.Numeric(1),
        new SpahQL.Token.String("2"),
        new SpahQL.Token.SelectionQuery([
          new SpahQL.Token.PathComponent(new SpahQL.Token.KeyName("foo"))
        ]),
        new SpahQL.Token.Boolean(true)
      ])
    );
    test.done();
  },

  "Cleans a query with spaces but doesn't clean spaces from string literals": function(test) {
    var qp = SpahQL.QueryParser;
    test.equal(qp.cleanQuery("//foo == 'bar'"), "//foo=='bar'");
    test.equal(qp.cleanQuery("//foo == 'bar baz\" '"), "//foo=='bar baz\" '");
    test.done();
  },
  
  "Parses a flat root query": function(test) {
    var q = SpahQL.QueryParser.parseQuery("/");
    test.deepEqual(q.primaryToken, new SpahQL.Token.SelectionQuery([new SpahQL.Token.PathComponent()]));
    test.done();
  }
  
};