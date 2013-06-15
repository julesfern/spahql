exports["SpahQL"] = {

	"registers a class with both browser-style and commonjs-style class names": function(test) {
    var klass = SpahQL_classCreate("SpahQL.Foo.Bar.Baz");
    test.equal(klass, SpahQL.foo.bar.baz);
    test.equal(klass, SpahQL.Foo.Bar.Baz);
    test.done();
  },

	"Initialises with an array of results as an enumerable": function(test) {
		var s = new SpahQL(["a", "b"]);

		test.expect(7);
		test.equal(s[0], "a");
		test.equal(s[1], "b");
		test.equal(s.length, 2);

		for(var i=0; i<s.length; i++) test.equal(
			s[i], ((i==0)? "a" : "b")
		)

		test.ok(s instanceof Array);
		test.ok(s instanceof SpahQL);

		test.done();
	},

	"Initialises ok with an empty set": function(test) {
		var empties = [[], null, undefined];
		for(var i in empties) {
			var s = new SpahQL(empties[i]);
			test.ok(s);
			test.equal(s.length, 0);
			test.equal(s[0], undefined);
		}

		s = new SpahQL();
		test.ok(s);
		test.equal(s.length, 0);
		test.equal(s[0], undefined);

		test.done();
	},

	"Initialises a SpahQL DB": function(test) {
		var data = {"foo": "bar"};
		var s = SpahQL.db(data);
	
		test.equal(s.length, 1);
		test.ok(s.item(0));
		test.equal(s.item(0).path(), "/")
		test.deepEqual(s.item(0).value(), data);
		test.deepEqual(s.sourceData(), data);
		test.done(); 
	},

	"first() returns a new SpahQL with only one item": function(test) {
		var d1 = {path: "/1", value: "bar1"},
				d2 = {path: "/2", value: "bar2"},
				d3 = {path: "/3", value: "bar3"};
		var s = new SpahQL(d1, d2, d3);

		test.equal(3, s.length);

		var f = s.first();

		test.equal(1, f.length);
		test.equal(f.path(), "/1");
		test.equal(f.value(), "bar1");
		test.done();
	},

	"last() returns a new SpahQL with only one item": function(test) {
		var d1 = {path: "/1", value: "bar1"},
				d2 = {path: "/2", value: "bar2"},
				d3 = {path: "/3", value: "bar3"};
		var s = new SpahQL(d1, d2, d3);

		test.equal(3, s.length);

		var f = s.last();

		test.equal(1, f.length);
		test.equal(f.path(), "/3");
		test.equal(f.value(), "bar3");
		test.done();
	},

	"path() returns the path for the first item in the set": function(test) {
		var d1 = {path: "/1", value: "bar1"},
				d2 = {path: "/2", value: "bar2"},
				d3 = {path: "/3", value: "bar3"};
		var s = new SpahQL(d1, d2, d3);
		test.equal(s.path(), "/1");
		test.done();
	},

	"path() returns null for an empty set": function(test) {
		var s = new SpahQL();
		test.equal(s.path(), null);
		test.done();
	},

	"paths() returns all paths in the set": function(test) {
		var d1 = {path: "/1", value: "bar1"},
				d2 = {path: "/2", value: "bar2"},
				d3 = {path: "/3", value: "bar3"};
		var s = new SpahQL(d1, d2, d3);
		test.deepEqual(s.paths(), ["/1", "/2", "/3"]);
		test.done();
	},

	"paths() returns an empty array for an empty set": function(test) {
		var s = new SpahQL();
		test.deepEqual(s.paths(), []);
		test.done();
	},

	"value() returns the value for the first item in the set": function(test) {
		var d1 = {path: "/1", value: "bar1"},
				d2 = {path: "/2", value: "bar2"},
				d3 = {path: "/3", value: "bar3"};
		var s = new SpahQL(d1, d2, d3);
		test.equal(s.value(), "bar1");
		test.done();
	},

	"value() returns null for an empty set": function(test) {
		var s = new SpahQL();
		test.equal(s.value(), null);
		test.done();
	},

	"values() returns an array of all values in the set": function(test) {
		var d1 = {path: "/1", value: "bar1"},
				d2 = {path: "/2", value: "bar2"},
				d3 = {path: "/3", value: "bar3"};
		var s = new SpahQL(d1, d2, d3);
		test.deepEqual(s.values(), ["bar1", "bar2", "bar3"]);
		test.done();
	},

	"values() returns an empty array for an empty set": function(test) {
		var s = new SpahQL();
		test.deepEqual(s.values(), []);
		test.done();
	},

	"each() loops all objects and returns self": function(test) {
		var d1 = {path: "/1", value: "bar1"},
				d2 = {path: "/2", value: "bar2"},
				d3 = {path: "/3", value: "bar3"};
		var s = new SpahQL(d1, d2, d3);

		test.expect(7);

		var bar1Looped = 0,
				bar2Looped = 0,
				bar3Looped = 0;

		var res = s.each(function(i, total) {
			if(this.path() == "/1") {
				bar1Looped++;
				test.equal(this.value(), "bar1");
			}
			else if(this.path() == "/2") {
				bar2Looped++;
				test.equal(this.value(), "bar2");	
			}
			else {
				bar3Looped++;
				test.equal(this.value(), "bar3");
			}
		});

		test.deepEqual(res, s);
		test.equal(bar1Looped, 1);
		test.equal(bar2Looped, 1);
		test.equal(bar3Looped, 1);
		test.done();
	},

	"each() breaks when the callback returns false, but still returns self": function(test) {
		var d1 = {path: "/1", value: "bar1"},
				d2 = {path: "/2", value: "bar2"},
				d3 = {path: "/3", value: "bar3"};
		var s = new SpahQL(d1, d2, d3);

		test.expect(6);

		var bar1Looped = 0,
				bar2Looped = 0,
				bar3Looped = 0;

		var res = s.each(function(i, total) {
			if(this.path() == "/1") {
				bar1Looped++;
				test.equal(this.value(), "bar1");
			}
			else if(this.path() == "/2") {
				bar2Looped++;
				test.equal(this.value(), "bar2");
				return false;	
			}
			else {
				bar3Looped++;
			}
		});

		test.deepEqual(res, s);
		test.equal(bar1Looped, 1);
		test.equal(bar2Looped, 1);
		test.equal(bar3Looped, 0);
		test.done();
	},

	"map() successfully maps a set": function(test) {
		var d1 = {path: "/1", value: "bar1"},
				d2 = {path: "/2", value: "bar2"},
				d3 = {path: "/3", value: "bar3"};
		var s = new SpahQL(d1, d2, d3);

		var res = s.map(function(i, total) {
			return this.path();
		});

		test.deepEqual(res, ["/1", "/2", "/3"]);
		test.done();
	},

	"map() returns an empty array for an empty set": function(test) {
		var s = new SpahQL();

		var res = s.map(function(i, total) {
			return this.path();
		});

		test.deepEqual(res, []);
		test.done();
	},

	"select() retrieves matching results from all items in the set": function(test) {
		var data = {a: {aa: "aaval", ab: "abval", c: {inner: "accval"}}, b: {bb: "bbval", bc: "bcval", c: {inner: "bccval"}}}
		var db = SpahQL.db(data);

		var res = db.select("//c");

		test.equal(res.length, 2);
		test.deepEqual(res.paths(), ["/a/c", "/b/c"]);

		var inners = res.select("/inner");
		test.equal(inners.length, 2);
		test.deepEqual(inners.paths(), ["/a/c/inner", "/b/c/inner"]);
		test.deepEqual(inners.values(), ["accval", "bccval"]);

		test.done();
	},

	"select() retrieves zero-value results": function(test) {
		var data = {a: {zero: 0, one: 1}, b: {zero: 0, two: 2}};
		var db = SpahQL.db(data);

		var res = db.select("//zero");

		test.equal(res.length, 2);
		test.deepEqual(res.values(), [0,0]);

		test.done();
	},

	"assert() passes if all results match the assertion": function(test) {
		var data = {a: {aa: "aaval", ab: "abval", c: {inner: "accval"}}, b: {bb: "bbval", bc: "bcval", c: {inner: "bccval"}}}
		var db = SpahQL.db(data);
		var res = db.select("//c");

		test.equal(res.length, 2);
		test.deepEqual(res.paths(), ["/a/c", "/b/c"]);

		test.ok(res.assert("/inner"));
		test.done();
	},

	"assert() fails if one result fails to meet the assertion": function(test) {
		var data = {a: {aa: "aaval", ab: "abval", c: {inner: "accval"}}, b: {bb: "bbval", bc: "bcval", c: {not_inner: "bccval"}}}
		var db = SpahQL.db(data);
		var res = db.select("//c");

		test.equal(res.length, 2);
		test.deepEqual(res.paths(), ["/a/c", "/b/c"]);

		test.ok(!res.assert("/inner"));
		test.done();
	},

	"parentPath() returns the parent path for the first item in the set": function(test) {
		var d1 = {path: "/foo/bar/1", value: "bar1"},
				d2 = {path: "/1/2", value: "bar2"},
				d3 = {path: "/1/3", value: "bar3"};
		var s = new SpahQL(d1, d2, d3);

		test.equal(s.parentPath(), "/foo/bar");
		test.done();
	},

	"parentPath() returns null for the root object": function(test) {
		var s = new SpahQL({path: "/", value: "foo"});

		test.equal(s.parentPath(), null);
		test.done();
	},

	"parentPaths() returns all parent paths for the set as an array": function(test) {
		var d1 = {path: "/foo/bar/1", value: "bar1"},
				d2 = {path: "/a/2", value: "bar2"},
				d3 = {path: "/b/3", value: "bar3"};
		var s = new SpahQL(d1, d2, d3);

		test.deepEqual(s.parentPaths(), ["/foo/bar", "/a", "/b"]);
		test.done();
	},

	"parent() returns a SpahQL instance containing the parent of the first item in the set": function(test) {
		var data = {a: {aa: "aaval", ab: "abval", c: {inner: "accval"}}, b: {bb: "bbval", bc: "bcval", c: {not_inner: "bccval"}}}
		var db = SpahQL.db(data);
		var res = db.select("//c");

		test.equal(res.length, 2);
		test.deepEqual(res.paths(), ["/a/c", "/b/c"]);

		var p = res.parent();
		test.equal(p.length, 1);
		test.deepEqual(p.paths(), ["/a"]);
		test.done();
	},

	"parents() returns a SpahQL instance containing the parents of all items in the set, excluding items with no parent": function(test) {
		var data = {c: "root", a: {aa: "aaval", ab: "abval", c: {inner: "accval"}}, b: {bb: "bbval", bc: "bcval", c: {not_inner: "bccval"}}}
		var db = SpahQL.db(data);
		var res = db.select("{/,//c}");

		test.equal(res.length, 4);
		test.deepEqual(res.paths(), ["/","/c", "/a/c", "/b/c"]);

		var parents = res.parents();
		test.equal(3, parents.length);
		test.deepEqual(parents.paths(), ["/", "/a", "/b"]);
		test.done();
	},

	"keyName() returns the right name for the first item in a set": function(test) {
		var data = {c: "root", a: {aa: "aaval", ab: "abval", c: {inner: "accval"}}, b: {bb: "bbval", bc: "bcval", c: {not_inner: "bccval"}}}
		var db = SpahQL.db(data);
		var res = db.select("/a/aa");

		test.equal(res.length, 1);
		test.equal(res.path(), "/a/aa");
		test.equal(res.keyName(), "aa");
		test.done();
	},

	"keyName() returns null for results not from a path query": function(test) {
		var data = {c: "root", a: {aa: "aaval", ab: "abval", c: {inner: "accval"}}, b: {bb: "bbval", bc: "bcval", c: {not_inner: "bccval"}}}
		var db = SpahQL.db(data);
		var res = db.select("{'a'}");

		test.equal(res.length, 1);
		test.equal(res.path(), null);
		test.equal(res.value(), "a");
		test.equal(res.keyName(), null);
		test.done();
	},

	"keyNames() maps the key names for all items in the set": function(test) {
		var data = {c: "root", a: {aa: "aaval", ab: "abval", c: {inner: "accval"}}, b: {bb: "bbval", bc: "bcval", c: {not_inner: "bccval"}}}
		var db = SpahQL.db(data);
		var res = db.select("{/,//c}");

		test.equal(res.length, 4);
		test.deepEqual(res.paths(), ["/","/c", "/a/c", "/b/c"]);
		test.deepEqual(res.keyNames(), [null, "c", "c", "c"]);
		test.done();
	},

	"keyNames() returns an empty array for an empty set": function(test) {
		var db = new SpahQL();
		var res = db.select("/foo");

		test.deepEqual(res.keyNames(), []);
		test.done();
	},

	"type() returns the string object type for any given result": function(test) {
		var data = {bool: true, arr: [], obj: {}, str: "foo", num: 10};
		var db = SpahQL.db(data);

		test.equal(db.select("/bool").type(), "boolean");
		test.equal(db.select("/arr").type(), "array");
		test.equal(db.select("/obj").type(), "object");
		test.equal(db.select("/str").type(), "string");
		test.equal(db.select("/num").type(), "number");
		test.done();
	},

	"containing() returns all items containing the given path": function(test) {
		var data = {a: {aa: "aaval"}, b: {aa: "aaval"}};
		var db = SpahQL.db(data);

		var containing = db.select("//aa").containing("/a/aa");
		test.equal(containing.length, 1);
		test.deepEqual(containing.paths(), ["/a/aa"]);

		containing = db.select("//aa").containing("/a/aa/some/other/child");
		test.equal(containing.length, 1);
		test.deepEqual(containing.paths(), ["/a/aa"]);

		test.done();
	},

	"containing() doesn't inadvertently match partial keys": function(test) {
		var data = {a: {aa: "aaval"}, b: {aa: "aaval"}};
		var db = SpahQL.db(data);

		containing = db.select("//aa").containing("/a/aaa");
		test.equal(containing.length, 0);

		test.done();
	},

	"containing() returns all items containing any of the paths in the given SpahQL object": function(test) {
		var data = {a: {aa: {aaa: "aaaval"}}, b: {aa: {aaa: "aaaval"}}};
		var db = SpahQL.db(data);

		var containing = db.select("//aa").containing(db.select("/b/aa/aaa"));
		test.equal(containing.length, 1);
		test.deepEqual(containing.paths(), ["/b/aa"]);

		containing = db.select("//aa").containing(db.select("//aaa"));
		test.equal(containing.length, 2);
		test.deepEqual(containing.paths(), ["/a/aa", "/b/aa"]);

		test.done();
	},

	"containing() returns all items containing any of the paths in the given array": function(test) {
		var data = {a: {aa: {aaa: "aaaval"}}, b: {aa: {aaa: "aaaval"}}};
		var db = SpahQL.db(data);

		var containing = db.select("//aa").containing(["/b/aa/aaa"]);
		test.equal(containing.length, 1);
		test.deepEqual(containing.paths(), ["/b/aa"]);

		containing = db.select("//aa").containing(["/a/aa/aaa", "/b/aa/aaa"]);
		test.equal(containing.length, 2);
		test.deepEqual(containing.paths(), ["/a/aa", "/b/aa"]);

		test.done();
	},

	"containingAll() returns all items containing all the paths in the given SpahQL object": function(test) {
		var data = {a: {aa: {aaa: "aaaval"}}, b: {aa: {aaa: "aaaval"}}};
		var db = SpahQL.db(data);

		var containing = db.select("//aa").containingAll(db.select("//aaa"));
		test.equal(containing.length, 0);

		containing = db.select("//aa").containingAll(db.select("/a//aaa"));
		test.equal(containing.length, 1);
		test.deepEqual(containing.paths(), ["/a/aa"]);

		test.done();
	},

	"containingAll() returns all items containing all the paths in the given path array": function(test) {
		var data = {a: {aa: {aaa: "aaaval"}}, b: {aa: {aaa: "aaaval"}}};
		var db = SpahQL.db(data);

		var containing = db.select("//aa").containingAll(["/b","/a/aa/aaa/WHATEVER"]);
		test.equal(containing.length, 0);

		containing = db.select("//aa").containingAll(["/a/aa/aaa/WHATEVER"]);
		test.equal(containing.length, 1);
		test.deepEqual(containing.paths(), ["/a/aa"]);

		test.done();
	},

	"filter() reduces the set to those for which the scoped assertion is true": function(test) {
		var data = {c: "root", a: {c: {inner: "accval"}}, b: {c: {inner: "bccval"}}}
		var db = SpahQL.db(data);
		var res = db.select("//c");

		test.equal(res.length, 3);
		var filtered = res.filter("/inner");

		test.equal(filtered.length, 2);
		test.deepEqual(filtered.paths(), ["/a/c", "/b/c"]);
		test.deepEqual(filtered.values(), [{inner: "accval"}, {inner: "bccval"}]);
		test.done();
	},

	"Detaches as a root-level object": function(test) {
		var myDb = SpahQL.db({foo: {bar: "baz"}});
   	
   	var foo = myDb.select("/foo");   	
   	var fooClone = foo.detach();
   	
   	test.equal(fooClone.length, 1);
   	test.equal(fooClone.path(), "/")
   	test.deepEqual(fooClone.value(), foo.value());
   	test.ok(fooClone.value() != foo.value());

   	test.done();
	},

	"clone() produces a complete clone with detached source data": function(test) {
		var data = {foo: {bar: "baz"}};
		var myDb = SpahQL.db(data).select("//*");
		var myDbClone = myDb.clone();

		test.notEqual(myDb.sourceData(), myDbClone.sourceData());
		test.deepEqual(myDb.sourceData(), myDbClone.sourceData());
		test.deepEqual(myDb.paths(), myDbClone.paths());
		test.deepEqual(myDb.values(), myDbClone.values());

		myDbClone.destroy();
		test.ok(myDbClone.length+1, myDb.length);
		test.notDeepEqual(myDb.sourceData(), myDbClone.sourceData());

		test.done();
	},

	"set() Sets a subkey on an array": function(test) {
		var arr = [0,1,2];
		var db = SpahQL.db({"arr": arr});

		db.select("/arr").set(0, "0-modified");
		test.deepEqual(arr, ["0-modified", 1, 2]);

		db.select("/arr").set("1", "1-modified");
		test.deepEqual(arr, ["0-modified", "1-modified", 2]);

		db.select("/arr").set(3, "3-created");
		test.deepEqual(arr, ["0-modified", "1-modified", 2, "3-created"]);

		test.done();
	},

	"set() Sets a subkey on a hash": function(test) {
		var hsh = {a: "a", b: "b", c: "c"};
		var db = SpahQL.db({"hsh": hsh});

		db.select("/hsh").set("a", "a-modified");
		test.deepEqual(hsh, {a: "a-modified", b: "b", c: "c"});

		db.select("/hsh").set(1, "1-created");
		test.deepEqual(hsh, {a: "a-modified", b: "b", c: "c", "1": "1-created"});

		test.done();
	},

	"set() is a NOOP on simple types": function(test) {
		var str = "abcd";
		var db = SpahQL.db({"str": str});

		db.select("/str").set(0, "changed");
		test.deepEqual(db.select("/str").value(), "abcd");
		test.equal(str, "abcd");

		test.done();
	},

	"set() triggers modification callbacks on the affected path": function(test) {
			var hsh1 = {a: "a", b: "b", c: "c"};
			var hsh2 = {a: "aa", b: "bb", c: "cc"};
			var db = SpahQL.db({"hsh1": hsh1, "hsh2": hsh2});

			var set = db.select("/hsh1");

			set.listen(function(result, path) {
				test.equal(result.length, 1);
				test.equal(result.path(), path);
				test.equal(path, "/hsh1");
				test.equal(result.value(), hsh1);
				test.done();
			});

			set.set("a", "a-modified");
	},

	"setAll() sets on all members in the set": function(test) {
			var hsh1 = {a: "a", b: "b", c: "c"};
			var hsh2 = {a: "aa", b: "bb", c: "cc"};
			var db = SpahQL.db({"hsh1": hsh1, "hsh2": hsh2});

			db.select("/*").setAll("newkey", "newval");

			test.equal(hsh1.newkey, "newval");
			test.equal(hsh2.newkey, "newval");

			test.done();
	},

	"setAll() ignores non-settable types": function(test) {
		var hsh1 = {a: "a", b: "b", c: "c"};
		var data = {"hsh1": hsh1, "hsh2": "hsh2"};
		var db = SpahQL.db(data);

		db.select("/*").setAll("newkey", "newval");

		test.equal(hsh1.newkey, "newval");
		test.equal(data.hsh2, "hsh2");

		test.done();
	},	

	"listen() waits for modifications on the entire set": function(test) {
			var hsh = {a: {aa: "aaval"}, b: {aa: "bbval"}};
			var db = SpahQL.db({"hsh": hsh});

			var set = db.select("/hsh/*");
			test.equal(set.length, 2);

			var listenersTriggered = 0;
			set.listen(function() {
				listenersTriggered++;
				if(listenersTriggered == set.length) test.done();
			});

			set.each(function() {
				this.set("foo", "bar");
			});
	},

	"unlisten() removes a listener": function(test) {
		var hsh = {a: {aa: "aaval"}, b: {aa: "bbval"}};
		var db = SpahQL.db({"hsh": hsh});

		var observer = function(result, path, subpaths) {
			throw new Error("OH SCIENCE WHY DID I FIRE")
		};

		db.listen("/hsh", observer);
		db.unlisten("/hsh", observer);

		db.select("/hsh/a").set({"bb": "bbval", "cc": "ccval"});
		test.done();
	},

	"replace() on a child key replaces the value in-place and updates the data store": function(test) {
		var hsh = {a: {aa: "aaval"}, b: {aa: "bbval"}};
		var hshReplacement = {x: {xx: "xxval"}};
		var data = {"hsh": hsh};
		var db = SpahQL.db(data);

		var res = db.select("/hsh");
		res.replace(hshReplacement);

		test.equal(res.value(), hshReplacement);
		test.equal(db.select("/hsh").value(), hshReplacement);
		test.equal(data.hsh, hshReplacement);
		test.done();
	},

	"replace() on the root object is ignored": function(test) {
		var hsh = {a: {aa: "aaval"}, b: {aa: "bbval"}};
		var hshReplacement = {x: {xx: "xxval"}};
		var db = SpahQL.db(hsh);

		db.replace(hshReplacement);

		test.equal(db.value(), hsh);
		test.equal(db.select("/x").value(), null);
		test.done();
	},

	"replace() triggers listeners": function(test) {
		var hsh = {a: {aa: "aaval"}, b: {aa: "bbval"}};
		var hshReplacement = {x: {xx: "xxval"}};
		var db = SpahQL.db({"hsh": hsh});

		var res = db.select("/hsh");

		res.listen(function(result, path, subpaths) {
			test.equal(result.value(), hshReplacement);
			test.equal(path, "/hsh");

			test.done();
		})

		res.replace(hshReplacement);
	},

	"replaceAll() works against every item in the set": function(test) {
		var db = SpahQL.db({arr: ["a",1,2,"3","4"]});

		db.select("//*[/.type=='number']").replaceAll("NO NUMBERS ALLOWED");

		test.deepEqual(
			db.select("/arr").value(),
			["a","NO NUMBERS ALLOWED","NO NUMBERS ALLOWED","3","4"]
		);
		test.done();
	},

  "rename() on a child key renames the key in-place and updates the data store": function(test) {
	  var data = {a: 'one', b: 'two'};
	  var db = SpahQL.db(data);
      
	  var res = db.select("/a");
	  res.rename('c');
      
	  test.equal(res.value(), 'one');
	  test.equal(db.select("/c").value(), 'one');
	  test.done();
  },
  
  "rename() on the root object is ignored": function(test) {
  	var hsh = {a: {aa: "aaval"}, b: {aa: "bbval"}};
  	var db = SpahQL.db(hsh);
  
  	db.rename('test');
  
  	test.equal(db.value(), hsh);
  	test.equal(db.select("/test").value(), null);
    test.done();
  },
  
  "rename() triggers listeners": function(test) {
  	var hsh = {a: {aa: "aaval"}, b: {aa: "bbval"}};
  	var db = SpahQL.db({"hsh": hsh});
  
  	var res = db.select("/hsh");
  
  	res.listen(function(result, path, subpaths) {  		
  	  // NOTE: the expectation here needs defining? @kolektiv  
  		test.done();
  	})
  
    res.replace('test');
  },
  
  "renameAll() works against every item in the set": function(test) {
  	var db = SpahQL.db({ a: 'test', b: { a: 'test' }});
  
  	db.select("//a").renameAll('c');
  
  	test.deepEqual(
  		db.select("/").value(),
  		{ c: 'test', b: { c: 'test' }}
  	);
  	test.done();
  },

	"destroy() deletes from the parent": function(test) {
		var inner = {aa: "aa"};
		var outer = {a: inner, b: inner};

		var db = SpahQL.db(outer);

		db.select("/a").destroy();

		test.deepEqual(db.value(), {b: inner});
		test.done();
	},

	"destroy() ignored on root object": function(test) {
		var inner = {aa: "aa"};
		var outer = {a: inner, b: inner};

		var db = SpahQL.db(outer);

		db.destroy();

		test.deepEqual(db.value(), {a: inner, b: inner});
		test.done();
	},

	"destroy() deletes a key from an array": function(test) {
		var inner = [0,1,2,3,4];
		var outer = {a: inner, b: inner};

		var db = SpahQL.db(outer);

		db.select("/a").destroy(3);

		test.deepEqual(db.value(), {a: inner, b: inner});
		test.deepEqual(inner, [0,1,2,4]);
		test.done();
	},

	"destroy() deletes a key from an object": function(test) {
		var inner = {aa: "aa", bb: "bb"};
		var outer = {a: inner, b: inner};

		var db = SpahQL.db(outer);

		db.select("/a").destroy("bb");

		test.deepEqual(db.value(), {a: inner, b: inner});
		test.deepEqual(inner, {aa: "aa"});
		test.done();
	},

	"destroyAll() works against every item in the set": function(test) {
		var inner1 = {aa: "aa", bb: "bb"};
		var inner2 = {aa: "aa", bb: "bb"};
		var outer = {a: inner1, b: inner2};

		var db = SpahQL.db(outer);

		db.select("/*").destroyAll("bb");

		test.deepEqual(db.value(), {a: inner1, b: inner2});
		test.deepEqual(inner1, {aa: "aa"});
		test.deepEqual(inner2, {aa: "aa"});
		test.done();
	},

	"toString() produces a JSON representation of the db and query results": function(test) {
		var db = SpahQL.db({foo: "bar"});
		var val = db.select("/foo");

		test.equal(db+"", JSON.stringify({foo: "bar"}));
		test.equal(val+"", "bar")
		test.done();
	},

	"valueOf() produces the raw query results": function(test) {
		var db = SpahQL.db({foo: "bar"});
		var val = db.select("/foo");
		
		test.ok(isNaN(db/1));
		test.deepEqual([db.valueOf(), val.valueOf()], [{foo: "bar"}, "bar"]);
		test.done();
	}

}
