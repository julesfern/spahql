exports["SpahQL.Token.KeyName"] = {
  
  "Returns a correct new index and found set when reading ahead for key names": function(test) {
    test.deepEqual(SpahQL.Token.KeyName.parseAt(0, "foo==3"), [3, new SpahQL.Token.KeyName("foo")]);
    test.deepEqual(SpahQL.Token.KeyName.parseAt(1, "_foo-bar==3"), [8, new SpahQL.Token.KeyName("foo-bar")]);
    test.deepEqual(SpahQL.Token.KeyName.parseAt(1, "_foo-bar97==3"), [10, new SpahQL.Token.KeyName("foo-bar97")]);
    test.equal(null, SpahQL.Token.KeyName.parseAt(10, "_foo-bar97==3"));
    test.done();
  }
  
};