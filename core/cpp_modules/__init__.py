# This file marks the cpp_modules directory as a Python package
import os
import sys

# Add the cpp_modules directory to the Python path
__dir__ = os.path.dirname(os.path.abspath(__file__))
sys.path.append(__dir__)

# Define what's available for import
__all__ = []

# Try to import the C++ modules
try:
    import text_chunker
    __all__.append('text_chunker')
except ImportError:
    print("C++ text_chunker module not found. Using Python implementation.")

try:
    import pdf_extractor
    __all__.append('pdf_extractor')
except ImportError:
    print("C++ pdf_extractor module not found. Using Python implementation.")

try:
    import hash_generator
    __all__.append('hash_generator')
except ImportError:
    print("C++ hash_generator module not found. Using Python implementation.") 