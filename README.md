# Geocache Query Server

[![Greenkeeper badge](https://badges.greenkeeper.io/foobert/gc-query.svg)](https://greenkeeper.io/)

Serves queries to the geocache database.
(This probably needs a better name)

See the [OpenAPI](openapi.yaml) document for the REST interface description.

### Development

1. Install [mongodb](https://www.mongodb.com/)
2. Install dependencies: `npm install`
3. Start service: `npm start`

### Mongodb 

1. Connect with mongodb: `mongo`
2. Create initial database: `use gc`
3. Add sample: 
```yaml
db.gcs.inserOne(
{
  "_id":"GCTEST",
  "parsed_refresh" : false,
  "coord" : {
    "type" : "Point",
    "coordinates" : [
      -113.36555,
      37.051417
    ]
  },
  "coord_date" : ISODate("2020-01-01T00:00:00.000Z"),
  "parsed" : {
    "name" : "Test Name",
    "lat" : 37.051417,
    "lon" : -113.36555,
    "difficulty" : 1.0,
    "terrain" : 1.0,
    "size" : "micro",
    "hint" : "test Hint",
    "type" : "traditional",
    "disabled" : false,
    "foundScore" : 1.0,
    "owner" : "Test Owner",
    "premium" : false,
    "quadKey" : "0230113321122122",
    "attributes" : {}
  },
  "parsed_date" : ISODate("2020-01-01T00:00:00.000Z")
}
);
```

