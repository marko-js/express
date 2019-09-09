import type { EventEmitter } from "events";
import type { Request, Response, NextFunction } from "express";

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
  return (req: Request, res: Response, next: NextFunction): void => {
    res.marko = res.marko || renderMarkoTemplate;
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .on("error", this.req!.next!);
}
