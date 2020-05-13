# Describo Data Service

This is a library to manage an sqlite database of data for describo to use in
lookups.

-   [Describo Data Service](#describo-data-service)
-   [Use this in your code](#use-this-in-your-code)
-   [Tests](#tests)
-   [API](#api)
    -   [Get the Database class](#get-the-database-class)
    -   [Connect](#connect)
    -   [Load data](#load-data)
        -   [from file](#from-file)
        -   [from a URL](#from-a-url)
    -   [Query the data](#query-the-data)
        -   [query for @id](#query-for-id)
        -   [query for @id: return 20 results instead of 10](#query-for-id-return-20-results-instead-of-10)
        -   [query for @type](#query-for-type)
        -   [query for substring match on name](#query-for-substring-match-on-name)
        -   [query for substring match on description](#query-for-substring-match-on-description)
        -   [querying on multiple fields also supported](#querying-on-multiple-fields-also-supported)
    -   [Retrieve the data blob for a given identifier](#retrieve-the-data-blob-for-a-given-identifier)
-   [Data Pack Structure](#data-pack-structure)

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

Connect to the database by specifying the path to the sqlite file.
If it doesn't exist it will be created.

```
const databaseFile = '/path/to/sqlite/database.file'
const database = new Database({ databaseFile });
await database.connect()
```

Database now available

## Load data

Data can be loaded from a local file or a URL. See the section
[Data Pack Structure](#data-pack-structure) for the required structure.

The data will be bulk loaded in lots of 10 but you can change that chunk size if required.

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
const url = 'https://path/to/data/pack.file'
await database.load({ url })
```

You can load a data pack again - the data will be updated.

## Query the data

The query method does a `like` query for anything that is provided - %{your string}% - so it's
aggresive in its matching. By default 10 results are returned but this is configurable in
your query.

### query for @id

```
let results = await database.query({ "@id": 1 });
```

### query for @id: return 20 results instead of 10

```
results = await database.query({ "@id": 1, limit: 20});
```

### query for @type

```
results = await database.query({ "@type": "Product" });
```

### query for substring match on name

```
results = await database.query({ name: "esc" });
```

### query for substring match on description

```
results = await database.query({ description: "awesome" });
```

### querying on multiple fields also supported

```
results = await database.query({ '@type': 'Product', description: "awesome" });
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
