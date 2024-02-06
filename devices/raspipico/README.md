brew install cmake make gcc-arm-embedded libusb minicom

git clone https://github.com/raspberrypi/pico-sdk.git

git submodule update --init

export PICO_SDK_PATH="/Users/adamcohenhillel/Developer/myLibs/pico-sdk"
export PICO_board="pico_w"

cmake -B out -S .

make -C out -j4
