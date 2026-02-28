import { IncomingMessage, ServerResponse , request as httpRequest } from "http";
import { RouteRepository } from "./repositories/route-repository";
import { Url } from "url";


class Forwarder {
  private routeRepository: RouteRepository;

  constructor(routeRepository: RouteRepository) {
    this.routeRepository = routeRepository;
  }


  public handleRequest(req: IncomingMessage, res: ServerResponse) {
    const target = req.url ? this.findTarget(req.url) : null;

    if (!target) {
      res.writeHead(404).end("Not Found");
      return;
    }

    const targetUrl = new URL(target)

    //checking incase there is a proxy in between 
    const clientIP = req.headers["x-forwarded-for"] as string
      ?? req.socket.remoteAddress
      ?? "unknown";


    const options = {
    hostname: targetUrl.hostname,          // "localhost"
    port: targetUrl.port || 80,            // "8000"
    path: req.url,                         // "/api/users" — preserve original path
    method: req.method,                    // "GET", "POST" etc
    headers: {
      ...req.headers,                      // pass all original headers through
      "X-Forwarded-For": clientIP,         // who made the original request
      "X-Forwarded-Host": req.headers.host ?? "",  // original host header
      "X-Forwarded-Proto": "http",         // protocol used by client
    }
  };

  //open connection to upstream server 
  const proxyReq = httpRequest(options, (proxyRes) => {
      //send headers to the browser
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      //send the stream 
      proxyRes.pipe(res , {end: true});

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
    

  }


  private findTarget(url: string) {
    return this.routeRepository.findByPath(url);
  }
}

