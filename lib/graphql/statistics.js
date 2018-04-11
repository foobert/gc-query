const debug = require("debug")("gc:query:graphql:statistics");

const types = `
  type Statistics {
    areas: [AreaStatistics],
    geocaches: GeocacheStatistics
  }

  type AreaStatistics {
    name: String,
    geocacheCount: Int,
    lastUpdate: String
  }

  type GeocacheStatistics {
    count: Int,
    slices(minAge: Int): [GeocacheAgeSlice!]
  }

  type GeocacheAgeSlice {
    days: Int,
    count: Int
  }
`;

const resolvers = {
  Query: {
    stats: (obj, args, { areas }) => {
      debug("Resolve stats");
      return {
        areas: async () => await areas.find({}).toArray(),
        geocaches: {}
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
    slices: async (obj, args, { gcs }) => {
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
      stages.push({ $sort: { _id: -1 } });

      return await gcs.aggregate(stages).toArray();
    }
  },
  GeocacheAgeSlice: {
    days: obj => obj._id
  }
};

module.exports = { types, resolvers };
