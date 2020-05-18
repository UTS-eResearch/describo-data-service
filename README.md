# Describo Data Service

This is a library to manage an sqlite database of data for describo to use in
lookups.

# Use this in your code

```
npm install --save UTS-eResearch/describo-data-service sqlite3
```

# Tests

The Jest testing framework is used and it comes with built in assertions - see docs @ https://jestjs.io/docs/en/expect.

Run the tests:

> npm run test

Develop the tests (run the tests in watch mode):

> npm run test:watch

# API

The API is simple.

## Get the Database class

```
const { Database } = require("describo-data-service");
```

## Connect

### Default: SQLite

Connect to an sqlite database by specifying the path to the sqlite database file.
If it doesn't exist it will be created.

```
const databaseFile = '/path/to/sqlite/database.file'
const database = new Database({ databaseFile });
await database.connect()
```

Database now available

### Connecting to another database

The library can be configured to talk to a standalone database. Just pass a config object
instead of the database file. It will be something like:

```
const config = {
    database: 'name of the database',
    username: 'username to connect with',
    password: 'password to us',
    host: 'the database server IP / FQDN',
    dialect: 'one of mysql, postgres, or mssql',
    logging: true || false - turns SQL statement logging on or off
}
const database = new Database({ config });
await database.connect()
```

## Load data

Data can be loaded from a local file or a URL. See the section
[Data Pack Structure](#data-pack-structure) for the required structure.

1. The data will be bulk loaded in lots of 10 but you can change that chunk size if required.
2. By default, reloading data from a source will first remove all of the data in the store from the last load of that source. Consider when the data being loaded changes @id. In that case you can end up with multiple copies of the data - the data with the original @id and the data with the new @id. This behavious can be disabled by providing the flag `deleteOnReload = false` when loading the data.

### from file

```
// With default chunk size of 10.
const file = '/path/to/data/pack.file'
await database.load({ file })

// With a loading chunk size of 100.
await database.load({ file, chunkSize: 100 })
```

You can load a data pack again - the data will be updated.

### from a URL

```
// chunk size of 10 and deleteOnReload: true (by default)
const url = 'https://path/to/data/pack.file'
await database.load({ url })

// chunk size of 10 and deleteOnReload: false
await database.load({ url, deleteOnReload: false })
```

You can load a data pack again - the data will be updated.

### Get the types in the database

```
let results = await database.getTypes();
> [ 'Person', 'Product', ...]
```

## Query the data

-   All queries `require the @type` property to be defined;
-   The query method does a `like` query for anything that is provided - `%{your string}%` - so it's
    aggresive in its matching;
-   By default 10 results are returned but this is configurable in your query;
-   By default, an `OR` query is conducted when specifying multiple query params. In this case the query will be `@type = {type} AND (name = %{query}% OR description = %{query}% OR @id = %{query}%)`.
-   The query can be set to `AND`. In this case the query will be `@type = {type} AND name = %{query}% AND description = %{query}% AND @id = %{query}%)`.

### query for @id

```
let results = await database.query({ "@type": "Person", "@id": 1 });
```

### query for @id: return 20 results instead of 10

```
results = await database.query({ "@type": "Person", "@id": 1, limit: 20});
```

### query for @type

```
results = await database.query({ "@type": "Product" });
```

### query for substring match on name

```
results = await database.query({ "@type": "Person", name: "esc" });
```

### query for substring match on description

```
results = await database.query({ "@type": "Person", description: "awesome" });
```

### querying on multiple fields is supported

1. `OR` query.

```
results = await database.query({ '@type': 'Product', description: "awesome", name: 'something' });
```

2. `AND` query:

```
results = await database.query({ queryType: 'AND', '@type': 'Product', description: "awesome" });

```

### Example result from query

```

[{
id: 'fe5ae24e-b147-4fea-b1b9-6c33b70ab1e1',
'@id': '1',
'@type': 'Product',
name: 'describo',
description: 'an awesome tool!'
}]

```

## Retrieve the data blob for a given identifier

```

result = await database.get({ "@id": '1' });

// returns a structure like:
{ '@id': '1', '@type': 'Product', name: 'describo' }

```

stopper-garage-trace-infer

# Data Pack Structure

The data pack structure is quite simple. Think of it as a way to search for some content and get
back a JSON blob to inject into the graph.

The data structure is as follows:

```

[
{
'@id': { unique identifier for this item - REQUIRED },
'@type': { the type of the item - REQUIRED },
name: { the name of the item - REQUIRED},
description: { a description of the item - OPTIONAL},
property1: some value,
property2: some value,
...
}

]

```

Things to note:

-   it must be an array of objects;
-   `@id`, `@type` and `name` are required for each entry;
-   you can have anything else in the entry;
-   @id is a unique property in the database so ensure that the data pack has sensible, domain specific, unique identifiers.

```

```
