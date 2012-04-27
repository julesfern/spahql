exports["SpahQL.Token.Simple"] = {
	
	"Evaluates to a single-item array containing an orphaned result object": function(test) {
		var t = new SpahQL.Token.Simple("foo");

		test.deepEqual(t.evaluate(), [{path: null, value: "foo", sourceData: "foo"}]);
		test.done();
	}

}