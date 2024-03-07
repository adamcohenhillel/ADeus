idf_component_register(SRCS "main.cpp"
                            "BLE/server.cpp"
                    INCLUDE_DIRS "." REQUIRES bt PRIV_REQUIRES arduino)
