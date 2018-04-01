const assert = require("assert");
const debug = require("debug")("gc:rest:find");

function find(collection, query) {
  let queryDoc = {
    coord: { $exists: true },
    parsed: { $exists: true },
    "parsed.premium": false,
    // don't find disabled geocaches by default
    "parsed.disabled": false
  };
  const filters = [
    filter(query.type, filterType),
    filter(query.disabled, filterDisabled),
    filter(query.score, filterScore),
    filter(query.exclude, filterExclude),
    filter(query.bbox, filterBoundingBox)
  ];
  for (const f of filters) {
    Object.assign(queryDoc, f);
  }
  debug("Finding geocaches based on \n%O\nbuilt from %o", queryDoc, query);
  return collection.find(queryDoc);
}

function filter(value, map) {
  return typeof value !== "undefined" ? map(value) : null;
}

function filterType(type) {
  return { "parsed.type": type };
}

function filterDisabled(disabled) {
  return { "parsed.disabled": disabled == "1" };
}
function filterScore(score) {
  return { "parsed.foundScore": { $gt: parseFloat(score) } };
}

function filterExclude(exclude) {
  return {
    foundBy: { $nin: Array.isArray(exclude) ? exclude : [exclude] }
  };
}

function filterBoundingBox(bbox) {
  assert.equal(4, bbox.length);
  const left = Math.min(bbox[0], bbox[2]);
  const right = Math.max(bbox[0], bbox[2]);
  const top = Math.max(bbox[1], bbox[3]);
  const bottom = Math.min(bbox[1], bbox[3]);

  return {
    coord: {
      $geoWithin: {
        $geometry: {
          type: "Polygon",
          coordinates: [
            [
              [left, top],
              [right, top],
              [right, bottom],
              [left, bottom],
              [left, top]
            ]
          ]
        }
      }
    }
  };
}

module.exports = find;
