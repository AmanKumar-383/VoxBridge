import express from "express";
import { createServer } from "node:http";;

import { Server } from "socket.io";

import mongoose from "mongoose";
import { connectToSocket } from "./controller/socketManager.js";

import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();

const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);
app.use(cors({
    origin: ["http://localhost:3000", 
        "https://voxbridge-nqiw.onrender.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({limit: "40kb", extended: true}));

app.use("/api/v1/users", userRoutes);


const start = async() => {
  app.set("mongo_user")
  const connnectionDb = await mongoose.connect("mongodb+srv://aman-kumar:7aPfez6VR4k7bVfk@cluster0.wbluqtz.mongodb.net/")
  console.log(`mongo connected DB host : ${connnectionDb.connection.host}`)
    server.listen(app.get("port"), () => {
        console.log(`Server is running on port ${app.get("port")}`);
    });

    
}



start();
