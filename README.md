<h1 align="center">
  <!-- Logo -->
  <br/>
  @marko/express
	<br/>

  <!-- Stability -->
  <a href="https://nodejs.org/api/documentation.html#documentation_stability_index">
    <img src="https://img.shields.io/badge/stability-stable-brightgreen.svg" alt="API Stability"/>
  </a>
  <!-- Language -->
  <a href="http://typescriptlang.org">
    <img src="https://img.shields.io/badge/%3C%2F%3E-typescript-blue.svg" alt="TypeScript"/>
  </a>
  <!-- Format -->
  <a href="https://github.com/prettier/prettier">
    <img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg" alt="Styled with prettier"/>
  </a>
  <!-- CI -->
  <a href="https://travis-ci.org/marko-js/express">
  <img src="https://img.shields.io/travis/marko-js/express.svg" alt="Build status"/>
  </a>
  <!-- Coverage -->
  <a href="https://coveralls.io/github/marko-js/express">
    <img src="https://img.shields.io/coveralls/marko-js/express.svg" alt="Test Coverage"/>
  </a>
  <!-- NPM Version -->
  <a href="https://npmjs.org/package/@marko/express">
    <img src="https://img.shields.io/npm/v/@marko/express.svg" alt="NPM Version"/>
  </a>
  <!-- Downloads -->
  <a href="https://npmjs.org/package/@marko/express">
    <img src="https://img.shields.io/npm/dm/@marko/express.svg" alt="Downloads"/>
  </a>
  <!-- Size -->
  <a href="https://npmjs.org/package/@marko/express">
    <img src="https://img.shields.io/badge/size-1.21kb-green.svg" alt="Browser Bundle Size"/>
  </a>
</h1>

Render Marko templates in an express application.

# Installation

```console
npm install @marko/express
```

# Example

```javascript
import express from "express";
import markoMiddleware from "@marko/express";
import Template from "./template.marko";

const app = express();

app.use(markoMiddleware());

app.get("/", (req, res) => {
  // Streams Marko template into the response.
  // Forwards errors into expresses error handler.
  res.marko(Template, { hello: "world" });
});
```

## Code of Conduct

This project adheres to the [eBay Code of Conduct](./.github/CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
