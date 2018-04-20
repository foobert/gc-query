const debug = require("debug")("gc:query:graphql:statistics");
const moment = require("moment");

const types = `
  type Statistics {
    areas: [AreaStatistics],
    geocaches: GeocacheStatistics,
    logs: [LogStatistics]
  }

  type AreaStatistics {
    name: String,
    geocacheCount: Int,
    lastUpdate: String
  }

  type GeocacheStatistics {
    count: Int,
    lastUpdate(minAge: Int): [GeocacheLastUpdate!]
  }

  type GeocacheLastUpdate {
    date: String,
    count: Int
  }

  type LogStatistics {
    name: String,
    count: Int,
    lastUpdate: String
  }
`;

const resolvers = {
  Query: {
    stats: (obj, args, { areas, users }) => {
      debug("Resolve stats");
      return {
        areas: async () => await areas.find({}).toArray(),
        geocaches: {},
        logs: async () => await users.find({}).toArray()
      };
    }
  },
  AreaStatistics: {
    geocacheCount: async (doc, args, { gcs }) =>
      await gcs.count({
        coord: {
          $geoWithin: {
            $geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [doc.bbox[0].lon, doc.bbox[0].lat],
                  [doc.bbox[1].lon, doc.bbox[0].lat],
                  [doc.bbox[1].lon, doc.bbox[1].lat],
                  [doc.bbox[0].lon, doc.bbox[1].lat],
                  [doc.bbox[0].lon, doc.bbox[0].lat]
                ]
              ]
            }
          }
        }
      }),
    lastUpdate: doc =>
      doc.discover_date ? doc.discover_date.toISOString() : null
  },
  GeocacheStatistics: {
    count: async (obj, args, { gcs }) => await gcs.count({}),
    lastUpdate: async (obj, args, { gcs }) => {
      let stages = [];
      stages.push({
        $group: {
          _id: {
            $floor: {
              $divide: [{ $subtract: [new Date(), "$api_date"] }, 86400000]
            }
          },
          count: { $sum: 1 }
        }
      });
      if (typeof args.minAge !== "undefined") {
        stages.push({ $match: { _id: { $gte: args.minAge } } });
      }
      stages.push({ $sort: { _id: 1 } });

      return await gcs.aggregate(stages).toArray();
    }
  },
  GeocacheLastUpdate: {
    date: obj =>
      moment()
        .subtract(obj._id, "days")
        .format("YYYY-MM-DD")
  },
  LogStatistics: {
    name: doc =>
      doc._id.replace(/^(..)(.*)$/, (m, p1, p2) => p1 + "*".repeat(p2.length)),
    lastUpdate: doc => (doc.fetch_date ? doc.fetch_date.toISOString() : null),
    count: (doc, args, { gcs }) => gcs.count({ foundBy: doc._id })
  }
};

module.exports = { types, resolvers };
