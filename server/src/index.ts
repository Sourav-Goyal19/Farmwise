import "dotenv/config";
import cors from "cors";
import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { verifyWebhook } from "@clerk/express/webhooks";
import { startWorkflow } from "./workflows/core-profile-workflow";

const PORT = process.env.PORT || 8000;

const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "OPTIONS", "DELETE"],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());
app.use(clerkMiddleware());

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

      return res.send("Webhook received");
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return res.status(400).send("Error verifying webhook");
    }
  }
);

// startWorkflow();

app.listen(PORT, () => console.log("Server started at port", PORT));
