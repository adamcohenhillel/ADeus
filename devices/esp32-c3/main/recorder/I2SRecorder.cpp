#include "I2SRecorder.h"
#include "soc/i2s_reg.h"
// Constructor with renamed parameters
I2SRecorder::I2SRecorder(int sck, int ws, int din, int mclk)
    : sck(sck), ws(ws), din(din), mclk(mclk) // Use member initializer list
{
}

void I2SRecorder::setup()
{
    I2S.setPins(sck, ws, -1, din, mclk); // Use the renamed variables
    I2S.begin(I2S_MODE_STD, 16000, I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_MONO);
    // REG_SET_BIT(I2S_TIMING_REG(I2S_NUM_0), BIT(9));
    // REG_SET_BIT(I2S_CONF_REG(I2S_NUM_0), I2S_RX_MSB_SHIFT);
}

size_t I2SRecorder::record(char *buffer, size_t bufferSize)
{
    return I2S.readBytes(buffer, bufferSize); // Read data from I2S
}
