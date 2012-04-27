exports["SpahQL.Token.Boolean"] = {
  
  "Returns a correct new index and found bool when reading ahead for boolean literals": function(test) {
    test.deepEqual([16,new SpahQL.Token.Boolean(true)], SpahQL.Token.Boolean.parseAt(12, '{3, "true", true}'));
    test.deepEqual([17,new SpahQL.Token.Boolean(false)], SpahQL.Token.Boolean.parseAt(12, '{3, "true", false}'));
    test.equal(null, SpahQL.Token.Boolean.parseAt(12, '{3, "true", "false"}'));
    test.done();
  }
  
}