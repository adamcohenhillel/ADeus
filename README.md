# ADeus: Open-Source AI Wearable Device

In the upcoming world of AI devices like [Tab](https://mytab.ai/), [Pin](https://hu.ma.ne/aipin), [Rewind](https://www.rewind.ai/pendant), that are with us all the time, **literally** listening to everything we say, and know much about us as our closest friends - it is crucial to be able to own this setup, to own our data, to have this completely open source, managed by the user itself.

**This is Adeus, the Open Source AI Wearble device -** and in this repo, you will be guided on how to set up your own! From buying the hardware (~$100, and will be cheaper once we finish the Raspberry PI Zero version) to setting up the backend, the software, and start using your wearable!

- [Introduction](#introduction)
- [Setup](#setup)
  - [Prerequisite](#prerequisite-110)
  - [Supabase](#setup-supabase)
  - [Web / Mobile App](#setup-app-web)
  - [Hardware (Coral AI)](#setup-hardware---coral-ai-device)
  - [Hardware (Rasberry Pi Zero)](#setup-hardware---rasberry-pi-zero-w)
  - [Run with OpenRouter](#setup-run-with-openrouter)
  - [Run with Ollama](#setup-run-with-ollama)
- [Areas to Contribute](#areas-to-contribute)
- [CTA for the Community](#cta-for-the-community)

![ADeus v0.1](docs/images/adeus_01.jpeg)

> p.s. any contribution would be amazing, whether you know how to code, and want to jump straight in to the codebase, a hardware person who can help out, or just looking to support this project financially (can literally be $10) - please reach out to me on X/Twitter [@adamcohenhillel](https://twitter.com/adamcohenhillel)

### Introduction:

Adeus consists of 3 parts:

1. **A mobile / web app:**
   an interface that lets the user to interact with their assistant and data via chat.

2. **Hardware device (Currently Coral AI, but soon a Rasberry-Pi Zero W worth $15):** this will be the wearable that will record everything, and send it to the backend to be processed
3. **Supabase :** Our backend, and datavase, where we will process and store data, and interact with LLMs.
   Supabase is an open source Firebase alternative, a "backend-as-a-service" - which allows you to setup a Postgres database, Authentication, Edge Functions, Vector embeddings, and more - for free (at first) and at extreme ease!
   - [!!] But more importantly - **it is open source, and you can choose to deploy and manage your own Supabase instance** - which us crucial for our mission: A truly open-source, personal AI.

This will look something like:
![ADeus diagram](docs/images/adeus_diagram.png)

## Setup

> Note: I'm working on an easy setup.sh file that will do everything here more or less automatically, but it is still in the making

A'ight, let's get this working for you!

#### Prerequisite: ($110)

1. [Dev Board Micro](https://coral.ai/products/dev-board-micro/) ($80)
2. [Wireless/Bluetooth Add-on](https://coral.ai/products/wireless-add-on/) ($20)
3. [A case](https://coral.ai/products/dev-board-micro-case/) (Optional, 10$)
4. Either an OpenAI key, or a Ollama server running somewhere you can reach via internet

> Note: We are working on a version of this working with Raspberry PI Zero W, which will cost ~$20, stay tuned

First - cloning the repo:

```bash
git clone https://github.com/adamcohenhillel/ADeus
```

#### Setup: Supabase

We will use Supabase as our database (with vector search, pgvector), authentication, and cloud functions for processing information.

1. Go to [supabase.co](https://supabase.co), create your account if you don't have one already
2. Click "New Project", give it a name, and make sure to note the database password you are given

   <img src="docs/images/supabase_new_prpject.png" width="100">

3. Once the project is created, you should get the `anon public` API Key, and the `Project URL`, copy them both, as we will need them in a bit.

   <img src="docs/images/supabase_creds.png" width="200">

4. Now, go to the authentication tab on the right navbar (<img src="docs/images/supabase_auth.png" width="100">), note that it can take a few moments for Supabase to finish setup the project

5. There, you will see the "user management" UI. Click "Add User" -> "Add new user", fill an email and password, and make sure to check the "auto-confirm" option.

   <img src="docs/images/supabase_new_user.png" width="200">

6. From there, go to the SQL Editor tab (<img src="docs/images/supabase_sql_editor.png" width="100">) and paste the [schema.sql](/supabase/schema.sql) from this repo, and execute. This will enable all the relevant extensions (pgvector) and create the two tables:

   <img src="docs/images/supabase_tables.png" width="150">

7. By now, you should have 4 things: `email` & `password` for your supabase user, and the `Supabase URL` and `API Anon Key`.

8. If so, go to your terminal, and cd to the supabase folder: `cd ./supabase`

9. Install Supabase and set up the CLI. You should follow thier [guide here](https://supabase.com/docs/guides/cli/getting-started?platform=macos#installing-the-supabase-cli), but in short:
   - run `brew install supabase/tap/supabase` to install the CLI (or [check other options](https://supabase.com/docs/guides/cli/getting-started))
   - Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) on your computer (we won't use it, we just need docker dameon to run in the background for deploying supabase functions)
10. Now when we have the CLI, we need to login with oour Supabase account, running `supabase login` - this should pop up a browser window, which should prompt you through the auth
11. And link our Supabase CLI to a specific project, our newly created one, by running `supabase link --project-ref <your-project-id>` (you can check what the project id is from the Supabase web UI, or by running `supabase projects list`, and it will be under "reference id") - you can skip (enter) the database password, it's not needed.
12. Now let's deploy our functions! ([see guide for more details](https://supabase.com/docs/guides/functions/deploy)) `supabase functions deploy --no-verify-jwt` (see [issue re:security](https://github.com/adamcohenhillel/AdDeus/issues/3))
13. Lasly - if you're planning to first use OpenAI as your Foundation model provider, then you'd need to also run the following command, to make sure the functions have everything they need to run properly: `supabase secrets set OPENAI_API_KEY=<your-openai-api-key>` (Ollama setup guide is coming out soon)
14. If you want access to tons of AI Models, both Open & Closed Source, set up your OpenRouter API Key. Go to [OpenRouter](https://openrouter.ai/) to get your API Key, then run `supabase secrets set OPENROUTER_API_KEY=<your-openrouter-api-key>`.

If everything worked, we should now be able to start chatting with our personal AI via the app - so let's set that up!

#### Setup: App (Web)

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

### Setup: Hardware - Coral AI device

First, to learn more about the device, it is good to check out the [official docs](https://coral.ai/docs/dev-board-micro/get-started/). Our project is using [out-of-tree setup](official) with a [Wireless Add-on](https://coral.ai/docs/dev-board-micro/wireless-addon/).

Here is quick video showing how to "connect" the hardware pieces together, and install the software:

[![set up device video](docs/images/thumbnail_2.png)](https://youtu.be/_2KRSlpnXrA)

In the root folder of this repository, run the following commands, (which will download the Coral AI Micro Dev dependencies to your computer - note that it might take a few minutes):

```bash
git submodule add  https://github.com/google-coral/coralmicro devices/coralai/coralmicro
```

```bash
git submodule update --init --recursive
```

Then, when it is finished, CD to the `devices/coralai` folder:

```bash
cd devices/coralai
```

And run the setup script, which will make sure your computer can compile the code and pass it on to the device:

> Note that if you're using Apple Silicon Mac, you might need to change the `coralmicro/scripts/requirements.txt` file, making the version of the package `hidapi==0.14.0` (see [issue](https://github.com/google-coral/coralmicro/pull/98))

```bash
bash coralmicro/setup.sh
```

```bash
export SUPABASE_URL"<YOUR_SUPABASE_URL"
```

> Note: Security RLS best practices is still WOP! (see [ticket #3](https://github.com/adamcohenhillel/AdDeus/issues/3))

Once the setup has finished running, you can connect your device via a USB-C, and run the following to create a build:

```bash
cmake -B out -S .
```

```bash
make -C out -j4
```

And then, flash it to your device with WIFI_NAME and WIFI_PASSWORD: (Bluetooth pairing is coming soon, see [ticket][https://github.com/adamcohenhillel/AdDeus/issues/8])

```bash
python3 coralmicro/scripts/flashtool.py --build_dir out --elf_path out/coralmicro-app --wifi_ssid "<WIFI_NAME>" --wifi_psk "<WIFI_PASSWORD>"
```

To debug the device, you can connect to it serial-y via the USB-C.

First, find the serial id
On Linux:

```bash
ls /dev/ttyACM*
```

On Mac:

```bash
ls /dev/cu.usbmodem*
```

Then run the [checkOutput.py](/devices/coralai/checkOutput.py) script:

```python
python3 checkOutput.py --device "/dev/cu.usbmodem101"
```

(replace the `/dev/cu.usbmodem*` with whatever you got in the `ls` command)

> Note: It might fail for the first few CURL requests, until it resolves the DNS

### Setup: Hardware - Rasberry Pi Zero W

SOON! (cost $15, but need to solder a microphone)

### Setup: Run with OpenRouter

If you want access to tons of AI Models, both Open & Closed Source, set up your OpenRouter API Key. Go to [OpenRouter](https://openrouter.ai/) to get your API Key, then run 

``` 
supabase secrets set OPENROUTER_API_KEY=<your-openrouter-api-key>
```

Once that is set up, simple click the toggle in the top left of the chat interface to start experimenting with tons of AI models.

<img src="docs/images/openrouter.png" width="500">

### Setup: Run with Ollama

How-to-Guide will be written here soon, but it should be fairly simple with [Ollama](https://ollama.ai/) serve and `ngrok http 11434`

```
brew install ngrok/ngrok/ngrok
```

## Areas to Contribute:

As people will soon notice, my C++ skills are limited, as well as my React and hardware skills :P - any help would be amazing! Contributions are more than welcomed. This should be maintained by us, for us.

Build it for yourself, and build it for others. This can become the Linux of the OS, the Android of the mobile. It is raw, but we need to start from somewhere!

### Known Bugs:

- [ ] Whisper tends to generate YouTube-like text when the audio is unclear, so you can get noise data in the database like "Thank you for watching", and "See you in the next video," even though it has nothing to do with the audio ([ticket #7](https://github.com/adamcohenhillel/AdDeus/issues/7))

- [ ] Currently it is using Wi-Fi, which makes it not-so mobile. An alternative approach would either be: ([ticket #8](https://github.com/adamcohenhillel/AdDeus/issues/8))

  - Bluetooth, pairing with the mobile device
  - Sdd a 4G card that will allow it to be completly independent

- [ ] Sometimes when loading from scratch, it takes some time (2-3 curl requests) until it resolves the DNS of the Supabase instance ([ticket #8](https://github.com/adamcohenhillel/AdDeus/issues/12))

#### Backend:

- The RAG (Retrieval-Augmented Generation) can be extremely improved:
  - [ ] Need to process the audio not only into "embeddings" but also run an LLM on it to generate some context ([ticket #1](https://github.com/adamcohenhillel/AdDeus/issues/1))
  - [ ] Need to query the RAG more efficiently, maybe with timestamp as well, etc. - not only embeddings (relates to the processing part) ([ticket #2](https://github.com/adamcohenhillel/AdDeus/issues/2))
- [ ] Improve security - currently I didn't spent too much time making the Supabase RLS really work (for writing data) ([ticket #3](https://github.com/adamcohenhillel/AdDeus/issues/3))

#### Hardware / On-device:

- [ ] Run on a Rasberry Pi Pico / Zero, as it is much much cheaper, and should do the work too ([ticket #4](https://github.com/adamcohenhillel/AdDeus/issues/4))
- [ ] Currently the setup is without battery, need to find the easiest way to add this as part of the setup ([ticket #5](https://github.com/adamcohenhillel/AdDeus/issues/5))

#### Mobile:

- [ ] Improve user setup?

#### UX and Onboarding

- [ ] An easy setup script / deploy my own Ollama server to replace OpenAI [ticket #6](https://github.com/adamcohenhillel/AdDeus/issues/6)
- [ ] Add How-to for Ollama setup ([ticket #9](https://github.com/adamcohenhillel/AdDeus/issues/9))

## CTA for the Community:

A lot of companies and organizations are now after building the "Personal AI" - the one that will be a companion for individuals. This will be a paradigm shift of the way we all experince the digital (and physical) realms. Interacting with our AI that knows a lot about us, and help us navigate the world.

The problem with all these initiatives, is that they don't really provide you with your own personal AI. It’s not private, you don’t own it. As long as you don’t have a way to opt out, and take your so-called personal AI elsewhere, it’s not yours, you merely renting it from somewhere.

**Personal AI should be like a personal computer, connected to the internet.**

The pioneers of the personal computers, the internet, they all knew it - and that what made it great, a period of possibilities. But since, as we all know, things had drifted. You don’t own things, merely renting them. You can’t take it elsewhere - and therefore the free-market forces of capitalism can’t be easily integrated into the digital realm.

Check out the Intro video:

[![set up device video](docs/images/thumbnail_1.png)](https://youtu.be/4CqEC2yLGQU)
