import DataLoader from "dataloader";
import { appDataSource } from "../ormconfig";
import { UpVote } from "../entities/UpVote";

export const createUpVoteLoader = () =>
  new DataLoader<{ postId: number; userId: number }, UpVote | null>(
    async (keys) => {
      const keysUpdate: String[] = [];
      keys.forEach((key) => {
        keysUpdate.push(`${key.postId}|${key.userId}`);
      });

      const queryBuilder = await appDataSource
        .getRepository(UpVote)
        .createQueryBuilder("v")
        .where('(v."postId" || \'|\' || v."userId") in(:...keysUpdate)', {
          keysUpdate: keysUpdate,
        });
      const upVotes = await queryBuilder.getMany();

      const upVoteIdToUpVote: Record<string, UpVote> = {};
      upVotes.forEach((upVote: UpVote) => {
        upVoteIdToUpVote[`${upVote.postId}|${upVote.userId}`] = upVote;
      });

      return keys.map(
        (upVote) => upVoteIdToUpVote[`${upVote.postId}|${upVote.userId}`]
      );
    }
  );

// For example:
// keys = [{postId: 5, userId: 10}]
// return value = {postId: 5, userId: 10, value: 1}:UpVote or null if we the user didn't vote that post
