import "dotenv/config";
import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { requireAuth } from "./middleware/require-auth";
const app = express();
const PORT = Number(process.env.PORT ?? 8081);
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:3000";
app.use("/api", cors({
    origin: CLIENT_URL,
    credentials: true,
}));
app.all("/api/auth/*splat", toNodeHandler(auth));
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
// Keep authentication routes public; protect application API routes by default.
app.use("/api", requireAuth);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
