import type { AddressInfo } from "net";
import type { Express } from "express";
import express from "express";
import fetch from "node-fetch";
import markoMiddleware from "../index";
import SimpleTemplate from "./fixtures/simple.marko";
import DynamicTemplate from "./fixtures/dynamic.marko";
import GlobalsTemplate from "./fixtures/globals.marko";
import ErrorTemplate from "./fixtures/error.marko";

test("Simple Template", async () => {
  const { res, html } = await fetchHtml(
    express()
      .use(markoMiddleware())
      .use((req, res) => {
        res.marko(SimpleTemplate);
      })
  );

  expect(res.status).toMatchInlineSnapshot(`200`);
  expect(res.headers.get("content-type")).toMatchInlineSnapshot(
    `"text/html; charset=utf-8"`
  );
  expect(res.headers.get("transfer-encoding")).toMatchInlineSnapshot(
    `"chunked"`
  );
  expect(html).toMatchInlineSnapshot(`"<div>Hello world</div>"`);
});

test("Dynamic Template", async () => {
  const { res, html } = await fetchHtml(
    express()
      .use(markoMiddleware())
      .use((req, res) => {
        res.marko(DynamicTemplate, { name: "Dylan" });
      })
  );

  expect(res.status).toMatchInlineSnapshot(`200`);
  expect(res.headers.get("content-type")).toMatchInlineSnapshot(
    `"text/html; charset=utf-8"`
  );
  expect(res.headers.get("transfer-encoding")).toMatchInlineSnapshot(
    `"chunked"`
  );
  expect(html).toMatchInlineSnapshot(`"<div>Hello Dylan</div>"`);
});

test("Globals Template", async () => {
  const { res, html } = await fetchHtml(
    express()
      .use(markoMiddleware())
      .use((req, res) => {
        res.locals.greeting = "Goodbye";
        res.marko(GlobalsTemplate, { $global: { name: "Michael" } });
      })
  );

  expect(res.status).toMatchInlineSnapshot(`200`);
  expect(res.headers.get("content-type")).toMatchInlineSnapshot(
    `"text/html; charset=utf-8"`
  );
  expect(res.headers.get("transfer-encoding")).toMatchInlineSnapshot(
    `"chunked"`
  );
  expect(html).toMatchInlineSnapshot(`"<div>Goodbye Michael</div>"`);
});

test("Error In Template", async () => {
  const { res, html } = await fetchHtml(
    express()
      .use(markoMiddleware())
      .use((req, res) => {
        res.marko(ErrorTemplate);
      })
      .use(
        (
          err: Error,
          req: express.Request,
          res: express.Response,
          next: () => void
        ) => {
          expect(err.message).toMatchInlineSnapshot(`"fail"`);
          res.status(500).send("Something broke!");
          next();
        }
      )
  );

  expect(res.status).toMatchInlineSnapshot(`500`);
  expect(html).toMatchInlineSnapshot(`"Something broke!"`);
});

async function fetchHtml(app: Express) {
  const server = app.listen();
  await new Promise(resolve => server.once("listening", resolve));
  const res = await fetch(
    `http://localhost:${(server.address() as AddressInfo).port}`
  );
  const html = await res.text();
  await new Promise(resolve => server.close(resolve));
  return { res, html };
}
