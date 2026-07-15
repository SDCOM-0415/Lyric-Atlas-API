import { createServer } from 'node:http';
import { app } from './api/index.ts';

const port = Number(process.env.PORT ?? 3000);

const server = createServer(async (incoming, outgoing) => {
  try {
    const protocol = incoming.headers['x-forwarded-proto'] ?? 'http';
    const host = incoming.headers.host ?? `localhost:${port}`;
    const url = `${protocol}://${host}${incoming.url ?? '/'}`;
    const headers = new Headers();

    for (const [key, value] of Object.entries(incoming.headers)) {
      if (value !== undefined) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
    }

    const request = new Request(url, {
      method: incoming.method,
      headers,
    });
    const response = await app.fetch(request);

    outgoing.statusCode = response.status;
    response.headers.forEach((value, key) => outgoing.setHeader(key, value));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    outgoing.statusCode = 500;
    outgoing.setHeader('content-type', 'application/json');
    outgoing.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }));
  }
});

server.listen(port, '0.0.0.0');
