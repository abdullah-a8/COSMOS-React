# COSMOS C++ Extensions

This directory contains C++ implementations of performance-critical components for the COSMOS project.

## Prerequisites

- CMake 3.14 or newer
- A C++17 compatible compiler (GCC 9+, Clang 10+, MSVC 19.14+)
- Python 3.8 or newer with development headers

## Building the Extensions

### Option 1: Using setuptools

```bash
# From the cpp_extensions directory
pip install -e .
```

This will build all the C++ extensions and install them in development mode.

### Option 2: Using CMake directly

```bash
# From the cpp_extensions directory
mkdir build
cd build
cmake ..
make
make install
```

## Performance Results

### Text Chunker

The C++ text chunker implementation shows significant performance improvements over the Python version:

| Document Size | Python (seconds) | C++ (seconds) | Speedup |
|---------------|------------------|---------------|---------|
| Small (~500 words)   | 0.0004           | 0.00002        | ~21.8x   |
| Medium (~5,300 words) | 0.0016          | 0.0002        | ~9.5x    |
| Large (~60,750 words) | 0.0173          | 0.0018        | ~9.6x    |

These improvements become more significant with larger documents, which is exactly the use case the optimization targets.

## Usage

After building, the C++ extensions will be available in the `core/cpp_modules` directory and can be imported in Python:

```python
from core.cpp_modules import text_chunker

# Use the C++ implementation
chunks = text_chunker.split_text_with_word_count(text, chunk_size, chunk_overlap)
```

The original Python implementation is retained as a fallback in case the C++ module is not available.

## Components

### 1. Text Chunker

The `text_chunker` module provides a high-performance implementation of the text chunking algorithm used in the RAG pipeline.

Key optimizations:
- Uses native string operations instead of regular expressions for simple patterns
- Pre-allocates memory for vectors and strings
- Uses more accurate word length estimation
- Minimizes string copies and temporaries

### 2. PDF Extractor (Coming Soon)

The `pdf_extractor` module will provide a high-performance implementation of PDF text extraction.

### 3. Hash Generator (Coming Soon)

The `hash_generator` module will provide a high-performance implementation of file hashing. 