const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const redis = require("redis");
let RedisStore = require("connect-redis")(session);

const {
  MONGO_USER,
  MONGO_PORT,
  MONGO_IP,
  MONGO_PASSWORD,
  REDIS_URL,
  SESSION_SECRET,
  REDIS_PORT,
} = require("./config");
const postRouter = require("./routes/postRoutes");
const authRouter = require("./routes/authRoutes");

const app = express();

const MONGO_URL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/mongo_first`;

const redisClient = redis.createClient({
  host: REDIS_URL,
  port: REDIS_PORT,
});

function connectWithRetry() {
  mongoose
    .connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(() => {
      console.log("connected to DB");
    })
    .catch((err) => {
      console.log(`Error: ${err.message}`);
      setTimeout(connectWithRetry, 5000);
    });
}

connectWithRetry();

app.enable("trust proxy");
app.use(cors({}));
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 3000000,
    },
  })
);
app.use(express.json());

app.use("/api/v1/posts", postRouter);
app.use("/api/v1/auth", authRouter);

app.get("/api/v1", (_, res) => {
  res.send("<h1>Hey</h1>");
  console.log("Yeah bitch!");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
