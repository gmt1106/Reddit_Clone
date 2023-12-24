"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpVoteLoader = void 0;
const dataloader_1 = __importDefault(require("dataloader"));
const ormconfig_1 = require("../ormconfig");
const UpVote_1 = require("../entities/UpVote");
const createUpVoteLoader = () => new dataloader_1.default(async (keys) => {
    const keysUpdate = [];
    keys.forEach((key) => {
        keysUpdate.push(`${key.postId}|${key.userId}`);
    });
    const queryBuilder = await ormconfig_1.appDataSource
        .getRepository(UpVote_1.UpVote)
        .createQueryBuilder("v")
        .where('(v."postId" || \'|\' || v."userId") in(:...keysUpdate)', {
        keysUpdate: keysUpdate,
    });
    const upVotes = await queryBuilder.getMany();
    const upVoteIdToUpVote = {};
    upVotes.forEach((upVote) => {
        upVoteIdToUpVote[`${upVote.postId}|${upVote.userId}`] = upVote;
    });
    return keys.map((upVote) => upVoteIdToUpVote[`${upVote.postId}|${upVote.userId}`]);
});
exports.createUpVoteLoader = createUpVoteLoader;
//# sourceMappingURL=createUpVoteLoader.js.map