/**
 * class SpahQL.Strategiser
 *
 * A generic handler class for managing SpahQL Strategies and applying them to SpahQL objects.
 * 
 * The Strategiser allows the creation and registration of SpahQL Strategies, which are macros
 * which may be applied to SpahQL objects such as the Spah State.
 *
 * Strategies are categorised, allowing specific sets of strategies to be executed at any time.
 **/
 SpahQL_classCreate("SpahQL.Strategiser", {

 }, {

 		/**
 		 * new SpahQL.Strategiser
 		 *
 		 * Create a new, empty Strategiser instance, ready to receive a new set of strategies for
 		 * application to SpahQL objects.
  		 **/
 		"init": function() {
 			this.strategies = [];
 			this.categories = {};
 		},

    "count": function(category) {
      return this.getStrategies(category).length;
    },

 		/**
 		 * SpahQL#addStrategy(strategy[, category][, action]) -> Object
 		 * - strategy (Object): A hash describing the strategy
 		 * - category (String): An optional category for this strategy, allowing all similarly-categorised strategies to be run with a single call.
 		 * - action (Function): An optional function to be used as the strategy's action if you don't like specifying functions in hashes.
 		 *
 		 * Adds a strategy to this strategiser instance. Strategies are macros which may be categorised, and specific categories
 		 * of strategy run in sequence against any given _target_. The target is always a SpahQL instance, although it need not 
 		 * be the root query result.
 		 *
 		 * Strategies are hashes containing the following keys:
 		 * * _path_ or _paths_: A path or array of paths used to select those parts of the target to which the strategy will be applied.
 		 *   specifying an array of N paths makes the strategy equivalent to N individual strategies which share all other strategy options.
 		 * * _if_ or _unless_: A SpahQL assertion which must be met by the target in order for the strategy to run.
 		 * * _action_: A function specifying the strategy's behaviour. Let's look at an example:
 		 *
 		 * 		strategiser.addStrategy({
 		 * 			"path": "/mentions", 
 		 * 			"if": "/mentions/.length > 0", 
 		 * 			"action": function(results, target, attachments, strategy) {
	   * 				// Do something to modify the results and then call...
	   * 				strategy.done();
 		 *			}
 		 * 		}, "myEvent");
 		 *
 		 * The _action_ receives the arguments _results_ (the SpahQL result set matching by the _path_), _target_ (the SpahQL set
 		 * to which the strategy is being applied), _attachments_ (An arbitrary object fed in by the caller executing the 
 		 * strategy) and _strategy_, an object containing flow control functions used to signal a strategy's completion.
 		 *
 		 * This method returns the strategy object in a common format with the convenience syntax massaged down to something
 		 * the strategiser's internals can understand. Keep a reference to this handy if you wish to use #removeStrategy later.
 		 **/
 		"addStrategy": function(strategy, category, action) {
 			var strat = this.commoniseStrategy(strategy, category, action);
 			this.strategies.push(strat);
			this.categories[strat.category] = this.categories[strat.category] || [];
			this.categories[strat.category].push(strat);
 			return strat;
 		},

 		/**
 		 * SpahQL.Strategiser#removeStrategy(commonStrategy) -> Boolean
 		 * - commonStrategy (Object): A commonised strategy object as returned by #commoniseStrategy or #addStrategy
 		 *
 		 * Removes a strategy from this strategiser completely.
 		 **/
 		"removeStrategy": function(commonStrategy) {
 			var i = this.strategies.indexOf(commonStrategy);
 			if(i >= 0) {
 				this.strategies.splice(i, 1);

 				var cat = this.categories[commonStrategy.category];
 				if(cat) {
 					var cI = cat.indexOf(commonStrategy);
 					if(cI >= 0) cat.splice(cI, 1);
 				}
 				return true;
 			}
 			return false;
 		},


 		/**
 		 * SpahQL.Strategiser#commoniseStrategy(strategy) -> Object
 		 * strategy (Object): A strategy object, allowed to use convenience keys such as "if" or "unless"
 		 *
 		 * Accepts a strategy object with convenience keys and converts it to the standardised
 		 * schema expected by strategy objects internally.
 		 **/
 		"commoniseStrategy": function(strategy, category, callback) {
 			if(strategy._commonised) return strategy;

 			if(typeof(category) == "function") {
 				callback = category;
 				category = null;
 			}

      var paths = strategy.paths || strategy.path;
      if(typeof(paths) == "string") paths = [paths];

      var expectation = (strategy["if"])? true : false;
      var condition = (expectation ? strategy["if"] : strategy["unless"]) || null;
      var action = strategy.action || callback;
      var category = category || strategy.category || "*";

      var commonStrategy = {
        "paths": paths,
        "expectation": expectation,
        "condition": condition,
        "action": action,
        "category": category,
        "_commonised": true
      };

      return commonStrategy;
 		},

 		/**
 		 * SpahQL.Strategiser#getStrategies([categories]) -> Array
 		 * - categories (Array, String): A category or array of categories
 		 *
 		 * Retrieves an ordered set of strategies for the given categores. Uncategorised strategies are always included.
 		 * With no arguments, returns all strategies. With an argument "*", returns all uncategorised strategies.
 		 * With a named category argument, returns all strategies of the named category and all uncategorised strategies.
 		 **/
 		"getStrategies": function(categoryList) {
 			if(!categoryList) return this.strategies;
 			var categories = (typeof(categoryList)=="string")? [categoryList] : categoryList;
 			var strats = [];

 			for(var i in this.strategies) {
 				var strategy = this.strategies[i];
 				var category = strategy.category;
 				if(category == "*" || categories.indexOf(category) >= 0) strats.push(strategy);
 			}

 			return strats;
 		},

 		/**
 		 * SpahQL.Strategiser#run(target, categoryList, attachments, callback) -> void
 		 * - target (SpahQL): The SpahQL object upon which you want to execute a strategy set.
 		 * - categoryList (String, Array): One or more categories used to filter the strategies you wish to execute
 		 * - attachments (*): An object made available to strategy actions at runtime
 		 * - callback (Function): A function to call when the strategy loop has completed. Takes arguments (target, attachments).
 		 **/
 		"run": function(target, categoryList, attachments, callback) {
 				var strategies = this.getStrategies(categoryList);
 				this.locked = true;
 				this.runStrategyLoop(0, strategies, target, attachments, callback);
 		},

 		"runStrategyLoop": function(strategyIndex, strategies, target, attachments, exitCallback) {
 				// Check for exit condition
 				if(strategyIndex >= strategies.length) return this.completed(target, attachments, exitCallback);
 				var strategy = strategies[strategyIndex];

 				// Prepare the flow control
 				var scope = this;
 				function exitToStrategyLoop() {
 						return scope.runStrategyLoop(strategyIndex+1, strategies, target, attachments, exitCallback);
 				}

 				// Check the preconditions if any are present on this strategy
				if(strategy.condition && (target.assert(strategy.condition) != strategy.expectation)) return exitToStrategyLoop();

 				// Enter the game loop 				
 				this.runStrategyQueryLoop(0, strategy, target, attachments, exitToStrategyLoop);
 		},

 		"runStrategyQueryLoop": function(queryIndex, strategy, target, attachments, exitToStrategyLoop) {
 				var queries = strategy.paths;
 				// Check for exit condition
 				if(queryIndex >= queries.length) return exitToStrategyLoop();

 				// Prepare the flow control
 				var scope = this;
 				function exitToQueryLoop() {
 					return scope.runStrategyQueryLoop(queryIndex+1, strategy, target, attachments, exitToStrategyLoop);
 				}
 				var flowController = {
 					"done": exitToQueryLoop
 				};

 				var query = strategy.paths[queryIndex];
 				var results = target.select(query);
 				var action = strategy.action;
 				if(results.length > 0) {
 					// Execute action for this query
 					return action(results, target, attachments, flowController);
 				}
 				else {
 					// No results for this query, move to next
 					return exitToQueryLoop();
 				}
 		},

 		"completed": function(target, attachments, callback) {
 			callback(target, attachments);
 		}

 });