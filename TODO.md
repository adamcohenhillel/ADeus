- [ ] An easy setup script / deploy my own Ollama server to replace OpenAI [ticket #6](https://github.com/adamcohenhillel/AdDeus/issues/6)
- [ ] Add How-to for Ollama setup ([ticket #9](https://github.com/adamcohenhillel/AdDeus/issues/9))

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

#### UX and Onboarding
