const debug = require("debug")("gc:query:graphql:geocache");
const { gql } = require("apollo-server-express");
const { find, findPagination } = require("../find");
const { formatDate } = require("../util");
const metrics = require("../metrics");

const types = gql`
  type GeocachePage {
    nodes: [Geocache!]
    next: String
    hasNext: Boolean
    totalCount: Int
  }

  type Geocache {
    id: ID!
    gc: String!
    parsed: GeocacheParsed
    parsed_date: String
    discover_date: String
    api_date: String
  }

  type GeocacheParsed {
    name: String
    lat: Float
    lon: Float
    difficulty: Float
    terrain: Float
    size: Size
    hint: String
    type: Type
    disabled: Boolean
    foundScore: Float
    premium: Boolean
    favpoints: Int
    attributes: [Attribute]
    waypoints: [Waypoint]
  }

  # additional waypoints
  type Waypoint {
    name: String
    lat: Float
    lon: Float
    comment: String
  }

  type Attribute {
    id: String
    active: Boolean
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
    webcam
  }
`;

const resolvers = {
  Query: {
    geocaches: async (obj, args, { gcs }) => {
      debug("Resolve geocaches: %o", args);
      if (!args.limit && !args.after) {
        // be downwards compatible for now
        const docs = await metrics.meassure("find", find(gcs, args).toArray());
        debug("Resolved %d geocaches", docs.length);
        return {
          nodes: docs,
          hasNext: false,
          totalCount: docs.length
        };
      } else {
        const result = await metrics.meassure(
          "find",
          findPagination(gcs, args)
        );
        return {
          nodes: result.results,
          hasNext: result.hasNext,
          next: result.next,
          // compute total lazily
          totalCount: () => find(gcs, args).count()
        };
      }
    }
  },
  Geocache: {
    id: obj => obj._id,
    gc: obj => obj._id,
    discover_date: obj => formatDate(obj.discover_date),
    api_date: obj => formatDate(obj.api_date),
    parsed_date: obj => formatDate(obj.parsed_date)
  },
  GeocacheParsed: {
    // need to fix the size because GraphQL doesn't like "not-chosen" as value
    size: obj => obj.size && obj.size.replace("-", ""),
    attributes: obj =>
      Object.entries(obj.attributes).map(([k, v]) => ({ id: k, active: v }))
  }
};

module.exports = { types, resolvers };
