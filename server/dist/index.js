"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const constants_1 = require("./constants");
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const hello_1 = require("./resolvers/hello");
const post_1 = require("./resolvers/post");
const user_1 = require("./resolvers/user");
const ioredis_1 = __importDefault(require("ioredis"));
const express_session_1 = __importDefault(require("express-session"));
const connect_redis_1 = __importDefault(require("connect-redis"));
const cors_1 = __importDefault(require("cors"));
const Post_1 = require("./entities/Post");
const User_1 = require("./entities/User");
const path_1 = __importDefault(require("path"));
const UpVote_1 = require("./entities/UpVote");
const createUserLoader_1 = require("./utils/createUserLoader");
const createUpVoteLoader_1 = require("./utils/createUpVoteLoader");
exports.appDataSource = new typeorm_1.DataSource({
    type: "postgres",
    username: "redditclone",
    password: "redditclone1106",
    database: "redditclone",
    entities: [Post_1.Post, User_1.User, UpVote_1.UpVote],
    synchronize: true,
    logging: true,
    migrations: [path_1.default.join(__dirname, "./migrations/*")],
});
const main = async () => {
    exports.appDataSource
        .initialize()
        .then(() => {
        console.log("Data Source has been initialized!");
        exports.appDataSource.runMigrations();
    })
        .catch((error) => console.log("Error during Data Source initialization", error));
    const app = (0, express_1.default)();
    const RedisStore = (0, connect_redis_1.default)(express_session_1.default);
    const redis = new ioredis_1.default();
    app.use((0, cors_1.default)({
        credentials: true,
        origin: ["http://localhost:3000", "https://studio.apollographql.com"],
    }));
    app.use((0, express_session_1.default)({
        name: constants_1.COOKIE_NAME,
        store: new RedisStore({ client: redis, disableTouch: true }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
            httpOnly: true,
        },
        saveUninitialized: false,
        secret: "kadfljskdjfiwoenvskdnvkdsgjlei",
        resave: false,
    }));
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: await (0, type_graphql_1.buildSchema)({
            resolvers: [hello_1.HelloResolver, post_1.PostResolver, user_1.UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({
            appDataSource: exports.appDataSource,
            req,
            res,
            redis,
            userLoader: (0, createUserLoader_1.createUserLoader)(),
            upVoteLoader: (0, createUpVoteLoader_1.createUpVoteLoader)(),
        }),
    });
    await apolloServer.start();
    apolloServer.applyMiddleware({
        app,
        cors: false,
    });
    app.listen(4000, () => {
        console.log("🚀 server started on localhost:4000");
    });
};
main().catch((err) => {
    console.error(err);
});
//# sourceMappingURL=index.js.map