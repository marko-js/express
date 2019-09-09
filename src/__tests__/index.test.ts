import type { AddressInfo } from "net";
import type { Express } from "express";
import express from "express";
import fetch from "node-fetch";
import markoMiddleware from "../index";
import SimpleTemplate from "./fixtures/simple.marko";
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
          next: unknown
        ) => {
          expect(
            err.message && err.message.slice(0, err.message.indexOf("\n"))
          ).toMatchInlineSnapshot(`"Error: fail"`);
          res.status(500).send("Something broke!");
        }
      )
  );

  expect(res.status).toMatchInlineSnapshot(`500`);
  expect(html).toMatchInlineSnapshot(`"Something broke!"`);
});

async function fetchHtml(app: Express) {
  const server = app.listen();
  await new Promise((resolve) => server.once("listening", resolve));
  const res = await fetch(
    `http://localhost:${(server.address() as AddressInfo).port}`
  );
  const html = await res.text();
  await new Promise((resolve) => server.close(resolve));
  return { res, html };
}
