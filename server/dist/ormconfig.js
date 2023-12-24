"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appDataSource = void 0;
const typeorm_1 = require("typeorm");
const Post_1 = require("./entities/Post");
const User_1 = require("./entities/User");
const path_1 = __importDefault(require("path"));
const UpVote_1 = require("./entities/UpVote");
exports.appDataSource = new typeorm_1.DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [Post_1.Post, User_1.User, UpVote_1.UpVote],
    logging: true,
    migrations: [path_1.default.join(__dirname, "./migrations/*")],
});
//# sourceMappingURL=ormconfig.js.map