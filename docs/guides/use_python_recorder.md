---
title: Develop without hardware device using a python script
description: add description
layout: default
parent: How To
---

## Develop without the hardware device: Sound Recording With a Python Script

Sometimes, when working on the frontend / backend of Adeus, you want an easier and faster feedback loop, one that does not require the use of the physical device. This is exactly what this guide is about.

#### Setup:

first, let's go to the script's folder:

```bash
cd scripts/python_recorder_client
```

And now let's install it's requirements.
The script requires PyAudio to capture audio from your microphone, which has different setup to each OS:

**Windows**

```bash
python -m pip install pyaudio
```

**macOS**

```bash
brew install portaudio
```

**GNU/Linux**

```bash
sudo apt install python3-pyaudio
```

Now, we can install the rest of the requirements:

```bash
pip install -r requirements.txt
```

#### Run the script

To run the script, you need to provide the --base-url (-u) and --token (-t) parameters, these are your Supabase (if you don't have these parameters, please go to the [setup tutorial](./index)).

Here's a brief overview of the script's parameters:

```bash
    -u: --base-url(required): The URL to which the recordings are sent.
    -t: --token(required): API token for server authentication.
    -s: --seconds: Duration of recording segments in seconds (default: 30).
    -m: --sensitivity: Microphone sensitivity threshold (0.0 to 100.0, default: 35.0). Set to 0 for continuous recording.
    -l: --save: Save recordings locally.
    -v: --verbose: Enable verbose output for debugging.
```

For detailed help, including all available options, run the script with the --help flag.

```bash
python main.py --help
```

Run:

```bash
python3 -u <SUPABASE_URL> -t <SUPABASE_TOKEN>
```

And that is it, you should now be able to record things locally, and test the frontend / backend without a physical device!

#### Important Notes

- Ensure your base_url and token are correct to successfully send recordings.
- Adjust the sensitivity to your microphone setup to avoid missing recordings or record silance.
- Use the save option if you want to keep local copies of the recordings (file names "recording{timestamp}.wav").
