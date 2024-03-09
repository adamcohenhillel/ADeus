alter table "public"."records" add column "processed" boolean not null default false;

alter table "public"."records" add column "summary" text;

alter table "public"."records" add column "topics" text[];


