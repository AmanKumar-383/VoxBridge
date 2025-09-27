import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controller/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);

app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Existing API routes
app.use("/api/v1/users", userRoutes);

// ---------------- SPA ROUTE FIX ----------------
app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ---------------- START SERVER ----------------
const start = async () => {
  app.set("mongo_user");
  const connectionDb = await mongoose.connect(
    "mongodb+srv://aman-kumar:7aPfez6VR4k7bVfk@cluster0.wbluqtz.mongodb.net/"
  );
  console.log(`Mongo connected DB host : ${connectionDb.connection.host}`);

  server.listen(app.get("port"), () => {
    console.log(`Server is running on port ${app.get("port")}`);
  });
};

start();
