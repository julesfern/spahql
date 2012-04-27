exports["SpahQL.Token.Numeric"] = {
  
  "Returns a correct new index and found number when reading ahead for numeric literals": function(test) {
    // Ints
    test.deepEqual([1,new SpahQL.Token.Numeric(7)], SpahQL.Token.Numeric.parseAt(0, '7, bar'));
    test.deepEqual([1,new SpahQL.Token.Numeric(7)], SpahQL.Token.Numeric.parseAt(0, '7'));
    test.deepEqual([8,new SpahQL.Token.Numeric(-7)], SpahQL.Token.Numeric.parseAt(6, 'foo,  -7, foo'));
      
    // Floats
    test.deepEqual([4,new SpahQL.Token.Numeric(3.21)], SpahQL.Token.Numeric.parseAt(0, '3.21, bar'));
    test.deepEqual([3,new SpahQL.Token.Numeric(1.5)], SpahQL.Token.Numeric.parseAt(0, '1.5'));
    test.deepEqual([10,new SpahQL.Token.Numeric(-7.5)], SpahQL.Token.Numeric.parseAt(6, 'foo,  -7.5, foo'));
    
    // Not found
    test.equal(null, SpahQL.Token.Numeric.parseAt(0, 'true'))
    test.done();
  }
  
};