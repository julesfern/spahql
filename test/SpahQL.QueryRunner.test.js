var qp = SpahQL.QueryParser;
var qr = SpahQL.QueryRunner;
// Load fixtures
var queryData, queryTests;
var queryDataURL = "/test/fixtures/queryData.json",
    queryTestsURL = "/test/fixtures/queryTests.json";

if(SpahQL.inBrowser()) {
  $.ajax(queryDataURL, {dataType: 'json', async: false,
    success: function(data, textStatus, jqXHR) {
      queryData = data;
    }
  });
  $.ajax(queryTestsURL, {dataType: 'json', async: false,
    success: function(data, textStatus, jqXHR) {
      queryTests = data;
    }
  });
}
else {
  var fs = require('fs');
  queryData = JSON.parse(fs.readFileSync(__dirname+"/fixtures/queryData.json"));
  queryTests = JSON.parse(fs.readFileSync(__dirname+"/fixtures/queryTests.json"));
      
}
  
  
exports["SpahQL.QueryRunner"] = {
  
  // Run all selection queries
  "Selection Query Fixtures: Runs the fixture set with the correct results": function(test) {
    for(var s in queryTests.Selection) {
      var qfix = queryTests.Selection[s];
      var n = qfix.name;
      var q = qp.parseQuery(qfix.query);
      var actual = qr.select(q, (qfix.data || queryData));
      var expected = qfix.result;
    
      test.equal(actual.length, expected.length, n+": Result count matched");
    
      for(var e in expected) {
        // Assert presence of each result
        var exPath = expected[e][0]; var exValue = expected[e][1];
        test.equal(actual[e].path, exPath, n+": Paths matched at index '"+e+"'");
        test.deepEqual(actual[e].value, exValue, n+": Values matched at index '"+e+"'");
      }
    }
    test.done();
  },

  "Selection Queries: retrieves zero values": function(test) {
    var q = qp.parseQuery("/hsh/zero");
    var data = {hsh: {zero: 0, one: 1}};

    test.deepEqual(qr.select(q, data),
      [{path: "/hsh/zero", value: 0, sourceData: data}]
    );
    test.done();
  },
  
  // Run all assertion queries
  "Assertion query fixtures: Runs the fixture set with the correct results": function(test) {
    for(var s in queryTests.Assertion) {
      var qfix = queryTests.Assertion[s];
      var n = qfix.name;
      var q = qp.parseQuery(qfix.query);
      var actual = qr.assert(q, (qfix.data || queryData));
      var expected = qfix.result;
      test.equal(actual, expected, n+": Expected boolean returned ('"+qfix.query+"' -> "+expected+")");
    }
    test.done();
  }
  
};