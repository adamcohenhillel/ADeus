---
title: Setting up the mobile / web app
description: add description
layout: default
---

Now that you have a Supabase instance that is up and running, you can technically start chatting with your assistant, it just won't have any personal data it.

To try it out, you can either use the deployed version of the web app here: [adeusai.com](https://adeusai.com) - which will ask you to connect to your own Supabase instance (it is only a frontend client).

Or you can deploy the app yourself somewhere - the easiest is Vercel, or locally:

from the root folder:

```bash
cd ./app
```

npm install and run:

```bash
npm i
npm run dev
```

Once you have an app instance up and running, head to its address `your-app-address.com/`, and you should see the screen:

<img src="docs/images/login_screenshot.png" width="150">

Enter the four required details, which you should've obtained in the Supabase setup: `Supabase URL`, `Supabase Anon API Key`, `email` and `password`.

And you should be able to start chatting!

Now - let's configure our hardware device, so we could start provide crucial context to our personal AI!
