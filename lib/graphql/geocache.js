const debug = require("debug")("gc:query:graphql:geocache");
const find = require("../find");

const types = `
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
    geocaches: async (obj, args, { gcs }) => {
      debug("Resolve geocaches: %o", args);
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
  }
};

module.exports = { types, resolvers };
