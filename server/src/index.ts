import "dotenv/config";
import cors from "cors";
import express from "express";
import { db } from "./db/index.js";
import { farmersTable } from "./db/schema.js";
import { clerkMiddleware } from "@clerk/express";
import userRouter from "./routers/user.router.js";
import { WebhookReceiver } from "livekit-server-sdk";
import profileRouter from "./routers/profile.router.js";
import { verifyWebhook } from "@clerk/express/webhooks";
import cropsRouter from "./routers/plot-crops.router.js";
import plotsRouter from "./routers/farmer-plots.router.js";
import logsRouter from "./routers/log-automation.router.js";
import contactsRouter from "./routers/farmer-contact.router.js";

const PORT = process.env.PORT || 8000;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const app = express();

app.use(
    cors({
        origin: CLIENT_URL,
        methods: ["GET", "POST", "PATCH", "OPTIONS", "DELETE", "PUT"],
        credentials: true,
        optionsSuccessStatus: 204,
    }),
);
app.use(express.json());
app.use(clerkMiddleware());
app.use(express.raw({ type: "application/webhook+json" }));

app.get("/", (req, res) => {
    res.status(200).send("<h1>Working</h1>");
});

app.post(
    "/api/webhooks",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        try {
            const evt = await verifyWebhook(req);
            console.log(evt.type);
            console.log(evt.data);

            if (evt.type == "user.created") {
                await db.insert(farmersTable).values({
                    id: evt.data.id,
                });
            }

            return res.send("Webhook received");
        } catch (err) {
            console.error("Error verifying webhook:", err);
            return res.status(400).send("Error verifying webhook");
        }
    },
);

app.use("/api/logs", logsRouter);
app.use("/api/farmers/user", userRouter);
app.use("/api/farmers/plots", plotsRouter);
app.use("/api/farmers/crops", cropsRouter);
app.use("/api/farmers/profile", profileRouter);
app.use("/api/farmers/contacts", contactsRouter);

const webhookReciever = new WebhookReceiver(
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET,
);

app.post("/livekit/webhook", async (req, res) => {
    try {
        const event = await webhookReciever.receive(
            req.body,
            req.get("Authorization"),
        );
        console.log(event);
    } catch (error) {}
    res.status(200).send();
});

app.listen(PORT, () => console.log("Server started at port", PORT));
