exports["SpahQL.Strategiser"] = {
	
	"Converts strategies with convenience keys to the standarised schema": function(test) {
		var strategiser = new SpahQL.Strategiser();
		var strat;
		var action = function(){};

		strat = {"path": "/*", "if": "//*", "action": action};
		test.deepEqual(
			strategiser.commoniseStrategy(strat), 
			{"paths": ["/*"], "condition": "//*", "expectation": true, "action": action, "category": "*", "_commonised": true}
		);

		strat = {"paths": "/*", "if": "//*", "action": action};
		test.deepEqual(
			strategiser.commoniseStrategy(strat), 
			{"paths": ["/*"], "condition": "//*", "expectation": true, "action": action, "category": "*", "_commonised": true}
		);

		strat = {"paths": ["/a", "/b"], "unless": "//*", "action": action};
		test.deepEqual(
			strategiser.commoniseStrategy(strat), 
			{"paths": ["/a", "/b"], "condition": "//*", "expectation": false, "action": action, "category": "*", "_commonised": true}
		);

		strat = {"paths": ["/a", "/b"], "action": action};
		test.deepEqual(
			strategiser.commoniseStrategy(strat), 
			{"paths": ["/a", "/b"], "condition": null, "expectation": false, "action": action, "category": "*", "_commonised": true}
		);

		strat = {"paths": ["/a", "/b"], "unless": "//*"};
		test.deepEqual(
			strategiser.commoniseStrategy(strat, action), 
			{"paths": ["/a", "/b"], "condition": "//*", "expectation": false, "action": action, "category": "*", "_commonised": true}
		);

		strat = {"paths": ["/a", "/b"], "unless": "//*"};
		test.deepEqual(
			strategiser.commoniseStrategy(strat, "cat", action), 
			{"paths": ["/a", "/b"], "condition": "//*", "expectation": false, "action": action, "category": "cat", "_commonised": true}
		);


		test.done();
	},

	"Registers and retrieves a strategy by category": function(test) {
		var strategiser = new SpahQL.Strategiser();
		var action = function() {};
		var strat;

		strat = strategiser.addStrategy({"path": "/", "action": action, "category": "foo"});
		test.equal(strategiser.strategies.indexOf(strat), 0);
		test.equal(strategiser.categories["foo"].indexOf(strat), 0);

		strat = strategiser.addStrategy({"path": "/", "action": action, "category": "foo"});
		test.equal(strategiser.strategies.indexOf(strat), 1);
		test.equal(strategiser.categories["foo"].indexOf(strat), 1);		

		strat = strategiser.addStrategy({"path": "/", "action": action}, "bar");
		test.equal(strategiser.strategies.indexOf(strat), 2);
		test.equal(strategiser.categories["bar"].indexOf(strat), 0);	

		test.done();
	},

	"Removes a strategy from the global and category caches": function(test) {
		var strategiser = new SpahQL.Strategiser();
		var action = function() {};
		var stratFoo, stratBar;

		stratFoo = strategiser.addStrategy({"path": "/", "action": action, "category": "foo"});
			test.equal(strategiser.strategies.indexOf(stratFoo), 0);
			test.equal(strategiser.categories["foo"].indexOf(stratFoo), 0);
		stratBar = strategiser.addStrategy({"path": "/", "action": action}, "bar");
			test.equal(strategiser.strategies.indexOf(stratBar), 1);
			test.equal(strategiser.categories["bar"].indexOf(stratBar), 0);		
		
		test.ok(strategiser.removeStrategy(stratFoo));
			test.equal(strategiser.strategies.indexOf(stratFoo), -1);
			test.equal(strategiser.strategies.indexOf(stratBar), 0);
			test.equal(strategiser.categories["foo"].indexOf(stratFoo), -1);

		test.ok(strategiser.removeStrategy(stratBar));
			test.equal(strategiser.strategies.indexOf(stratBar), -1);
			test.equal(strategiser.categories["bar"].indexOf(stratBar), -1);

		test.done();
	},

	"Registers and retrieves a strategy by wildcard category": function(test) {
		var strategiser = new SpahQL.Strategiser();
		var action = function() {};
		var stratFoo, stratBar, stratStar;

		stratFoo = strategiser.addStrategy({"path": "/", "action": action, "category": "foo"});
		stratStar = strategiser.addStrategy({"path": "/", "action": action});
		stratBar = strategiser.addStrategy({"path": "/", "action": action}, "bar");

		test.deepEqual(strategiser.getStrategies(), [stratFoo, stratStar, stratBar]);
		test.deepEqual(strategiser.getStrategies("*"), [stratStar]);
		test.deepEqual(strategiser.getStrategies("foo"), [stratFoo, stratStar]);
		test.deepEqual(strategiser.getStrategies("bar"), [stratStar, stratBar]);

		test.done();
	},

	"Executes strategies by category": function(test) {
		var data = {a: {aa: "a.aa.val", bb: "a.bb.val"}, b: {aa: "b.aa.val", bb: "b.bb.val"}};
		var state = SpahQL.db(data);
		var strategiser = new SpahQL.Strategiser();
		var stratFoo, stratBar, stratStar;

		var fooRan = 0, barRan = 0, starRan = 0;

		stratFoo = strategiser.addStrategy({"path": "/", "category": "foo"}, function(set,root,att,fc) { fooRan++; fc.done(); });
		stratStar = strategiser.addStrategy({"path": "/"}, function(set,root,att,fc) { starRan++; fc.done(); });
		stratBar = strategiser.addStrategy({"path": "/"}, "bar", function(set,root,att,fc) { barRan++; fc.done(); });

		test.expect(12);
		strategiser.run(state, "foo", {}, function(t1, a1) {
				test.equal(fooRan, 1);
				test.equal(barRan, 0);
				test.equal(starRan, 1);

				strategiser.run(t1, "bar", a1, function(t2, a2) {
					test.equal(fooRan, 1);
					test.equal(barRan, 1);
					test.equal(starRan, 2);

					strategiser.run(t2, "*", a2, function(t3, a3) {
							test.equal(fooRan, 1);
							test.equal(barRan, 1);
							test.equal(starRan, 3);

							strategiser.run(t3, null, a3, function(t4, a4) {
									test.equal(fooRan, 2);
									test.equal(barRan, 2);
									test.equal(starRan, 4);

									test.done();
							});
					});
				});
		});
	},

	"Runs strategies with IF conditions only when the expectation is met": function(test) {
		var data = {a: {aa: "a.aa.val", bb: "a.bb.val"}, b: {aa: "b.aa.val", bb: "b.bb.val"}};
		var state = SpahQL.db(data);
		var strategiser = new SpahQL.Strategiser();
		var yesStrat, noStrat, yesRan, noRan;
		var yesRan = 0, noRan = 0;

		yesStrat = strategiser.addStrategy({"path": "/", "if": "/a"}, "iftest", function(set,root,att,fc) { yesRan++; fc.done(); });
		noStrat = strategiser.addStrategy({"path": "/", "if": "/c"}, "iftest", function(set,root,att,fc) { noRan++; fc.done(); });

		test.expect(2);
		strategiser.run(state, "iftest", {}, function(t1, a1) {
				test.equal(yesRan, 1);
				test.equal(noRan, 0);
				test.done();
		});
	},

	"Runs strategies with UNLESS conditions when the expectation is met": function(test) {
		var data = {a: {aa: "a.aa.val", bb: "a.bb.val"}, b: {aa: "b.aa.val", bb: "b.bb.val"}};
		var state = SpahQL.db(data);
		var strategiser = new SpahQL.Strategiser();
		var yesStrat, noStrat, yesRan, noRan;
		var yesRan = 0, noRan = 0;

		yesStrat = strategiser.addStrategy({"path": "/", "unless": "/c"}, "iftest", function(set,root,att,fc) { yesRan++; fc.done(); });
		noStrat = strategiser.addStrategy({"path": "/", "unless": "/a"}, "iftest", function(set,root,att,fc) { noRan++; fc.done(); });

		test.expect(2);
		strategiser.run(state, "iftest", {}, function(t1, a1) {
				test.equal(yesRan, 1);
				test.equal(noRan, 0);
				test.done();
		});
	}

};