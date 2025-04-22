#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <string>
#include <vector>
#include <utility>
#include <stdexcept>
#include <sstream>
#include <iomanip>
#include <poppler/cpp/poppler-document.h>
#include <poppler/cpp/poppler-page.h>
#include <poppler/cpp/poppler-global.h>
#include <openssl/evp.h>

namespace py = pybind11;
using namespace std;

/**
 * Generate SHA-256 hash of a binary buffer.
 * 
 * @param data The binary data to hash
 * @param size The size of the data in bytes
 * @return Hexadecimal string representation of the hash
 */
string sha256_hash(const unsigned char* data, size_t size) {
    unsigned char hash[EVP_MAX_MD_SIZE];
    unsigned int hash_len;
    
    EVP_MD_CTX* context = EVP_MD_CTX_new();
    EVP_DigestInit_ex(context, EVP_sha256(), NULL);
    EVP_DigestUpdate(context, data, size);
    EVP_DigestFinal_ex(context, hash, &hash_len);
    EVP_MD_CTX_free(context);
    
    stringstream ss;
    for (int i = 0; i < hash_len; i++) {
        ss << hex << setw(2) << setfill('0') << static_cast<int>(hash[i]);
    }
    
    return ss.str();
}

/**
 * Extract text from a PDF file using Poppler.
 * 
 * @param buffer The PDF file data as a binary buffer
 * @return Text content from the PDF
 */
string extract_text_from_pdf_buffer(const string& buffer) {
    // Load document from buffer
    poppler::document* doc = poppler::document::load_from_raw_data(
        buffer.c_str(), static_cast<int>(buffer.size())
    );
    
    if (!doc || doc->is_locked()) {
        throw runtime_error("Failed to load PDF or PDF is encrypted");
    }
    
    // Extract text from each page
    string all_text;
    for (int i = 0; i < doc->pages(); ++i) {
        poppler::page* page = doc->create_page(i);
        if (page) {
            // Get text and convert to string properly
            poppler::ustring page_text = page->text();
            poppler::byte_array utf8_bytes = page_text.to_utf8();
            string utf8_text(utf8_bytes.begin(), utf8_bytes.end());
            all_text += utf8_text;
            all_text += "\n";  // Add newline after each page
            delete page;
        }
    }
    
    delete doc;
    return all_text;
}

/**
 * Python-facing function that accepts PDF data as bytes and returns extracted text and hash.
 * 
 * @param buffer Python bytes-like object containing PDF data
 * @return Tuple of (text, hash)
 */
pair<string, string> extract_pdf_text_and_hash(py::bytes buffer) {
    // Convert Python bytes to C++ string for processing
    string str = static_cast<string>(buffer);
    
    // Calculate hash using SHA-256
    string hash_str = sha256_hash(
        reinterpret_cast<const unsigned char*>(str.data()), 
        str.size()
    );
    
    // Extract text
    string text;
    try {
        text = extract_text_from_pdf_buffer(str);
    } catch (const exception& e) {
        throw runtime_error(string("Error extracting text from PDF: ") + e.what());
    }
    
    return make_pair(text, hash_str);
}

PYBIND11_MODULE(pdf_extractor, m) {
    m.doc() = "C++ implementation of PDF text extraction for improved performance";
    
    m.def("extract_pdf_text_and_hash", &extract_pdf_text_and_hash, 
        py::arg("buffer"),
        "Extract text from a PDF buffer and compute its hash");
} 