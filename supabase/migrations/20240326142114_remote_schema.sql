drop policy "Enable access for all authed" on "public"."conversations";

alter table "public"."conversations" add column "auth_id" uuid not null default auth.uid();

alter table "public"."records" add column "auth_id" uuid not null default auth.uid();

alter table "public"."records" enable row level security;

alter table "public"."conversations" add constraint "public_conversations_user_id_fkey" FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."conversations" validate constraint "public_conversations_user_id_fkey";

alter table "public"."records" add constraint "public_records_user_id_fkey" FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."records" validate constraint "public_records_user_id_fkey";

create policy "users can only see and do their own things"
on "public"."conversations"
as permissive
for all
to authenticated
using ((auth.uid() = auth_id))
with check ((auth.uid() = auth_id));


create policy "users can only see and do their own things"
on "public"."records"
as permissive
for all
to authenticated
using ((auth.uid() = auth_id))
with check ((auth.uid() = auth_id));



