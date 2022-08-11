import type { AddressInfo } from "net";
import type { Express } from "express";
import express from "express";
import fetch, { Response } from "node-fetch";
import markoMiddleware from "../index";
import SimpleTemplate from "./fixtures/simple.marko";
import DynamicTemplate from "./fixtures/dynamic.marko";
import GlobalsTemplate from "./fixtures/globals.marko";
import ErrorTemplate from "./fixtures/error.marko";
import AsyncTemplate from "./fixtures/async.marko";

test("Simple Template", async () => {
  const { res, html } = await fetchHtml(
    express()
      .use(markoMiddleware())
      .use((_req, res) => {
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
      .use((_req, res) => {
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
      .use((_req, res) => {
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
      .use((_req, res) => {
        res.marko(ErrorTemplate);
      })
      .use(
        (
          err: Error,
          _req: express.Request,
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

test("302 Redirect", async () => {
  const { res, html } = await fetchHtml(
    express()
      .use(markoMiddleware())
      .use((req, res) => {
        if (req.url === "/error.html") {
          return res.end("Something broke!");
        }
        res.redirect("/error.html");
      })
  );

  expect(res.status).toMatchInlineSnapshot(`200`);
  expect(html).toMatchInlineSnapshot(`"Something broke!"`);
});

test("301 Redirect", async () => {
  const { res, html } = await fetchHtml(
    express()
      .use(markoMiddleware())
      .use((req, res) => {
        if (req.url === "/error.html") {
          return res.end("Something broke!");
        }
        res.redirect(301, "/error.html");
      })
  );

  expect(res.status).toMatchInlineSnapshot(`200`);
  expect(html).toMatchInlineSnapshot(`"Something broke!"`);
});

test("Midstream Redirect, HTML", async () => {
  const { res, html } = await fetchHtml(
    express()
      .use(markoMiddleware())
      .use((req, res) => {
        if (req.url === "/login.html") {
          return res.end("You need to login!");
        }

        const promise = new Promise((resolve) => {
          setTimeout(() => {
            res.redirect("/login.html");
            resolve("hello");
          }, 50);
        });

        res.marko(AsyncTemplate, { promise });
      })
  );

  expect(res.status).toMatchInlineSnapshot(`200`);
  expect(html).toMatchInlineSnapshot(`"You need to login!"`);
});

test("Midstream Redirect, Error", async () => {
  const { res, html } = await fetchHtml(
    express()
      .use(markoMiddleware())
      .use((_req, res) => {
        res.write("Hello ");

        setTimeout(() => {
          try {
            res.redirect("/login.html");
          } catch (e) {
            res.end((e as Error).message);
          }
        }, 50);
      })
  );

  expect(res.status).toMatchInlineSnapshot(`200`);
  expect(html).toMatchInlineSnapshot(
    `"Hello Cannot set headers after they are sent to the client"`
  );
});

const redirectPattern = /location\.href="([^"]+)"/;

async function fetchHtml(app: Express) {
  const server = app.listen();
  await new Promise((resolve) => server.once("listening", resolve));
  const result = await fetchHelper(server, "/");
  await new Promise((resolve) => server.close(resolve));
  return result;
}

async function fetchHelper(
  server: ReturnType<Express["listen"]>,
  path: string
): Promise<{ res: Response; html: string }> {
  const res = await fetch(
    `http://localhost:${(server.address() as AddressInfo).port}${path}`
  );

  let html = "";

  for await (const chunk of res.body!) {
    const match = redirectPattern.exec(chunk.toString());
    if (match) {
      return fetchHelper(server, match[1]);
    }
    html += chunk;
  }

  return { res, html };
}
