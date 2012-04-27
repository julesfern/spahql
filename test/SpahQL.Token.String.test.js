exports["SpahQL.Token.String"] = {
  
  "Returns a correct new index and found string when reading ahead for string literals": function(test) {
    test.expect(12);
    
    test.deepEqual([5, new SpahQL.Token.String("foo")], SpahQL.Token.String.parseAt(0, '"foo", bar'));
    test.deepEqual([5, new SpahQL.Token.String("foo")], SpahQL.Token.String.parseAt(0, '"foo"'));
    test.deepEqual([11, new SpahQL.Token.String("foobar")], SpahQL.Token.String.parseAt(3, '---"foobar"---'));
    test.deepEqual([11, new SpahQL.Token.String("foobar")], SpahQL.Token.String.parseAt(3, '---"foobar"---'));
    test.deepEqual([13, new SpahQL.Token.String('foo\"bar')], SpahQL.Token.String.parseAt(3, '---"foo\\"bar"'));
    test.deepEqual([5, new SpahQL.Token.String("foo")], SpahQL.Token.String.parseAt(0, "'foo', bar"));
    test.deepEqual([5, new SpahQL.Token.String("foo")], SpahQL.Token.String.parseAt(0, "'foo'"));
    test.deepEqual([11, new SpahQL.Token.String("foobar")], SpahQL.Token.String.parseAt(3, "---'foobar'---"));
    test.deepEqual([11, new SpahQL.Token.String("foobar")], SpahQL.Token.String.parseAt(3, "---'foobar'---"));
    test.deepEqual([13, new SpahQL.Token.String("foo'bar")], SpahQL.Token.String.parseAt(3, "---'foo\\'bar'"));
    
    // No quotes
    test.equal(null, SpahQL.Token.String.parseAt(0, "foo, bar"));
    
    // Errors
    try { SpahQL.Token.String.parseAt(3, "---'foobar---") }
    catch(e) { test.ok(e) }
    
    test.done();    
  }
  
};