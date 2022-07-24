"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const post_1 = require("./entities/post");
const path_1 = __importDefault(require("path"));
const User_1 = require("./entities/User");
exports.default = {
    allowGlobalContext: true,
    migrations: {
        path: path_1.default.join(__dirname, "./migrations"),
        pattern: /^[\w-]+\d+\.[tj]s$/,
        disableForeignKeys: false,
    },
    entities: [post_1.Post, User_1.User],
    dbName: "redditclone",
    user: "redditclone",
    password: "redditclone1106",
    type: "postgresql",
    debug: !constants_1.__prod__,
};
//# sourceMappingURL=mikro-orm.config.js.map