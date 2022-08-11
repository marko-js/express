import type { EventEmitter } from "events";
import type { Request, Response, NextFunction } from "express";

// newer versions of `@types/express`
declare module "express-serve-static-core" {
  interface Response {
    marko: typeof renderMarkoTemplate;
    flush?: typeof noopThis;
  }
}

// older versions of `@types/express`
declare module "express" {
  interface Response {
    marko: typeof renderMarkoTemplate;
    flush?: typeof noopThis;
  }
}

export default function middleware() {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.marko = renderMarkoTemplate;
    res.redirect = redirectWithMidstreamSupport;
    next();
  };
}

function renderMarkoTemplate<
  I extends Record<string, unknown> & { $global?: Record<string, unknown> },
  T extends { render(input: I, ...args: unknown[]): EventEmitter }
>(this: Response, template: T, input?: I) {
  const $global = { ...this.app.locals, ...this.locals };

  if (input) {
    if (input.$global) {
      Object.assign($global, input.$global);
    }

    input.$global = $global;
  }

  this.set("Content-Type", "text/html; charset=utf-8");
  template
    .render(input || ({ $global } as I), this)
    .on("error", this.req!.next!);
}

function redirectWithMidstreamSupport(
  this: Response,
  status: number,
  redirectUrl: string
): void;
function redirectWithMidstreamSupport(
  this: Response,
  redirectUrl: string,
  status: number
): void;
function redirectWithMidstreamSupport(
  this: Response,
  redirectUrl: string
): void;
function redirectWithMidstreamSupport(
  this: Response,
  p1: string | number,
  p2?: string | number
) {
  const status = typeof p1 === "number" ? p1 : 302;
  const redirectUrl = typeof p1 === "string" ? p1 : (p2 as string);

  if (
    this.headersSent &&
    (this.getHeader("Content-Type") as string | undefined)?.startsWith(
      "text/html"
    )
  ) {
    // already begun response, so we can't redirect with a status code
    // but it is text/html, so we can redirect using <meta> refresh or location.href
    const metaContent = JSON.stringify(`0;url=${redirectUrl}`);
    const locationHref = JSON.stringify(redirectUrl);
    this.write(`
        <meta http-equiv=refresh content=${metaContent}>
        <script>location.href=${locationHref}</script>
    `);

    // ensure the redirect is flushed when compression middleware is used
    if (this.flush) this.flush();

    // prevent any further output
    this.write = noopFalse;
    this.flush = this.end = noopThis;

    // wait for the next tick to ensure content is flushed
    setImmediate(() => {
      // `destroy` instead of `end` so the client knows the response was incomplete
      this.destroy();
    });
  } else {
    // use the default redirect behavior
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    Object.getPrototypeOf(this).redirect.call(this, status, redirectUrl);
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noopThis(this: any) {
  return this;
}

function noopFalse() {
  return false;
}
