import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Socket } from 'node:net';

type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | '*';

const ROUTE_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', '*'];

const normalizeMethod = (value?: string): HttpMethod => {
  const upper = (value ?? 'GET').toUpperCase();
  return (ROUTE_METHODS.includes(upper as HttpMethod) ? (upper as HttpMethod) : 'GET');
};

type Handler = (ctx: {
  req: IncomingMessage;
  res: ServerResponse;
  body: string;
  url: URL;
}) => void | Promise<void>;

type RouteTable = Record<string, Partial<Record<HttpMethod, Handler>>>;

const MAX_BODY_SIZE = 1_000_000; // 1 MB

const readBody = async (req: IncomingMessage): Promise<string> =>
  new Promise((resolve, reject) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      resolve('');
      return;
    }

    const chunks: Buffer[] = [];
    let size = 0;

    req
      .on('data', (chunk) => {
        const bufferChunk = Buffer.from(chunk);
        size += bufferChunk.length;
        if (size > MAX_BODY_SIZE) {
          reject(new Error('mock-server: body too large'));
          req.destroy();
          return;
        }
        chunks.push(bufferChunk);
      })
      .on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
      .on('error', reject);
  });

export type MockServer = {
  url: string;
  port: number;
  close: () => Promise<void>;
};

export const startMockServer = async (routes: RouteTable): Promise<MockServer> => {
  const sockets = new Set<Socket>();
  const server = createServer(async (req, res) => {
    try {
      if (!req.url) {
        res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'missing-url' }));
        return;
      }

      const url = new URL(req.url, 'http://localhost');
      const handlers = routes[url.pathname];
      const method = normalizeMethod(req.method);
      const handler = handlers?.[method] ?? handlers?.['*'];

      if (!handler) {
        res
          .writeHead(404, { 'Content-Type': 'application/json' })
          .end(JSON.stringify({ error: 'not found', path: url.pathname, method }));
        return;
      }

      const body = await readBody(req);
      await handler({ req, res, body, url });
    } catch (error) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' }).end(
          JSON.stringify({
            error: 'mock-server-error',
            details: error instanceof Error ? error.message : 'unknown',
          }),
        );
      } else if (!res.writableEnded) {
        res.end();
      }
    }
  });

  server.on('connection', (socket: Socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });

  await new Promise<void>((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to acquire mock server port');
  }

  const url = `http://127.0.0.1:${address.port}`;

  return {
    url,
    port: address.port,
    close: async () =>
      new Promise<void>((resolve, reject) => {
        sockets.forEach((socket) => socket.destroy());
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      }),
  };
};

export const jsonResponse = (
  res: ServerResponse,
  status: number,
  payload: unknown,
) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

