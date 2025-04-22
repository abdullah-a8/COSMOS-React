#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <openssl/evp.h>
#include <string>
#include <vector>
#include <sstream>
#include <iomanip>

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
    
    // Create and initialize the context
    EVP_MD_CTX* ctx = EVP_MD_CTX_new();
    
    // Initialize digest engine
    EVP_DigestInit_ex(ctx, EVP_sha256(), nullptr);
    
    // Provide the message to be hashed
    EVP_DigestUpdate(ctx, data, size);
    
    // Finalize the hash
    EVP_DigestFinal_ex(ctx, hash, &hash_len);
    
    // Clean up
    EVP_MD_CTX_free(ctx);
    
    stringstream ss;
    for (unsigned int i = 0; i < hash_len; i++) {
        ss << hex << setw(2) << setfill('0') << static_cast<int>(hash[i]);
    }
    
    return ss.str();
}

/**
 * Python-facing function that accepts a bytes-like object and returns its SHA-256 hash.
 * 
 * @param buffer Python bytes-like object
 * @return Hexadecimal string representation of the SHA-256 hash
 */
string compute_sha256(py::bytes buffer) {
    // Convert Python bytes to C++ string for processing
    string str = static_cast<string>(buffer);
    const unsigned char* data = reinterpret_cast<const unsigned char*>(str.data());
    size_t size = str.size();
    
    return sha256_hash(data, size);
}

/**
 * Alternative version that works directly with Python buffer protocol for
 * potentially better performance with large files
 */
string compute_sha256_buffer(py::buffer buffer) {
    // Request buffer descriptor
    py::buffer_info info = buffer.request();
    
    // Get pointer to data and size
    const unsigned char* data = static_cast<const unsigned char*>(info.ptr);
    size_t size = info.size * info.itemsize;
    
    return sha256_hash(data, size);
}

PYBIND11_MODULE(hash_generator, m) {
    m.doc() = "C++ implementation of SHA-256 hash generation for improved performance";
    
    m.def("compute_sha256", &compute_sha256, 
        py::arg("buffer"),
        "Compute SHA-256 hash of a bytes object");
    
    m.def("compute_sha256_buffer", &compute_sha256_buffer, 
        py::arg("buffer"),
        "Compute SHA-256 hash using buffer protocol for better performance");
} 