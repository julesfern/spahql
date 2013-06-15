exports["SpahQL.Token.SelectionQuery"] = {
  
  "Returns a correct new index and found number when reading ahead for selection queries": function(test) {
    test.deepEqual(
      SpahQL.Token.SelectionQuery.parseAt(0, "/key1//key2[$/foo=='bar']/.explode[//foo == 2][//bar == 3]"), 
      [58, new SpahQL.Token.SelectionQuery(
        [
          new SpahQL.Token.PathComponent(new SpahQL.Token.KeyName("key1")),
          new SpahQL.Token.PathComponent(new SpahQL.Token.KeyName("key2"), null, true, [
            new SpahQL.Token.FilterQuery(SpahQL.QueryParser.parseQuery("$/foo=='bar'"))
          ]),
          new SpahQL.Token.PathComponent(null, new SpahQL.Token.KeyName("explode"), false, [
            new SpahQL.Token.FilterQuery(SpahQL.QueryParser.parseQuery("//foo == 2")),
            new SpahQL.Token.FilterQuery(SpahQL.QueryParser.parseQuery("//bar == 3"))
          ]),
        ]
      )]);
      
    test.equal(null, SpahQL.Token.SelectionQuery.parseAt(0, "0000"));
    test.done();
  },

  "Correctly returns a zero value": function(test) {
    var token = SpahQL.Token.SelectionQuery.parseAt(0, "/hsh/zero")[1];
    var data = {hsh: {zero: 0, one: 1}};

    test.deepEqual(token.evaluate(data, data, "/"),
      [{path: "/hsh/zero", value: 0, sourceData: data}]
    );
    test.done();
  }
  
};