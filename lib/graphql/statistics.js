const debug = require("debug")("gc:query:graphql:statistics");

const types = `
  type Statistics {
    areas: [AreaStatistics]
  }

  type AreaStatistics {
    name: String,
    geocacheCount: Int,
    lastUpdate: String
  }
`;

const resolvers = {
  Query: {
    stats: (obj, args, { areas }) => {
      debug("Resolve stats");
      return {
        areas: async () => await areas.find({}).toArray()
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
  }
};

module.exports = { types, resolvers };
