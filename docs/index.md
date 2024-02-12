---
title: Home
layout: default
---

### Documentation

Welcome, contributer! What you are doing here is truly amazing. Open source contributors are the unsung heroes of technology, the backbone of our modern, OPEN, world. so thank you for being here.

**Now, let's get started!**

## Table of contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
  - [Set up Supabase](./how-to/setup_supabase.md)
  - [Set up Web / Mobile App](./how-to/setup_app.md)
  - [Hardware (Coral AI)](#setup-hardware-coral-ai-device-↗)
- [Resources](#resoucres)
- [How to Contribute](#how-to-contribute)

First, let's understand how Adeus is built:

Adeus consists of 3 parts:

![ADeus diagram](./images/adeus_diagram.png)

1. **A mobile / web app:**
   an interface that lets the user to interact with their assistant and data via chat.

2. **Hardware device (Currently Coral AI, but soon a Rasberry-Pi Zero W worth $15):** this will be the wearable that will record everything, and send it to the backend to be processed
3. **Supabase :** Our backend, and datavase, where we will process and store data, and interact with LLMs.
   Supabase is an open source Firebase alternative, a "backend-as-a-service" - which allows you to setup a Postgres database, Authentication, Edge Functions, Vector embeddings, and more - for free (at first) and at extreme ease!
   - [!!] But more importantly - **it is open source, and you can choose to deploy and manage your own Supabase instance** - which us crucial for our mission: A truly open-source, personal AI.

## Getting Started

### Resources

### How to Contribute
