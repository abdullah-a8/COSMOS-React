cmake_policy(SET CMP0177 NEW)

find_package(OpenSSL REQUIRED)

# Create the pybind11 module
pybind11_add_module(hash_generator hash_generator.cpp)

# Configure RPATH settings for portability
set_target_properties(hash_generator PROPERTIES 
    INSTALL_RPATH "$ORIGIN:$ORIGIN/../../../lib:$ORIGIN/../../../lib64"
    BUILD_WITH_INSTALL_RPATH TRUE
)

# Link against OpenSSL
target_link_libraries(hash_generator PRIVATE OpenSSL::Crypto)

# Include headers
target_include_directories(hash_generator PRIVATE 
    ${OPENSSL_INCLUDE_DIR}
    ${pybind11_INCLUDE_DIRS}
    ${CMAKE_SOURCE_DIR}/lib/pybind11/include
)

# Install the module
install(TARGETS hash_generator
        DESTINATION ${CMAKE_CURRENT_SOURCE_DIR}/../../core/cpp_modules) 