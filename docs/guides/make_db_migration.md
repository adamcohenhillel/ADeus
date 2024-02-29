---
title: Make a DB Migration
description: add description
layout: default
parent: How to Guides
---

# Make a DB Migration
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Intro
If you're working on a new feature that requires changes to the database, then you need to generate a migration file for those changes, so when your feature is merged to the main branch, and start being used by other people, they will be able to update their database accordingly.

This guide provides step-by-step instructions for how to make migration file from your Supabaase database changes. 


## Create the migration

Let's say you edited the database in your Supabase project. You added the column "new_data" to the table. 

Now you need to make sure others will have that column as well.


1. Go to the supabase folder in your local cloned repo
```bash
cd supabase
```

2. Make sure you're linked to the right Supabase project:
```bash
supabase link --project-ref <YOUR_REMOTE_SUPABASE_PROJECT_ID>
```

3. Create a new migration from the remote Supabase instance:
```bash
supabase db pull
```

This will generate a new file in the folder `supabase/migrations` named <timestamp>_remote_commit.sql


Add it to your branch, and push it with the rest of the feature code to your PR.


## Sync your database with all existing migrations

In case there are new migrations for Adeus, and you need to sync your own database with the latest migrations, follow these instructions:


1. Go to the supabase folder in your local cloned repo
```bash
cd supabase
```

2. Make sure you're linked to the right Supabase project:
```bash
supabase link --project-ref <YOUR_REMOTE_SUPABASE_PROJECT_ID>
```

3. Have a dry run:

```bash
supabase db push --dry-run
```
This will tell you what migrations will need to run, but without executing. This is useful way to see upfront what the migration changes are.

4. Push to Prod!!!!!!!!
```bash
supabase db push
```

