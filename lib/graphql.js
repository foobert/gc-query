const debug = require("debug")("gc:rest:graphql");
const bodyParser = require("body-parser");
const { graphqlExpress } = require("apollo-server-express");
const { makeExecutableSchema } = require("graphql-tools");
const { GraphQLScalarType } = require("graphql");

const find = require("./find");

const typeDefs = `
  type Query {
    geocaches(bbox: [Float!], type: Type, exclude: [String], disabled: Boolean, score: Float): [Geocache]
  }

  scalar Coordinates

  type PointGeometry {
    type: String!
    coordinates: Coordinates!
  }
  type PointProps {
    id: Int!
    lat: Float
    lon: Float
  }
  type PointObject {
    type: String!
    geometry: PointGeometry
    properties: PointProps
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
`;

const resolvers = {
  Query: {
    geocaches: async (obj, args) => {
      debug("Resolve geocaches: %o", args);
      const gcs = obj.collection("gcs");
      const docs = await find(gcs, args).toArray();
      debug("Resolved %d geocaches", docs.length);
      return docs;
    }
  },
  Geocache: {
    id: obj => obj._id
  },
  GeocacheParsed: {
    // need to fix the size because GraphQL doesn't like "not-chosen" as value
    size: obj => obj.size && obj.size.replace("-", "")
  },
  Coordinates: new GraphQLScalarType({
    name: "Coordinates",
    description: "A set of coordinates. x, y",
    parseValue(value) {
      return value;
    },
    serialize(value) {
      return value;
    },
    parseLiteral(ast) {
      return ast.value;
    }
  })
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

module.exports = db => {
  return [bodyParser.json(), graphqlExpress({ schema, rootValue: db })];
};
