exports["SpahQL.DataHelper"] = {
  
  "Correctly determines object types": function(test) {
    test.equal("string", SpahQL.DataHelper.objectType(""), "String type");
    test.equal("number", SpahQL.DataHelper.objectType(0), "Number type");
    test.equal("boolean", SpahQL.DataHelper.objectType(false), "Bool type");
    test.equal("object", SpahQL.DataHelper.objectType({}), "Hash type");
    test.equal("array", SpahQL.DataHelper.objectType([]), "Array type");
    test.equal("null", SpahQL.DataHelper.objectType(null), "Null type");
    test.done();
  },
  
  "Determines simple object equality": function(test) {
    test.ok(SpahQL.DataHelper.eq(0,0,0), "Compares integers eq")
    test.ok(!SpahQL.DataHelper.eq(1,0,0), "Fails integers diff")
    test.ok(!SpahQL.DataHelper.eq(0,0,false), "Fails integer crosstype")
    
    test.ok(SpahQL.DataHelper.eq("a","a","a"), "Compares strings eq")
    test.ok(!SpahQL.DataHelper.eq("a", "b"), "Fails strings diff")
    test.ok(!SpahQL.DataHelper.eq("a","a","a", 2), "Fails strings crosstype")
    
    test.ok(SpahQL.DataHelper.eq(true,true,true,true), "Compares bools eq")
    test.ok(!SpahQL.DataHelper.eq(false, undefined), "Fails bools diff")
    test.ok(!SpahQL.DataHelper.eq(false, null), "Fails bools diff")
    test.ok(!SpahQL.DataHelper.eq("true",true), "Fails bools crosstype")
    test.done();
  },
  
  "Determines array equality": function(test) {
    test.ok(SpahQL.DataHelper.eq([0,"1", false], [0,"1", false]), "Compares arrays eq")
    test.ok(!SpahQL.DataHelper.eq([0,"1", false], [0,"1"]), "Fails arrays diff lengths")
    test.ok(!SpahQL.DataHelper.eq([0,"1", false], [2,"1", false]), "Fails arrays diff")
    test.done();
  },
  
  "Determines hash equality": function(test) {
    test.ok(SpahQL.DataHelper.eq({foo: "bar", bar: "baz"}, {foo: "bar", bar: "baz"}), "Compares hashes eq")
    test.ok(!SpahQL.DataHelper.eq({foo: "bar", bar: "baz"}, {foo: "bar", bar: "different"}), "Fails hashes diff root content")
    test.ok(!SpahQL.DataHelper.eq({foo: "bar", bar: "baz"}, {foo: "bar", barDifferent: "baz"}), "Fails hashes diff root keys")
    test.ok(!SpahQL.DataHelper.eq({foo: "bar", arr: [0,1,2]}, {foo: "bar", arr: [1,2,3]}), "Fails hashes diff inner content")
    test.ok(!SpahQL.DataHelper.eq({foo: "bar", arr: [0,1,2]}, {foo: "bar", arr: null}), "Fails hashes diff inner content types")
    test.done();
  },

  "Deep-clones an array": function(test) {
    var arr = [
      1,
      "2",
      [0,1,2],
      {"foo": "bar"}
    ];
    var clone = SpahQL.DataHelper.deepClone(arr);
    test.ok(SpahQL.DataHelper.eq(arr, clone));

    // Try a set of modifications
    clone.push("added");
    clone[1] += "changed";
    clone[2].push("added");
    clone[3]["bar"] = "added";

    test.ok(!arr[4]);
    test.equal(arr[1], "2");
    test.ok(!arr[2][3]);
    test.ok(!arr[3]["bar"]);

    test.ok(!SpahQL.DataHelper.eq(arr, clone));
    test.done();
  },

  "Deep-clones a hash": function(test) {
    var obj = {
      "obj": {"foo": "bar"},
      "arr": [0,1,{"2": 2}],
      "str": "foo"
    };
    var clone = SpahQL.DataHelper.deepClone(obj);
    test.ok(SpahQL.DataHelper.eq(obj, clone));

    // Try a hash modification and an array modification
    clone["obj"]["bar"] = "baz";
    clone["arr"].push(3);
    clone["arr"][2]["foo"] = "bar";

    test.ok(!obj["obj"]["bar"]);
    test.ok(!obj["arr"][3]);
    test.ok(!obj["arr"][2]["foo"]);

    test.ok(!SpahQL.DataHelper.eq(obj, clone));
    test.done();
  },
  
  "Detects modifications successfully": function(test) {
    var d = SpahQL.DataHelper;
    // Basic modification
    test.deepEqual(d.compare({a: 1, b: 2}, {a: 1, b: 3}, "/"), {"/": ["~", {a: 1, b: 2}, {a: 1, b: 3}], "/b": ["~", 2, 3]});
    // Basic addition
    test.deepEqual(d.compare({a: 1}, {a: 1, b: 2}, "/"), {"/": ["~", {a: 1}, {a: 1, b: 2}], "/b": ["+", undefined, 2]});
    // Basic removal
    test.deepEqual(d.compare({a: 1, b: 2}, {a: 1}, "/"), {"/": ["~", {a: 1, b: 2}, {a: 1}], "/b": ["-", 2, undefined]});
    // Nested modification via addition
    test.deepEqual(d.compare({a: 1, b: 2}, {a: 1, b: {a: ["1","2"]}}, "/"), 
                        { "/": ["~", {a: 1, b: 2}, {a: 1, b: {a: ["1","2"]}}], 
                          "/b": ["~", 2, {a: ["1","2"]}],
                          "/b/a": ["+", undefined, ["1","2"]],
                          "/b/a/0": ["+", undefined, "1"],
                          "/b/a/1": ["+", undefined, "2"]
                        });
    // Nested modification via removal
    test.deepEqual(d.compare({a: 1, b: {a: ["1","2"]}}, {a: 1, b: 2}, "/"), 
                        { "/": ["~", {a: 1, b: {a: ["1","2"]}}, {a: 1, b: 2}], 
                          "/b": ["~", {a: ["1","2"]}, 2],
                          "/b/a": ["-", ["1","2"], undefined],
                          "/b/a/0": ["-", "1", undefined],
                          "/b/a/1": ["-", "2", undefined]
                        });
    test.done();
  }
  
};