const functions = require("firebase-functions");
const admin = require("firebase-admin");

const Twit = require("twit");

admin.initializeApp(functions.config().firebase);

function GetDataWithHashtagsOnly(data) {
  var returnData = [];
  if (data.length > 0) {
    data.forEach(function(element) {
      if (element.entities["hashtags"].length > 0) {
        returnData.push(element);
      }
    }, this);
  }
  return returnData;
}

function GetDictionaryOfHashtags(data) {
  var returnData = {};
  if (data.length > 0) {
    console.log("In dict");
    data.forEach(function(element) {
      var hashtags = element.entities.hashtags;
      hashtags.forEach(function(hash) {
        if (returnData['#'+hash.text.toLowerCase()] == null) {
          returnData['#'+hash.text.toLowerCase()] = [];
        }
		// var now = new Date();
		// var then = new Date(element.created_at);
		// var diffMins = Math.round((((y-x) % 86400000) % 3600000) / 60000); // minutes
		
        returnData['#'+hash.text.toLowerCase()].push({
          text: element.text,
          name: '@'+element.user.screen_name,
          time: element.created_at
        });
      }, this);
    }, this);
  }
  returnData = SortObjectGeneric(returnData, function(key,obj) { return obj[key].length; } , true, true);
  return returnData;
}

function SortObjectGeneric(MainObject, getValueOfKey, IsObject, IsDescending) {
    var result;
    if (IsObject === true) {
        result = Object.keys(MainObject);
    }
    else {
        result = MainObject.slice(0);
    }
    result.sort(function (x, y) {
        var valueX = getValueOfKey(IsDescending === true ? y : x, IsObject === true ? MainObject : null);
        var valueY = getValueOfKey(IsDescending === true ? x : y, IsObject === true ? MainObject : null);
        return (valueX > valueY) ? 1 : ((valueX < valueY) ? -1 : 0);
    });
    if (IsObject === true) {
        result = result.reduce(function (previous, key) {
            previous[key] = MainObject[key];
            return previous;
        }, {});
    }
    return result;
}



exports.TwitterFuncHttp = functions.https.onRequest((req, res) => {
  var T = new Twit({
    consumer_key: "gwzBEXhFQ9HD2vVcBvx1cA2Xk",
    consumer_secret: "vtHPFaTXOgJj5KLeaRXo4nHcQNJSwFb8eMRWJvBnlNhf6UPMFc",
    access_token: "878491211933331456-Y2P3NfEKNq56CNeMDrRe1ZwsNT0kc5C",
    access_token_secret: "Q9aClpiz740PsnMQmVMO0kuZg5huWcQjDZJbFsdaPvm3z",
    timeout_ms: 60 * 1000 // optional HTTP request timeout to apply to all requests.
  });
  console.log("In Request");
  T.get(
    "search/tweets",
    {
      q: " ",
      geocode: req.query.location + ",5km",
      count: 1000,
      sort_by: "created_by-desc"
    },
    function(err, data, response) {
      if (data) {
        var filteredData = GetDataWithHashtagsOnly(data.statuses);
        var filteredData = GetDictionaryOfHashtags(filteredData);
        res.send(filteredData);
      }
    }
  );
});
