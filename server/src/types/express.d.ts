declare module "express" {
  export type CookieMap = Record<string, string | undefined>;

  export type AuthUser = {
    firebaseUID: string;
    githubUsername: string;
    githubId: number;
    accessToken?: string;
  };

  export type Request = {
    get(name: string): string | undefined;
    method: string;
    body?: unknown;
    params?: Record<string, string>;
    query?: Record<string, string | string[]>;
    cookies?: CookieMap;
    user?: AuthUser;
  };

  export type Response = {
    header(name: string, value: string): Response;
    json(body: unknown): Response;
    send(body: unknown): Response;
    sendStatus(statusCode: number): Response;
    status(statusCode: number): Response;
    cookie(name: string, value: string, options?: Record<string, unknown>): Response;
    clearCookie(name: string, options?: Record<string, unknown>): Response;
  };

  export type NextFunction = () => void;
  export type RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => unknown;

  export type Router = {
    get(path: string, handler: RequestHandler): void;
    post(path: string, handler: RequestHandler): void;
    use(path: string, handler: RequestHandler): void;
    use(handler: RequestHandler): void;
  };

  type ExpressApp = {
    get(path: string, handler: RequestHandler): void;
    post(path: string, handler: RequestHandler): void;
    listen(port: string | number, callback?: () => void): void;
    use(path: string, handler: RequestHandler): void;
    use(handler: RequestHandler): void;
  };

  type ExpressFactory = {
    (): ExpressApp;
    json(): RequestHandler;
    urlencoded(options?: { extended?: boolean }): RequestHandler;
    Router(): Router;
  };

  const express: ExpressFactory;
  export default express;
}

declare module "cookie-parser" {
  import type { RequestHandler } from "express";

  function cookieParser(): RequestHandler;

  export default cookieParser;
}

declare module "cors" {
  import type { RequestHandler } from "express";

  type CorsOptions = Record<string, unknown>;

  function cors(options?: CorsOptions): RequestHandler;

  export default cors;
}
