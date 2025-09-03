import { httpRouter } from "convex/server";
import { auth } from "@/convex/auth";

const http = httpRouter();

// Add authentication routes
auth.addHttpRoutes(http);

export default http;
