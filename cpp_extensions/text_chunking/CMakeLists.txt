cmake_policy(SET CMP0177 NEW)

find_package(OpenSSL REQUIRED)
find_package(PkgConfig REQUIRED)

# Create the pybind11 module
pybind11_add_module(text_chunker text_chunker.cpp)

# Configure RPATH settings for portability
set_target_properties(text_chunker PROPERTIES 
    INSTALL_RPATH "$ORIGIN:$ORIGIN/../../../lib:$ORIGIN/../../../lib64"
    BUILD_WITH_INSTALL_RPATH TRUE
)

# Link against libraries
target_link_libraries(text_chunker PRIVATE 
    OpenSSL::Crypto
)

# Include directories
target_include_directories(text_chunker PRIVATE 
    ${OPENSSL_INCLUDE_DIR}
    ${pybind11_INCLUDE_DIRS}
    ${CMAKE_SOURCE_DIR}/lib/pybind11/include
)

# Install the module
install(TARGETS text_chunker
        DESTINATION ${CMAKE_CURRENT_SOURCE_DIR}/../../core/cpp_modules) 