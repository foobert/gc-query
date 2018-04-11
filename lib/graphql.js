const debug = require("debug")("gc:rest:graphql");
const bodyParser = require("body-parser");
const { graphqlExpress } = require("apollo-server-express");
const { makeExecutableSchema } = require("graphql-tools");

const find = require("./find");

const typeDefs = `
  type Query {
    geocaches(bbox: [Float!], type: Type, exclude: [String], disabled: Boolean, score: Float): [Geocache],
    stats: Statistics
  }

  type Geocache {
    id: ID!,
    gc: String!,
    parsed: GeocacheParsed,
    parsed_date: String
  }

  type GeocacheParsed {
    name: String,
    lat: Float,
    lon: Float,
    difficulty: Float,
    terrain: Float,
    size: Size,
    hint: String,
    type: Type,
    disabled: Boolean,
    foundScore: Float,
    premium: Boolean
  }

  enum Size {
    micro
    small
    regular
    large
    other
    virtual
    notchosen
  }

  enum Type {
    traditional
    multi
    event
    earth
    wherigo
    mystery
    virtual
    letterbox
    cito
  }

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
    geocaches: async (obj, args, { gcs }) => {
      debug("Resolve geocaches: %o", args);
      const docs = await find(gcs, args).toArray();
      debug("Resolved %d geocaches", docs.length);
      return docs;
    },
    stats: (obj, args, { areas }) => {
      debug("Resolve stats");
      return {
        areas: async () => await areas.find({}).toArray()
      };
    }
  },
  Geocache: {
    id: obj => obj._id
  },
  GeocacheParsed: {
    // need to fix the size because GraphQL doesn't like "not-chosen" as value
    size: obj => obj.size && obj.size.replace("-", "")
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

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

module.exports = db => {
  return [
    bodyParser.json(),
    graphqlExpress({
      schema,
      rootValue: db,
      context: { db, gcs: db.collection("gcs"), areas: db.collection("areas") }
    })
  ];
};
