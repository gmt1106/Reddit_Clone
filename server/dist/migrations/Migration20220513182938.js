"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20220513182938 = void 0;
const migrations_1 = require("@mikro-orm/migrations");
class Migration20220513182938 extends migrations_1.Migration {
    async up() {
        this.addSql('create table "post" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "title" text not null);');
    }
    async down() {
        this.addSql('drop table if exists "post" cascade;');
    }
}
exports.Migration20220513182938 = Migration20220513182938;
//# sourceMappingURL=Migration20220513182938.js.map