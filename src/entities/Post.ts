import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Post {
    // They are database columns in the Post table: 
  @PrimaryKey()
  id!: number;

  @Property({type: "date"})
  createdAt: Date = new Date();

  @Property({type: "date", onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({type: "text"})
  title!: string;
}