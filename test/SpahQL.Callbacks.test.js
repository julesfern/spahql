exports["SpahQL.Callbacks"] = {
  
  "Registers the callbacks": function(test) {
    SpahQL.Callbacks.reset();
    
    var data = {foo: "bar"};
    var callback = function() { return 0; };
    SpahQL.Callbacks.addCallbackForPathModifiedOnObject("/foo", data, callback);
    test.deepEqual(SpahQL.Callbacks.callbacks, {"/foo": [[data, callback]]});
    test.done();
  },
  
  "listen() supplies the observed result, listened path and the modified subpath": function(test) {
    var hsh = {a: {aa: "aaval"}, b: {aa: "bbval"}};
    var db = SpahQL.db({"hsh": hsh});

    db.listen("/hsh", function(result, path, subpaths) {
      test.equal(result.length, 1);
      test.equal(result.path(), path);
      test.equal(path, "/hsh");

      test.equal(result.value(), hsh);

      test.deepEqual(subpaths, ["/a/cc", "/a/bb", "/a"]);
      test.done();
    });

    db.select("/hsh/a").set({"bb": "bbval", "cc": "ccval"});
  },

  "Removes the callbacks": function(test) {
    SpahQL.Callbacks.reset();
    
    var data = {foo: "bar"};
    var callback1 = function() { return 0; };
    var callback2 = function() { return 1; };
    SpahQL.Callbacks.addCallbackForPathModifiedOnObject("/foo", data, callback1);
    SpahQL.Callbacks.addCallbackForPathModifiedOnObject("/foo", data, callback2);
    test.deepEqual(SpahQL.Callbacks.callbacks, {"/foo": [[data, callback1], [data, callback2]]});
    
    SpahQL.Callbacks.removeCallbackForPathModifiedOnObject("/foo", data, callback2);
    test.deepEqual(SpahQL.Callbacks.callbacks, {"/foo": [[data, callback1]]});
    test.done();
  },
  
  "Triggers the modification callbacks at the modified path and all higher paths.": function(test) {
    SpahQL.Callbacks.reset();
    
    var data = {foo: {bar: {baz: "val"}}};
    var callbackCounts = [0,0,0,0];
    var callback0 = function() { callbackCounts[0]++; };
    var callback1 = function() { callbackCounts[1]++; };
    var callback2 = function() { callbackCounts[2]++; };
    var callback3 = function() { callbackCounts[3]++; };
    
    var root = SpahQL.select("/", data).first();
    
    var foo = root.select("/foo").first();
    var bar = foo.select("/bar").first();
    var baz = bar.select("/baz").first();

    root.listen(callback0);
    foo.listen(callback1);
    bar.listen(callback2);
    baz.listen(callback3);
    
    // Try modifying each key descending
    root.set("newkey", "newvalue");
    test.deepEqual(callbackCounts, [1,0,0,0]);
    foo.set("newkey", "newvalue");
    test.deepEqual(callbackCounts, [2,1,0,0]);
    bar.set("newkey", "newvalue");
    test.deepEqual(callbackCounts, [3,2,1,0]);
    baz.replace("val-replaced");
    test.deepEqual(callbackCounts, [4,3,2,1]);
    test.done();
  },
  
  "Attaches the query result and path to the modification callback": function(test) {
    SpahQL.Callbacks.reset();
    
    var data = {foo: {bar: {baz: "val"}}};
    var root = SpahQL.db(data);
    var foo = root.select("/foo");
    
    test.expect(3);
    foo.listen(function(result, path, subpaths) {
      test.equal(path, foo.path());
      test.equal(result.path(), foo.path());
      test.deepEqual(result.value(), {bar: {baz: "val"}, newkey: "newvalue"});
    });
    foo.set("newkey", "newvalue");
    test.done();
  },
  
  "Triggers modification callbacks on non-existent paths when setting complex values": function(test) {
    SpahQL.Callbacks.reset();
    var data = {foo: {bar: {baz: "val"}}};
    var root = SpahQL.db(data);

    test.expect(3);
    root.listen("/foo/newarr", function(result, path) {
      test.equal(path, "/foo/newarr");
      test.equal(result.path(), path);
      test.deepEqual(result.value(), ["a","b","c"]);
    });
    root.select("/foo").set("newarr", ["a","b","c"]);
    test.done();
  }
    
};