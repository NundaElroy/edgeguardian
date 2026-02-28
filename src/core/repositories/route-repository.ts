import * as fs from "fs";
import * as path from "path";

export interface RoutePath {
    path: string;
    target: string;
}

export interface RouteRepository {
   getRoutes():RoutePath[];
   updateRoutes(routes:RoutePath[]):void;
   findByPath(url: string): string | null;

}

export function loadRoutesFromFile(filePath: string): RoutePath[] {
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data).routes;
}

export class JSONRepository implements RouteRepository {
    private routes: RoutePath[];

    constructor() {
        // Dynamically load the routes from your config file
        const configPath = path.join(__dirname, "../config/routes.json");
        this.routes  = loadRoutesFromFile(configPath);
      
    }

    public findByPath(url: string): string | null {
        const route = this.routes.find((r) => r.path === url);
        return route ? route.target : null;
    }

    public getRoutes(): RoutePath[] {
        return this.routes;
    }

    public updateRoutes(routes: RoutePath[]): void {
        
    }
}
