REPL = function() {

	}
	REPL.prototype = {
		"exec": function(json, query, target) {
			var data, db, parsedQuery, assertionResult, selectionResult;

			try { data = $.parseJSON(json); }
			catch(e) { return this.renderError(target, "Error parsing JSON: "+e.message); }

			try { db = SpahQL.db(data); }
			catch(e) { return this.renderError(target, "Error instantiating SpahQL database: "+e.message); }

			try { parsedQuery = SpahQL.QueryParser.parseQuery(query); }
			catch(e) { return this.renderError(target, "Error parsing SpahQL query: "+e.message); }

			if(parsedQuery.assertion) {
				try { assertionResult = db.assert(query); }
				catch(e) { return this.renderError(target, "Error running assertion: "+e.message); }

				this.resetRender(target);
				this.renderAssertion(target, query, assertionResult);
			}
			else {
				try { selectionResult = db.select(query); }
				catch(e) { return this.renderError(target, "Error running selection: "+e.message); }

				try { assertionResult = db.assert(query); }
				catch(e) { return this.renderError(target, "Error running assertion: "+e.message); }

				this.resetRender(target);
				this.renderSelection(target, query, selectionResult, assertionResult);
			}
			return false;
		},

		"resetRender": function(target) {
			target.html("");
			target.append('<div class="assertion result"></div>');
			target.append('<div class="selection result"></div>');
		},

		"renderError": function(target, message) {
			this.resetRender(target);
			target.append('<span class="error">'+message+'</span>');
		},

		"renderAssertion": function(target, query, assertionResult) {
			var $op = $(".assertion.result", target);
			$op.html('Assertion result: <span class="bool">'+assertionResult+'</span>');
		},

		"renderSelection": function(target, query, selectionResult, assertionResult) {
			var $op = $(".selection.result", target),
				summary = 'Selection returned '+selectionResult.length+' '+(selectionResult.length == 1 ? 'item' : 'items'),
				$ol = $("<ol></ol>");

			for(var i=0; i<selectionResult.length;i++) {
				var r = selectionResult[i],
					$li = $("<li></li>");

				$li.append('<span class="value">'+((typeof(JSON)!='undefined' && typeof(JSON.stringify)!='undefined') ? JSON.stringify(r.value) : r.value)+'</span>');
				$li.addClass(r.path ? "from-source" : "from-literal");
				$li.append('<span class="path">'+(r.path || "No path")+'</span>');
				$ol.append($li);
			}

			$op.html("");
			$op.append('<span class="summary">'+summary+'</span>');
			$op.append($ol);

			this.renderAssertion(target, query, assertionResult);
		}
	};