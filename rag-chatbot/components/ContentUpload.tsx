"use client"

import type React from "react"

import { useState } from "react"
import { Upload, Link } from "lucide-react"

interface ContentUploadProps {
  uploadMethod: "pdf" | "url"
  onUploadMethodChange: (method: "pdf" | "url") => void
  uploadedFile: File | null
  onFileUpload: (file: File) => void
  fetchUrl: string
  onUrlChange: (url: string) => void
  onUrlFetch: () => void
}

export default function ContentUpload({
  uploadMethod,
  onUploadMethodChange,
  uploadedFile,
  onFileUpload,
  fetchUrl,
  onUrlChange,
  onUrlFetch,
}: ContentUploadProps) {
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        setUploadError("Please upload a PDF file.")
        setUploadSuccess(null)
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB
        setUploadError("File size exceeds 10MB limit.")
        setUploadSuccess(null)
        return
      }

      setUploadError(null)
      setUploadSuccess(`File "${file.name}" ready for processing.`)
      onFileUpload(file)
    }
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!fetchUrl.trim()) {
      setUploadError("Please enter a URL.")
      setUploadSuccess(null)
      return
    }

    try {
      new URL(fetchUrl) // Validate URL format
      setUploadError(null)
      setUploadSuccess(`URL "${fetchUrl}" ready for processing.`)
      onUrlFetch()
    } catch (error) {
      setUploadError("Please enter a valid URL.")
      setUploadSuccess(null)
    }
  }

  return (
    <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <h2 className="text-xl font-bold mb-4">Add Content to Knowledge Base</h2>

      {/* Input Method Selection */}
      <div className="mb-4">
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-purple-600"
              checked={uploadMethod === "pdf"}
              onChange={() => onUploadMethodChange("pdf")}
            />
            <span className="ml-2">PDF File</span>
          </label>

          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-purple-600"
              checked={uploadMethod === "url"}
              onChange={() => onUploadMethodChange("url")}
            />
            <span className="ml-2">URL</span>
          </label>
        </div>
      </div>

      {/* PDF Upload */}
      {uploadMethod === "pdf" && (
        <div className="mb-4">
          <label
            htmlFor="pdf-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Upload a PDF File</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">PDF (MAX. 10MB)</p>
            </div>
            <input id="pdf-upload" type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
          </label>

          {uploadedFile && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded flex items-center">
              <span className="truncate flex-1">{uploadedFile.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          )}
        </div>
      )}

      {/* URL Input */}
      {uploadMethod === "url" && (
        <form onSubmit={handleUrlSubmit} className="mb-4">
          <div className="flex">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Link className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <input
                type="text"
                value={fetchUrl}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder="Enter a News URL"
                className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full pl-10 p-2.5"
              />
            </div>
            <button
              type="submit"
              className="ml-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Fetch
            </button>
          </div>
        </form>
      )}

      {/* Success/Error Messages */}
      {uploadSuccess && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-green-800 dark:text-green-300 text-sm">
          {uploadSuccess}
        </div>
      )}

      {uploadError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-800 dark:text-red-300 text-sm">
          {uploadError}
        </div>
      )}
    </div>
  )
}
