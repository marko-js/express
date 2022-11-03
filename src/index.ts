import type { EventEmitter } from "events";
import type { Request, Response, NextFunction } from "express";
import { createRedirectWithMidstreamSupportFn, redirectWithMidstreamSupport } from "./redirect";

// newer versions of `@types/express`
declare module "express-serve-static-core" {
  interface Response {
    marko: typeof renderMarkoTemplate;
  }
}

// older versions of `@types/express`
declare module "express" {
  interface Response {
    marko: typeof renderMarkoTemplate;
  }
}

export default function middleware() {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.marko = renderMarkoTemplate;
    // We don't have a handle to the cspNonce, if any so we start with
    // a default function which may generate a script with no nonce attr
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

  if ($global.cspNonce) {
    // However, if a nonce is given, we'll create a new redirect fn w/ nonce
    // This is a bit awkward, but we don't otherwise have a handle to $global
    this.redirect = createRedirectWithMidstreamSupportFn($global);
  }

  this.set("Content-Type", "text/html; charset=utf-8");
  template
    .render(input || ({ $global } as I), this)
    .on("error", this.req!.next!);
}
