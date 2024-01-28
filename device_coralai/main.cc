#include <cstdio>
#include <memory>

#if defined(CURL_WIFI)
#include "libs/base/wifi.h"
#endif

#include "libs/a71ch/a71ch.h"
#include "libs/audio/audio_service.h"
#include "libs/base/check.h"
#include "libs/base/gpio.h"
#include "libs/base/led.h"
#include "libs/base/strings.h"
#include "third_party/freertos_kernel/include/FreeRTOS.h"
#include "third_party/freertos_kernel/include/task.h"
#include "third_party/nxp/rt1176-sdk/middleware/lwip/src/include/lwip/dns.h"
#include "third_party/nxp/rt1176-sdk/middleware/lwip/src/include/lwip/tcpip.h"

/* clang-format off */
#include "libs/curl/curl.h"
/* clang-format on */

namespace coralmicro
{
  namespace
  {
    struct DnsCallbackArg
    {
      SemaphoreHandle_t sema;
      const char *hostname;
      ip_addr_t *ip_addr;
    };

    AudioDriverBuffers<16, 28 * 1024> g_audio_buffers;

    size_t CurlWrite(void *contents, size_t size, size_t nmemb, void *param)
    {
      auto *bytes_curled = static_cast<size_t *>(param);
      *bytes_curled += size * nmemb;
      return size * nmemb;
    }

    void SendAudioData(const std::vector<char> &data)
    {
      CURL *curl = curl_easy_init();
      if (curl)
      {
        struct curl_slist *headers = nullptr;
        headers = curl_slist_append(headers, "Content-Type: audio/wav");

        std::string remote_url = "https://ftkkhhdltskogoewnwov.supabase.co/functions/v1/record-audio";
        size_t bytes_curled = 0;

        curl_easy_setopt(curl, CURLOPT_URL, remote_url.c_str());
        curl_easy_setopt(curl, CURLOPT_CAINFO, "coralmicro/ca-certificates.crt");
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, data.data());
        curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, data.size());
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &bytes_curled);

        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, CurlWrite);

        // curl_easy_setopt(curl, CURLOPT_SSLVERSION, CURL_SSLVERSION_TLSv1_2);
        // curl_easy_setopt(curl, CURLOPT_TIMEOUT, 10L); // 10 seconds timeout for dns

        // Enable verbose output
        curl_easy_setopt(curl, CURLOPT_VERBOSE, 1L);
        curl_easy_setopt(curl, CURLOPT_STDERR, stderr);

        // Implementing Retry Mechanism
        int max_retries = 3;
        for (int retry = 0; retry < max_retries; ++retry)
        {
          CURLcode res = curl_easy_perform(curl);

          printf("curl_easy_perform() returned %d\n", res);

          if (res == CURLE_OK)
          {
            printf("Sent %d bytes of audio data.\n", bytes_curled);
            break; // Break out of the loop if successful
          }
          else
          {
            printf("curl_easy_perform() failed: %s\n", curl_easy_strerror(res));
            if (retry < max_retries - 1)
            {
              printf("Retrying in 5 seconds...\n");
              vTaskDelay(pdMS_TO_TICKS(5000)); // Wait for 5 seconds before retrying
            }
          }
        }

        curl_easy_cleanup(curl);
        curl_slist_free_all(headers);
      }
    }

    void Main()
    {
      printf("AdDeus Code version: 0.0.1\r\n");
      LedSet(Led::kStatus, true); // Turn on Status LED to show the board is on.

      // ###################################################### //
      // ################## Network Conf ###################### //
      // ###################################################### //

      std::optional<std::string> our_ip_addr;
#if defined(CURL_WIFI)
      printf("Attempting to use Wi-Fi...\r\n");
      // Uncomment me to use the external antenna.
      // SetWiFiAntenna(WiFiAntenna::kExternal);
      bool success = WiFiTurnOn(/*default_iface=*/true);
      if (!success)
      {
        printf("Failed to turn on Wi-Fi\r\n");
        return;
      }
      success = WiFiConnect();
      if (!success)
      {
        printf("Failed to connect to Wi-Fi\r\n");
        return;
      }
      printf("Wi-Fi connected\r\n");
      our_ip_addr = WiFiGetIp();
#endif

      if (our_ip_addr.has_value())
      {
        printf("DHCP succeeded, our IP is %s.\r\n", our_ip_addr.value().c_str());
      }
      else
      {
        printf("We didn't get an IP via DHCP, not progressing further.\r\n");
        return;
      }

      // Initialize A71CH to provide entropy for SSL.
      bool initSuccess = A71ChInit();
      if (!initSuccess)
      {
        printf("A71ChInit() failed.\n");
        return;
      }

      // ###################################################### //
      // ###################### Recording ##################### //
      // ###################################################### //

      auto sample_rate = AudioSampleRate::k16000_Hz;
      const AudioDriverConfig audio_config{sample_rate, static_cast<size_t>(2),
                                           static_cast<size_t>(50)};
      AudioDriver driver(g_audio_buffers);
      if (!g_audio_buffers.CanHandle(audio_config))
      {
        printf("ERROR: Not enough static memory for DMA buffers\r\n");
        return;
      }

      AudioReader reader(&driver, audio_config);
      std::vector<char> audio_data;

      while (true)
      {
        printf("Recording...\r\n");
        reader.FillBuffer();
        const auto &buffer = reader.Buffer();
        audio_data.insert(audio_data.end(),
                          reinterpret_cast<const char *>(buffer.data()),
                          reinterpret_cast<const char *>(buffer.data()) +
                              buffer.size() * sizeof(int32_t));

        // Send every few seconds
        if (audio_data.size() >=
            16000 * sizeof(int32_t) * 10)
        { // 5 seconds of audio
          printf("Sending audio data...\r\n\r\n\r\n");
          curl_global_init(CURL_GLOBAL_ALL);
          SendAudioData(audio_data);
          curl_global_cleanup();
          printf("\r\n\r\n\r\n");
          audio_data.clear();
        }

        // vTaskDelay(pdMS_TO_TICKS(1000));  // Delay for a while before next
        // recording
      }
    }
  } // namespace
} // namespace coralmicro

extern "C" void app_main(void *param)
{
  (void)param;
  coralmicro::Main();
  vTaskSuspend(nullptr);
}
