
cmake_minimum_required(VERSION 3.13)

# Toolchain must be set before project() call.
if (NOT DEFINED CMAKE_TOOLCHAIN_FILE)
    set(CMAKE_TOOLCHAIN_FILE ${CMAKE_CURRENT_LIST_DIR}/coralmicro/cmake/toolchain-arm-none-eabi-gcc.cmake)
endif()

project(coralmicro-app)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)

include_directories(coralmicro)
add_subdirectory(coralmicro)
configure_file(ca-certificates.crt ${CMAKE_BINARY_DIR}/ca-certificates.crt COPYONLY)
include_directories(.)

add_executable_m7(coralmicro-app
    main.cc
)

target_link_libraries(coralmicro-app
    libs_base-m7_freertos
    libs_curl
    libs_a71ch
    libs_base-m7_wifi
)

target_compile_definitions(coralmicro-app PRIVATE
    CURL_WIFI
)
