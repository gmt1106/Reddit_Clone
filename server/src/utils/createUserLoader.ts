import DataLoader from "dataloader";
import { User } from "../entities/User";
import { In } from "typeorm";

export const createUserLoader = () =>
  new DataLoader<number, User>(async (keys) => {
    const users = await User.findBy({ id: In(keys as number[]) });
    // after getting all user, we need to match the output with the key list
    const userIdsToUsers: Record<number, User> = {};
    users.forEach((user) => {
      userIdsToUsers[user.id] = user;
    });

    return keys.map((userId) => userIdsToUsers[userId]);
  });

// For each field resolver that we want to optimize, create a field loader
// We want to create createUserLoader for every single request.
// How DataLoader works is, we need to pass in a batch load function, which takes keys and return data for all these keys
// For example:
// keys = [1, 78, 8, 9]
// return value = [{id: 1, username: "ben"}, {id: 78}, {id: 8}, {id: 9}]  list of users that is matching to each key. Order matters
