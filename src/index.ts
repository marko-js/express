import type { EventEmitter } from "events";
import type { Request, Response, NextFunction } from "express";
import { redirectWithMidstreamSupport } from "./redirect";

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
