---
title: Setup Ollama and ngrok
description: Running Ollama Locally and Serving with Ngrok
layout: default
parent: How to Guides
---

# Setup Ollama and ngrok
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Intro
If you would like to setup a local LLM server, you can use the following steps to setup Ollama and serve it with ngrok.


## Setup Ollama locally

There are several ways to setup Ollama, the easiest way is to setup using docker but they support Linux and Mac installs and currently have a Windows preview as well!
Check out [Ollama] (https://ollama.com) and on [Github](https://github.com/ollama/ollama) for the complete info.


1. Install the relevant package for Ollama based on your OS

2. Download Mistral model through Ollama CLI
```bash
ollama pull mistral
```

3. Serve it over localhost
```bash
ollama serve
```

You should now be able to see a message saying "Ollama is running" on [http://localhost:11434](http://localhost:11434)

4. Test Mistral model using curl
```bash
curl http://localhost:11434/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "mistral",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant."
            },
            {
                "role": "user",
                "content": "Hello!"
            }
        ]
    }'
```


## Setup ngrok

To provide access to your supabase functions and your chat app, you would need to expose this to the internet, one of the options for the same is [ngrok](https://ngrok.com/).

Let's do a quick setup for ngrok.


1. Download and Install Ngrok. If you haven't already installed ngrok, download it from ngrok's [website] (https://ngrok.com/download) and follow the installation instructions for your operating system.

2. Sign-up on ngrok for your authtoken

```bash
ngrok config add-authtoken <token>
```

3. Start an Ngrok Tunnel
Open the exe and start an ngrok tunnel to the port where Ollama is running (usually its 11434)
```bash
ngrok http 11434
```
Ngrok will display a screen with several pieces of information, including the public URL that ngrok provides. It will look something like this:
```bash
Forwarding          https://f4dc-2001-bb6.ngrok-free.app -> http://localhost:11434
```

4. Access Ollama from the Internet
Copy the ngrok URL (http://123abc.ngrok.io in the example above) and paste it into your web browser. You should now be able to access your local Ollama instance from anywhere on the internet.
Remember that ngrok sessions are temporary. If you restart ngrok, you'll get a new URL.

5. Secure Your Tunnel (Optional)
If you plan to use ngrok for an extended period or for sensitive applications, consider securing your tunnel with additional options like basic authentication, which can be done as follows:

```bash
ngrok http 11434 --basic-auth="<username>:<password>"
```
You've now successfully set up Ollama to run locally and made it accessible over the internet using ngrok. Remember to monitor your ngrok tunnel and be aware of its usage limits and security implications.


## Use Ollama with Adeus

To use the Ollama and ngrok that you setup with Adeus chat application, setup the public url of ngrok in the supabase secret as OLLAMA_BASE_URL

```bash
supabase secrets set OLLAMA_BASE_URL=https://f4dc-2001-bb6.ngrok-free.app
```

You should now be able to chat with your local model on Adeus!
Ps: The embeddings still use OpenAI's embedding since Ollama doesn't support the OpenAI's embedding endpoints yet. It will be added as part of the code as soon as it is released. So for now you need to setup both OLLAMA_BASE_URL and OPENAI_API_KEY in the supabase secret.