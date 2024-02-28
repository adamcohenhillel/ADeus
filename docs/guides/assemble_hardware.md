---
title: How to Assemble Hardware
description: add description
layout: default
parent: How to Guides
---

# Raspberry Pi Zero W Setup Guide
{: .no_toc }

## How to Assemble Hardware
{: .no_toc .text-delta }

1. TOC
{:toc}

---
![IMG_0104](https://github.com/kodjima33/ADeus/assets/43514161/32d2bf78-e65c-4c78-bc9c-1f6387fd524e)


This guide provides step-by-step instructions for assembling hardware device for recording audio. Currently we use Raspberry Pi Zero W but will switch to ESP32 soon. 
## What do you need to buy

Option 1: **With soldering** (choose this if you have soldering experience or if you feel comfortable to try it out)
- [Raspberry Pi Zero 2 W starter kit](https://www.amazon.com/Vilros-Raspberry-Incudes-HDMI-USB-Adapters/dp/B09M1PS35R/ref=sr_1_1_sspa?dib=eyJ2IjoiMSJ9.7uwaVS6VlIyCOjU6bSCtilVtXA4LRZlsMI7u7c0q7_RWrDRzbTeOdGo7RMfSkGMR-xvuauf8BnIWA0yDFsu05NCiJuPaCtsgEG_4abxGwHYKI9tpQko0gVaBg3sOrqgV0QigrnGU7rVbuWtgMwqil-l5W3LrEkA27nawQ5wptpLJ-T_p9nUU8QE5xHWXd9b27tsm-TM0dYnB_KRw-JD95m2f7aXZFiXRC2S68UEq0eE.dEIhxLbFiZ4WOZYcBpqwqwv_ACeMe7Z46VDGsVTaTNY&dib_tag=se&keywords=raspberry+pi+zero+2+w&qid=1709075875&sr=8-1-spons&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&psc=1)
- [MicroSD card ](https://www.amazon.com/SanDisk-2-Pack-microSDHC-Memory-2x32GB/dp/B08GY9NYRM/ref=pd_bxgy_d_sccl_1/145-9248613-0901538?content-id=amzn1.sym.839d7715-b862-4989-8f65-c6f9502d15f9&th=1)
- [Microphone](https://www.amazon.com/AITRIP-Omnidirectional-Microphone-Precision-Interface/dp/B0972XP1YS/ref=pd_ci_mcx_pspc_dp_d_2_t_1?pd_rd_w=a5gvQ&content-id=amzn1.sym.568f3b6b-5aad-4bfd-98ee-d827f03151e4&pf_rd_p=568f3b6b-5aad-4bfd-98ee-d827f03151e4&pf_rd_r=ZD4BWQF760DG2TXHPBZ7&pd_rd_wg=qQDw5&pd_rd_r=94ce375e-d574-4fd5-8356-1fad3c7e61a4&pd_rd_i=B092HWW4RS&th=1)
- [Battery](https://amazon.com/Pisugar2-Portable-Pwnagotchi-Raspberry-Accessories/dp/B08D678XPR?crid=20HTG4JLWZJBO&keywords=battery+for+raspberry+pi-zero&qid=1706907491&s=electronics&sprefix=,electronics,287&sr=1-3)
- [Soldering kit](https://www.amazon.com/Soldering-soldering-solder-adjustable-temperature/dp/B09DY7CCW5/ref=sr_1_6?dib=eyJ2IjoiMSJ9.WmwXfdV-vvTdM3IB5u-qMa9zvxaVSUsnexrrgK27EhfSFJwyD213PAtWppYhuPEOMtHwAg_eApOMEDEXRK65p-8GLcwF6eVc7LgpzFTp5DQvps3Ntjs7j2N4RWd6kCFfDij2mjwv9-jd3kdId9KS1RBx56Q4RVVgcDXk2JGgGTC9FonAt1LayKu8YlcHXCJOxHJHVrjduGnfgOa1jeL7GLtDGAa3xfl6cvZUQ9lIPKC1l5JJAauH-sQtWAnLi7qMJ1n7BRvNjorfeOATrP7CINmeuw_kyS4vZFrsdfJYDsM.mW2R1sZRucWsuGLneASupjvBtsTKTiUR5Jg5PcrFq_4&dib_tag=se&keywords=solder+kit&qid=1709075533&sr=8-6)

Option 2: **Without Soldering**
- [Raspberry Pi Zero 2 W starter kit](https://www.amazon.com/Vilros-Raspberry-Incudes-HDMI-USB-Adapters/dp/B09M1PS35R/ref=sr_1_1_sspa?dib=eyJ2IjoiMSJ9.7uwaVS6VlIyCOjU6bSCtilVtXA4LRZlsMI7u7c0q7_RWrDRzbTeOdGo7RMfSkGMR-xvuauf8BnIWA0yDFsu05NCiJuPaCtsgEG_4abxGwHYKI9tpQko0gVaBg3sOrqgV0QigrnGU7rVbuWtgMwqil-l5W3LrEkA27nawQ5wptpLJ-T_p9nUU8QE5xHWXd9b27tsm-TM0dYnB_KRw-JD95m2f7aXZFiXRC2S68UEq0eE.dEIhxLbFiZ4WOZYcBpqwqwv_ACeMe7Z46VDGsVTaTNY&dib_tag=se&keywords=raspberry+pi+zero+2+w&qid=1709075875&sr=8-1-spons&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&psc=1)
- [MicroSD card (8GB or larger recommended)](https://www.amazon.com/SanDisk-2-Pack-microSDHC-Memory-2x32GB/dp/B08GY9NYRM/ref=pd_bxgy_d_sccl_1/145-9248613-0901538?content-id=amzn1.sym.839d7715-b862-4989-8f65-c6f9502d15f9&th=1)
- [Microphone](https://www.amazon.com/AITRIP-Omnidirectional-Microphone-Precision-Interface/dp/B0972XP1YS/ref=pd_ci_mcx_pspc_dp_d_2_t_1?pd_rd_w=a5gvQ&content-id=amzn1.sym.568f3b6b-5aad-4bfd-98ee-d827f03151e4&pf_rd_p=568f3b6b-5aad-4bfd-98ee-d827f03151e4&pf_rd_r=ZD4BWQF760DG2TXHPBZ7&pd_rd_wg=qQDw5&pd_rd_r=94ce375e-d574-4fd5-8356-1fad3c7e61a4&pd_rd_i=B092HWW4RS&th=1)
- [Battery](https://amazon.com/Pisugar2-Portable-Pwnagotchi-Raspberry-Accessories/dp/B08D678XPR?crid=20HTG4JLWZJBO&keywords=battery+for+raspberry+pi-zero&qid=1706907491&s=electronics&sprefix=,electronics,287&sr=1-3)
- [Solderless pins kit](https://www.amazon.com/Vilros-Raspberry-Headers-Easy-Installation-Soldering/dp/B0CGRYYY63/ref=sr_1_1?crid=I922BYJ9EVY4&dib=eyJ2IjoiMSJ9.hLsapq3AI0K4IADEQc56qlx0DtBRnjf8VmGz-Sor7t3Bf_UbyZimITYT8B4ojUxofB1pwnaQWyJQ-zZzrv_hDE01zCgJRUtdCRTgE31sfSGH1pBn9koR4mldMizddvYGaAjsEf-qvP0NeffTMTFdoGWvCsGfbdbGgEcAizZjFPyZvAYlYeaoXjd6ySSgx-zL7CQ32vCBScitqHUyKNgi2lkAA8XBzhlZ0P92f-zqPmE.PWxHiswToTA9VCH5mZ2QEqHYYVfnzrZ0bCvaaRaif1s&dib_tag=se&keywords=male+pin+headers+solderless+raspberry&qid=1709077414&sprefix=male+pin+headers+solderless+raspberr%2Caps%2C160&sr=8-1)

## Assembling instructions

### 1. Connect pin headers to Raspberry Pi


You have a Raspberry Pi board that looks like this ![zero2-close-up](https://github.com/kodjima33/ADeus/assets/43514161/c9f5ce13-9e63-48ca-b930-4f13501b4de4)

Your goal is to attach a the header connector to your Raspberry Pi.

![3662-00 (1)](https://github.com/kodjima33/ADeus/assets/43514161/b968767a-799b-4997-8c0d-44fad1a79d9f)

To every beginner this seems a very hard step but it's actually not that hard. 


**With Soldering**
You'd need to solder the header connector. 
- You can do it  by following these videos [Video1](https://www.youtube.com/watch?v=8Z-2wPWGnqE) and [Video2](https://www.youtube.com/watch?v=UDdbaMk39tM)

**Without soldering:**
- [Follow this guide](https://www.youtube.com/watch?v=IncLvO3mmdc) and use the [solderless pins](https://www.amazon.com/Vilros-Raspberry-Headers-Easy-Installation-Soldering/dp/B0CGRYYY63/ref=sr_1_1?crid=I922BYJ9EVY4&dib=eyJ2IjoiMSJ9.hLsapq3AI0K4IADEQc56qlx0DtBRnjf8VmGz-Sor7t3Bf_UbyZimITYT8B4ojUxofB1pwnaQWyJQ-zZzrv_hDE01zCgJRUtdCRTgE31sfSGH1pBn9koR4mldMizddvYGaAjsEf-qvP0NeffTMTFdoGWvCsGfbdbGgEcAizZjFPyZvAYlYeaoXjd6ySSgx-zL7CQ32vCBScitqHUyKNgi2lkAA8XBzhlZ0P92f-zqPmE.PWxHiswToTA9VCH5mZ2QEqHYYVfnzrZ0bCvaaRaif1s&dib_tag=se&keywords=male+pin+headers+solderless+raspberry&qid=1709077414&sprefix=male+pin+headers+solderless+raspberr%2Caps%2C160&sr=8-1) kit you purchased

This is what you should end up with: 
![raspberry_pi_zero_iso_demo_1B_ORIG](https://github.com/kodjima33/ADeus/assets/43514161/a369b496-45d0-4d47-b235-6ab46e5d46f3)


### 2. Connect your Raspberry Pi with Sugar pi

Step 1: unpack your Raspberry pi sugar battery. it should contain 4-5 screws

Step 2: Following [this video](https://www.youtube.com/watch?v=XA4j9hRiFmw), attach your Pi Sugar to your Raspberry Pi. Note that this video may have screws you don't have (and you don't need them). Attach directly with your screws.

You should end up with something like this: 
![IMG_0098](https://github.com/kodjima33/ADeus/assets/43514161/3f71fab5-830e-42c1-9c78-fefa3e71ff9c)

### 3. Attach header pins to microphone 
![IMG_0096](https://github.com/kodjima33/ADeus/assets/43514161/4d1ed53d-ad8f-4120-8429-5d4a00a29c07)

You need to attach pins to your microphone to be able to connect it to Raspberry Pi later. You may choose to connect the pins first or solder via wires directly (if you are a professional). We will do it with pins. 


**With soldering:**

From your microphone kit, you received 6 yellow pins on the same line. 

Step 1: Since our microphone has 2 lines of pins, you need to break the 6-pin line into 2 pieces (see screenshot for reference). Don't worry to make a mistake, you have 2 more microphones! 

Step 2: Following same guides, solder pins that you got in the same kit with your [Microphone](https://www.amazon.com/AITRIP-Omnidirectional-Microphone-Precision-Interface/dp/B0972XP1YS/ref=pd_ci_mcx_pspc_dp_d_2_t_1?pd_rd_w=a5gvQ&content-id=amzn1.sym.568f3b6b-5aad-4bfd-98ee-d827f03151e4&pf_rd_p=568f3b6b-5aad-4bfd-98ee-d827f03151e4&pf_rd_r=ZD4BWQF760DG2TXHPBZ7&pd_rd_wg=qQDw5&pd_rd_r=94ce375e-d574-4fd5-8356-1fad3c7e61a4&pd_rd_i=B092HWW4RS&th=1).


**Without soldering:**

From your solderless kit, you should have receieved 2x header connectors.

Step 1:  Since you wouldn't need one of the connectors, you should cut/break one of them into smaller pieces. See [this guide](https://www.youtube.com/watch?time_continue=177&v=kQqw9en2Bx8&embeds_referring_euri=https%3A%2F%2Fwww.google.com%2F&source_ve_path=MjM4NTE&feature=emb_title) for reference. 

You need 2 pieces with 3 pins each for your microphone (see image above for reference). 

Step 2:  Once you cut them, connect pins with your microphone the same way you connected your header connector to the board using [Solderless pins kit](https://www.amazon.com/Vilros-Raspberry-Headers-Easy-Installation-Soldering/dp/B0CGRYYY63/ref=sr_1_1?crid=I922BYJ9EVY4&dib=eyJ2IjoiMSJ9.hLsapq3AI0K4IADEQc56qlx0DtBRnjf8VmGz-Sor7t3Bf_UbyZimITYT8B4ojUxofB1pwnaQWyJQ-zZzrv_hDE01zCgJRUtdCRTgE31sfSGH1pBn9koR4mldMizddvYGaAjsEf-qvP0NeffTMTFdoGWvCsGfbdbGgEcAizZjFPyZvAYlYeaoXjd6ySSgx-zL7CQ32vCBScitqHUyKNgi2lkAA8XBzhlZ0P92f-zqPmE.PWxHiswToTA9VCH5mZ2QEqHYYVfnzrZ0bCvaaRaif1s&dib_tag=se&keywords=male+pin+headers+solderless+raspberry&qid=1709077414&sprefix=male+pin+headers+solderless+raspberr%2Caps%2C160&sr=8-1)



### 4. Connect Microphone to your Raspberry Pi

Along with your microphones you received multiple pin  wires. 
- Devide them into 2 groups of 3
- connect these wires to your header pins on your microphone (colors don't matter) 

**Now it's time to connect your microphone to Raspberry Pi.**

Each pin is responsible for a specific task, which is why you need to follow a schema of connecting it correctly. If you make a mistake, something might not work as intended. 

Here is the schema for your microphone
![wires](https://github.com/kodjima33/ADeus/assets/43514161/03e3ebf8-51b2-4d8e-b4d5-5dd53901992f)

If you have a different microphone type by Adafruit, try this ![micro2](https://github.com/kodjima33/ADeus/assets/43514161/237b331e-2a72-41bc-8e6c-7796cfa76b47)

### 5. Assemble everything

In my example, I put everything in the default case of the Vilros Kit. It looks ugly but this is what we will use for V1. Alternatively, you can 3d-print your own case.

- Insert the SD card into your Raspberry Pi Zero W.
- Power on the device to check if everything works (lights should blink)
  You can turn on/off the power on your Pi Sugar board (it has a small switch). Charging should also be done via Pi Sugar. If you charge the board itself, the battery will not be charged.
- Put everything in the case

  ![IMG_0101](https://github.com/kodjima33/ADeus/assets/43514161/27af8e8f-63ce-4716-8c50-f9a07a573fd4)

- put microphone+wires through the lid's hole outside (this way you'll ensure the best audio)
  
   ![IMG_0102](https://github.com/kodjima33/ADeus/assets/43514161/9f60c6b4-0b2c-4e60-bb4a-8adeadb86542)

- Take a scotch tape to attach the lid to the box. It wouldn't fit by default because of our battery
- Put some rope/chain through the lid 

Congratulations! You have successfully set up your Raspberry Pi Zero W for development with your project.

![IMG_0104](https://github.com/kodjima33/ADeus/assets/43514161/13763100-3d34-471d-bb5f-379e452ea971)


### 6. Install software and run
Navigate to [Raspberry Pi Zero W Setup Guide](https://docs.adeus.ai/guides/setup_raspberry_pi_zero.html) to install the software and run 
