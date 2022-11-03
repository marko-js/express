import type { Response } from "express";
import { ServerResponse } from "http";

export function createRedirectWithMidstreamSupportFn({ cspNonce }: { cspNonce?: string; } = {}) {
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
    const nonce = cspNonce ? ` nonce="${cspNonce}"` : '';

    if (
      this.headersSent &&
      (this.getHeader("Content-Type") as string | undefined)?.startsWith(
        "text/html"
      )
    ) {

      // already begun response, so we can't redirect with a status code
      // but it is text/html, so we can redirect using <meta> refresh or location.href
      // and destroy the stream once the response is flushed
      (this as any)[onWriteFlush] = this.destroy;
      this.write(`
        <meta http-equiv=refresh content=${JSON.stringify(
          `0;url=${redirectUrl}`
        )}>
        <script${nonce}>location.href=${JSON.stringify(redirectUrl)}</script>
      `);

      // special case: compression
      // ensure the redirect is flushed when compression middleware is used
      if (this.flush) this.flush();

      // prevent any further output
      this.write = noopTrue;
      this.flush = this.end = noopThis;
    } else {
      // use the default redirect behavior
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      Object.getPrototypeOf(this).redirect.call(this, status, redirectUrl);
    }
  }

  return redirectWithMidstreamSupport;
}

export const redirectWithMidstreamSupport = createRedirectWithMidstreamSupportFn();

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noopThis(this: any) {
  return this;
}

function noopTrue() {
  return true;
}

// we want to know when the write is flushed
// but monkeypatching is so common in the express ecosystem that we can't rely on the callback
// specifically, compression middleware omits the callback
const _write = ServerResponse.prototype.write;
const onWriteFlush = Symbol("on-flush");
ServerResponse.prototype.write = function (
  this: any,
  data: any,
  encoding: any,
  callback: any
) {
  if (!this[onWriteFlush]) return _write.call(this, data, encoding, callback);

  if (typeof encoding === "function") {
    callback = encoding;
    encoding = "utf8";
  }

  return _write.call(this, data, encoding, () => {
    this[onWriteFlush]();
    callback?.();
  });
} as any;
