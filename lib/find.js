const debug = require("debug")("gc:rest:find");

function find(collection, query) {
  let queryDoc = {
    coord: { $exists: true },
    parsed: { $exists: true },
    "parsed.premium": false,
    // don't find disabled geocaches by default
    "parsed.disabled": false
  };
  if (query.type) {
    queryDoc["parsed.type"] = query.type;
  }
  if (query.disabled) {
    queryDoc["parsed.disabled"] = query.disabled == "1";
  }
  if (query.score) {
    queryDoc["parsed.foundScore"] = { $gt: parseFloat(query.score) };
  }
  if (query.exclude) {
    let exclude = Array.isArray(query.exclude)
      ? query.exclude
      : [query.exclude];
    queryDoc["foundBy"] = { $nin: exclude };
  }
  debug("Finding geocaches based on \n%O\nbuilt from %o", queryDoc, query);
  return collection.find(queryDoc);
}

module.exports = find;
