#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <string>
#include <vector>
#include <regex>
#include <iostream>
#include <chrono>

namespace py = pybind11;
using namespace std;

/**
 * Splits text into chunks of specified size with overlap.
 * This is a recursive character splitter implementation that mimics the behavior
 * of RecursiveCharacterTextSplitter from LangChain.
 * 
 * @param text The input text to split
 * @param chunk_size The target size of each chunk (in characters)
 * @param chunk_overlap The number of characters to overlap between chunks
 * @return A vector of text chunks
 */
vector<string> split_text(const string& text, int chunk_size, int chunk_overlap) {
    vector<string> chunks;
    
    // Return text as single chunk if it's already small enough
    if (text.length() <= static_cast<size_t>(chunk_size)) {
        chunks.push_back(text);
        return chunks;
    }
    
    // Reserve capacity for better performance
    size_t estimated_chunks = text.length() / max(1, chunk_size - chunk_overlap) + 1;
    chunks.reserve(estimated_chunks);
    
    // Split by separator - trying double newlines first
    vector<string> splits;
    
    size_t start_pos = 0;
    size_t next_pos = 0;
    const string double_newline = "\n\n";
    
    // Try paragraph splitting first (double newlines)
    bool has_paragraph_splits = false;
    while ((next_pos = text.find(double_newline, start_pos)) != string::npos) {
        has_paragraph_splits = true;
        splits.push_back(text.substr(start_pos, next_pos - start_pos));
        start_pos = next_pos + double_newline.length();
    }
    
    // Add the last piece
    if (has_paragraph_splits && start_pos < text.length()) {
        splits.push_back(text.substr(start_pos));
    }
    
    // Merge small paragraph splits into chunks
    if (has_paragraph_splits) {
        string current_chunk;
        current_chunk.reserve(chunk_size + chunk_overlap);
        
        for (const auto& split : splits) {
            // Start new chunk if adding this split would exceed chunk_size
            if (!current_chunk.empty() && 
                current_chunk.length() + split.length() + double_newline.length() > static_cast<size_t>(chunk_size)) {
                chunks.push_back(current_chunk);
                
                // Handle overlap
                if (chunk_overlap > 0 && current_chunk.length() > static_cast<size_t>(chunk_overlap)) {
                    current_chunk = current_chunk.substr(current_chunk.length() - chunk_overlap);
                } else {
                    current_chunk.clear();
                }
            }
            
            if (current_chunk.empty()) {
                current_chunk = split;
            } else {
                current_chunk += double_newline + split;
            }
        }
        
        // Add final chunk
        if (!current_chunk.empty()) {
            chunks.push_back(current_chunk);
        }
        
        if (!chunks.empty()) {
            return chunks;
        }
    }
    
    // If paragraph splitting didn't work well, try by single newlines
    splits.clear();
    start_pos = 0;
    next_pos = 0;
    const string single_newline = "\n";
    
    bool has_newline_splits = false;
    while ((next_pos = text.find(single_newline, start_pos)) != string::npos) {
        has_newline_splits = true;
        splits.push_back(text.substr(start_pos, next_pos - start_pos));
        start_pos = next_pos + single_newline.length();
    }
    
    if (has_newline_splits && start_pos < text.length()) {
        splits.push_back(text.substr(start_pos));
    }
    
    // Process single newline splits
    if (has_newline_splits) {
        string current_chunk;
        current_chunk.reserve(chunk_size + chunk_overlap);
        
        for (const auto& split : splits) {
            if (!current_chunk.empty() && 
                current_chunk.length() + split.length() + single_newline.length() > static_cast<size_t>(chunk_size)) {
                chunks.push_back(current_chunk);
                
                if (chunk_overlap > 0 && current_chunk.length() > static_cast<size_t>(chunk_overlap)) {
                    current_chunk = current_chunk.substr(current_chunk.length() - chunk_overlap);
                } else {
                    current_chunk.clear();
                }
            }
            
            if (current_chunk.empty()) {
                current_chunk = split;
            } else {
                current_chunk += single_newline + split;
            }
        }
        
        if (!current_chunk.empty()) {
            chunks.push_back(current_chunk);
        }
        
        if (!chunks.empty()) {
            return chunks;
        }
    }
    
    // Fall back to simple character-based chunks if all else fails
    chunks.clear();
    chunks.reserve((text.length() / (chunk_size - chunk_overlap)) + 1);
    
    for (size_t i = 0; i < text.length(); i += chunk_size - chunk_overlap) {
        size_t end = min(i + chunk_size, text.length());
        chunks.push_back(text.substr(i, end - i));
    }
    
    return chunks;
}

/**
 * Overloaded version with default parameters that supports word-based chunking 
 * similar to the Python implementation
 */
vector<string> split_text_with_word_count(const string& text, int chunk_size_words, int chunk_overlap_words) {
    // Estimate average word length from sample
    size_t sample_size = min(text.length(), static_cast<size_t>(500));
    string sample = text.substr(0, sample_size);
    
    size_t word_count = 0;
    bool in_word = false;
    
    for (char c : sample) {
        if (isspace(c)) {
            in_word = false;
        } else if (!in_word) {
            in_word = true;
            word_count++;
        }
    }
    
    // Use average word length or default to 6 if sample has no words
    int avg_word_length = word_count > 0 ? static_cast<int>(sample_size / word_count) + 1 : 6;
    
    // Convert to character counts
    int chunk_size_chars = chunk_size_words * avg_word_length;
    int chunk_overlap_chars = chunk_overlap_words * avg_word_length;
    
    return split_text(text, chunk_size_chars, chunk_overlap_chars);
}

PYBIND11_MODULE(text_chunker, m) {
    m.doc() = "C++ implementation of text chunking for improved performance";
    
    m.def("split_text", &split_text, 
        py::arg("text"), 
        py::arg("chunk_size"), 
        py::arg("chunk_overlap"),
        "Split text into chunks (character-based)");
    
    m.def("split_text_with_word_count", &split_text_with_word_count, 
        py::arg("text"), 
        py::arg("chunk_size_words"), 
        py::arg("chunk_overlap_words"),
        "Split text into chunks based on word counts");
} 