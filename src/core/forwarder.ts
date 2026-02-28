import { IncomingMessage, ServerResponse, request as httpRequest } from "http";
import { RouteRepository } from "./repositories/route-repository";
import { Url } from "url";

class Forwarder {
  private routeRepository: RouteRepository;

  constructor(routeRepository: RouteRepository) {
    this.routeRepository = routeRepository;
  }

  /**
   * Handles incoming HTTP requests and forwards them to the appropriate upstream server based on routing rules.
   *
   * - Finds the target server for the incoming request URL using the route repository.
   * - Forwards the request, including headers and body, to the upstream server.
   * - Sets appropriate X-Forwarded headers to preserve client information.
   * - Handles errors and returns appropriate HTTP status codes.
   *
   * @param req Incoming HTTP request from the client.
   * @param res HTTP response object to send data back to the client.
   */
  public handleRequest(req: IncomingMessage, res: ServerResponse) {
    const target = req.url ? this.findTarget(req.url) : null;

    if (!target) {
      res.writeHead(404).end("Not Found");
      return;
    }

    const targetUrl = new URL(target);

    //checking incase there is a proxy in between
    // Should append, not replace
    const existing = req.headers["x-forwarded-for"];
    const clientIP = existing
      ? `${existing}, ${req.socket.remoteAddress}`
      : req.socket.remoteAddress;

    const options = {
      hostname: targetUrl.hostname, // "localhost"
      port: targetUrl.port || 80, // "8000"
      path: req.url, // "/api/users" — preserve original path
      method: req.method, // "GET", "POST" etc
      headers: {
        ...req.headers, // pass all original headers through
        host: targetUrl.host,
        "X-Forwarded-For": clientIP, // who made the original request
        "X-Forwarded-Host": req.headers.host ?? "", // original host header
        "X-Forwarded-Proto": "http", // protocol used by client
      },
    };

    //open connection to upstream server
    const proxyReq = httpRequest(options, (proxyRes) => {
      //send headers to the browser
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      //send the stream
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.setTimeout(5000, () => {
      proxyReq.destroy();
      if (!res.headersSent) res.writeHead(504).end("Gateway Timeout");
    });

    proxyReq.on("error", (err) => {
      console.error(`Upstream error: ${err.message}`);
      if (!res.headersSent) {
        res.writeHead(502).end("Bad Gateway");
      }
    });

    // pipe the incoming request body to the upstream request
    // critical for POST/PUT — this is where the body gets forwarded
    req.pipe(proxyReq, { end: true });

    req.on("error", (err) => {
      console.error(`Client aborted: ${err.message}`);
      proxyReq.destroy();
    });
  }

  private findTarget(url: string) {
    return this.routeRepository.findByPath(url);
  }
}
