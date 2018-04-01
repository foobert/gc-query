const debug = require("debug")("gc:rest:graphql");
const bodyParser = require("body-parser");
const { graphqlExpress } = require("apollo-server-express");
const { makeExecutableSchema } = require("graphql-tools");

const typeDefs = `
  type Query {
    geocaches(bbox: BoundingBox): [Geocache]
  }
  input BoundingBox {
    topLeft: LatLon!,
    bottomRight: LatLon!
  }
  input LatLon {
    lat: Float!,
    lon: Float!
  }
  type Geocache {
    gc: String!,
    parsed: GeocacheParsed,
    coord: Coordinate,
  }
  type GeocacheParsed {
    name: String,
    difficulty: Float!,
    terrain: Float!,
    size: Size!,
    hint: String,
    type: Type!,
    disabled: Boolean!,
    foundScore: Float,
    premium: Boolean!
  }
  type Coordinate {
    coordinates: [Float]
  }
  enum Size {
    small
  }
  enum Type {
    traditional
  }
`;

const resolvers = {
  Query: {
    geocaches: (obj, args, context) => {
      debug("RESOLVE %O", args);
      return context.gcs
        .find({}, { gc: 1, parsed: 1, coord: 1 })
        .limit(100)
        .toArray();
    }
  }
};

// Put together a schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

module.exports = context => {
  return [bodyParser.json(), graphqlExpress({ schema, context })];
};
