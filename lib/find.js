const assert = require("assert");
const debug = require("debug")("gc:rest:find");
const { daysAgo } = require("./util");
const MongoPaging = require("mongo-cursor-pagination");

function find(collection, query) {
  const queryDoc = buildQueryDoc(query);
  debug("Finding geocaches based on \n%O\nbuilt from %o", queryDoc, query);
  debug("db.getCollection('gcs').find(%s)", JSON.stringify(queryDoc));
  return collection.find(queryDoc, {
    projection: {
      parsed: 1,
      api_date: 1,
      discover_date: 1,
      parsed_date: 1,
      coord: 1
    }
  });
}

function findPagination(collection, query) {
  const queryDoc = buildQueryDoc(query);
  debug(
    "Finding paginated geocaches based on \n%O\nbuilt from %o",
    queryDoc,
    query
  );
  debug("db.getCollection('gcs').find(%s)", JSON.stringify(queryDoc));
  return MongoPaging.find(collection, {
    query: queryDoc,
    limit: query.limit,
    next: query.after
  });
}

function buildQueryDoc(query) {
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
    filter(query.bbox, filterBoundingBox),
    filter(query.age, filterFetchAge),
    filter(query.quadkey, filterQuadKey)
  ];
  for (const f of filters) {
    Object.assign(queryDoc, f);
  }
  return queryDoc;
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
  const ex = Array.isArray(exclude) ? exclude : [exclude];
  return {
    foundBy: { $nin: ex },
    "parsed.owner": { $nin: ex }
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

function filterFetchAge(age) {
  if (age <= 0) {
    return {};
  }

  return {
    api_date: { $gt: daysAgo(age) }
  };
}

function filterQuadKey(quadKey) {
  return {
    "parsed.quadKey": { $regex: new RegExp("^" + quadKey.substring(0, 15)) }
  };
}

module.exports = { find, findPagination };
