# My AdDeus

Test
In the upcoming world of AI devices like [Tab](https://mytab.ai/), [Pin](https://hu.ma.ne/aipin), [Rewind](https://www.rewind.ai/pendant), that are with us all the time, and **literally** listening to everything we say - it is crucial to have this setup completely open source, managed and owned by the user itself.

Introducing: Open Source AI wearable device and software

### This project has 3 parts:

1. Mobile / Web app for intera
2. Rasberry-Pi Pico W (worth $6)
3. Supabase server-side for storing data and embeddings

## Set up:

This is a guide on how to set up your own, from buying the hardware to setting up the software.

### Backend:

1. Supabase -> pgvector

### Hardware

This is

## Contributions

Contributions are more than welcomed. This should be maintained by us, for us.
As people will soon notice, by C++ skills are limited, as well as my React and hardware skills - esssicntialy the entire pipeline of this project :P - any help would be amazing.

## TODOs

- [] A

```
brew install gcc
```

### Build CoralAI device

```bash
git clone https://github.com/adamcohenhillel/AdDeus.git

```

```bash
git submodule add  https://github.com/google-coral/coralmicro devices/coralai/coralmicro
```

```bash
git submodule update --init --recursive
```

```bash
cd devices/coralai
```

```bash
cmake -B out -S .
```

```bash
make -C out -j4
```

```bash
python3 coralmicro/scripts/flashtool.py --build_dir out --elf_path out/coralmicro-app --wifi_ssid "<WIFI_NAME>" --wifi_psk "<WIFI_PASSWORD>"
```
