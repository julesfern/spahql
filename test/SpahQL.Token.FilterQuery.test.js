exports["SpahQL.Token.FilterQuery"] = {
  
  "Returns a correct new index and found number when reading ahead for filter queries": function(test) {
    test.deepEqual([18, new SpahQL.Token.FilterQuery(SpahQL.QueryParser.parseQuery("/moo == ']'"))], SpahQL.Token.FilterQuery.parseAt(5, "/key1[/moo == ']']"));
    test.equal(null, SpahQL.Token.FilterQuery.parseAt(5, "/key1/moo == ']'"));
    test.done();
  }
  
};