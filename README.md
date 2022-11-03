<h1 align="center">
  <!-- Logo -->
  <br/>
  @marko/express
	<br/>

  <!-- Language -->
  <a href="http://typescriptlang.org">
    <img src="https://img.shields.io/badge/%3C%2F%3E-typescript-blue.svg" alt="TypeScript"/>
  </a>
  <!-- Format -->
  <a href="https://github.com/prettier/prettier">
    <img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg" alt="Styled with prettier"/>
  </a>
  <!-- CI -->
  <a href="https://github.com/marko-js/express/actions/workflows/ci.yml">
    <img src="https://github.com/marko-js/express/actions/workflows/ci.yml/badge.svg" alt="Build status"/>
  </a>
  <!-- Coverage -->
  <a href="https://codecov.io/gh/marko-js/express">
    <img src="https://codecov.io/gh/marko-js/express/branch/main/graph/badge.svg?token=KWZ4YNTZVY"/>
  </a>
  <!-- NPM Version -->
  <a href="https://npmjs.org/package/@marko/express">
    <img src="https://img.shields.io/npm/v/@marko/express.svg" alt="NPM Version"/>
  </a>
  <!-- Downloads -->
  <a href="https://npmjs.org/package/@marko/express">
    <img src="https://img.shields.io/npm/dm/@marko/express.svg" alt="Downloads"/>
  </a>
</h1>

Render [Marko](https://markojs.com/) templates in an [`express`](http://expressjs.com/) application.

# Installation

```console
npm install @marko/express
```

# Examples

## Setup

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

## $global / out.global

When calling `res.marko` the [`input.$global`](https://markojs.com/docs/rendering/#global-data) is automatically merged with [`app.locals`](http://expressjs.com/en/5x/api.html#app.locals) and [`res.locals`](http://expressjs.com/en/5x/api.html#res.locals) from [`express`](http://expressjs.com/). This makes it easy to set some global data via express middleware, eg:

_middleware.js_

```js
export default (req, res, next) => {
  res.locals.locale = "en-US";
};
```

Then later in a template access via:

```marko
<div>${out.global.locale}</div>
```

## Redirects

Allows `res.redirect` to redirect HTML responses that have already begun sending content. This is done by flushing a `<meta>` tag redirect with a `<script>` fallback before prematurely ending the response.

If `$global` includes a `cspNonce` it will be included in the redirect script.

```js
app.get("/", (req, res) => {
  res.marko(Template, { $global: { cspNonce: "xyz" } });

  // If a redirect occurs mid stream we'll see
  // something like the following in the output:
  //
  // <meta http-equiv=refresh content="0;url=...">
  // <script nonce="xyz">location.href="..."></script>
});
```

# Code of Conduct

This project adheres to the [eBay Code of Conduct](./.github/CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
