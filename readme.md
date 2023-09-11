# Jsb Query Server

When dealing with `JSON`, javascript is our best bet. With that in mind, this project aims to provide a simple and fast
way to query `JSON` data. 
it is the query server where we try all our test queries.

This server is built with [Typescript](https://www.typescriptlang.org/) and [Node.js Http Server](https://nodejs.org/en/).

## Setup

- Clone this repo
- Run `npm install`
- Run `npm start`
- copy `env.example` to `.env` and change the port if you want
- Run `npm run start` to build typescript and start the server

## Endpoints

- `POST /?query={YOUR_QUERY}` - with a body of `{content: "YOUR JSON STRING"}`

## Example

Sending the following json as the `content` in the body of the request `"/query?query=pick-name-email"`, it will pick only the name and email from the json.

```json
{
  "name": "John",
  "age": 30,
  "email": "john_doe@gmail.com"
}
```

will return

```json
{
  "name": "John",
  "email": "john_doe@gmail.com"
}
```

Visit [Jsonbank Documentation](https://api.jsonbank.io) for more information on how to use the query server.


### Body Limit
This server permits only 2mb of data to be sent as the body of the request.