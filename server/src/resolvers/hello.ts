import { Resolver, Query } from "type-graphql";

// Add functions that are mutation or query 
@Resolver()
export class HelloResolver {

    @Query(() => String)
    hello() {
        return "hello world"
    }

}