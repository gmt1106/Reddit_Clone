"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserLoader = void 0;
const dataloader_1 = __importDefault(require("dataloader"));
const User_1 = require("../entities/User");
const typeorm_1 = require("typeorm");
const createUserLoader = () => new dataloader_1.default(async (keys) => {
    const users = await User_1.User.findBy({ id: (0, typeorm_1.In)(keys) });
    const userIdsToUsers = {};
    users.forEach((user) => {
        userIdsToUsers[user.id] = user;
    });
    return keys.map((userId) => userIdsToUsers[userId]);
});
exports.createUserLoader = createUserLoader;
//# sourceMappingURL=createUserLoader.js.map