---
title: Troubleshoot
layout: default
nav_order: 4
---

# Troubleshoot

### building 'hid' extension, error: unknown file type '.pxd' (from 'chid.pxd')

When setting up your computer for CoralAI development (installing `setup.sh` from the `coralmicro` repo ) you'd need to change the `coralmicro/scripts/requirements.txt` file, making the version of the package `hidapi==0.14.0` (see [issue](https://github.com/google-coral/coralmicro/pull/98))
