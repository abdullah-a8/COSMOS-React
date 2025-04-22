cmake_minimum_required(VERSION 3.30.0)
project(cosmos_cpp_extensions)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Find Python
find_package(Python 3.8 REQUIRED COMPONENTS Interpreter Development)

# Find pybind11
include(FetchContent)
FetchContent_Declare(
  pybind11
  GIT_REPOSITORY https://github.com/pybind/pybind11.git
  GIT_TAG        v2.13.6  # Adjust to the latest stable version
)
FetchContent_MakeAvailable(pybind11)

# Include all subdirectories
add_subdirectory(text_chunking)
add_subdirectory(pdf_extraction)
add_subdirectory(hash_generation) 