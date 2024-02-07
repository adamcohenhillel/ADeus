# ADeus Sound Recording Script Documentation

## Introduction

This script enables developers to send audio recordings from a Python environment to a server, without the need of a physical device.

## Setup Instructions

```bash
cd scripts/python_recorder_client
pip install -r requirements.txt
```

The script requires PyAudio to capture audio from your microphone. Please install PyAudio before.
### Windows
```bash
python -m pip install pyaudio
```
### macOS
```bash
brew install portaudio
pip install pyaudio
```
### GNU/Linux
```bash
sudo apt install python3-pyaudio
pip install pyaudio
```

## Script Usage

To use the script, you need to provide the --base-url (-u) and --token (-t) parameters. Here's a brief overview of the script's parameters:
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

## Important Notes
- Ensure your base_url and token are correct to successfully send recordings.
- Adjust the sensitivity to your microphone setup to avoid missing recordings or record silance.
- Use the save option if you want to keep local copies of the recordings (file names "recording{timestamp}.wav").
