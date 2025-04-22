"use client"

interface SourceFilterExpanderProps {
  sourceFilters: {
    pdf: boolean
    web: boolean
    youtube: boolean
  }
  onChange: (filters: { pdf: boolean; web: boolean; youtube: boolean }) => void
}

export default function SourceFilterExpander({ sourceFilters, onChange }: SourceFilterExpanderProps) {
  const handleChange = (key: keyof typeof sourceFilters) => {
    onChange({
      ...sourceFilters,
      [key]: !sourceFilters[key],
    })
  }

  const noSourceSelected = !sourceFilters.pdf && !sourceFilters.web && !sourceFilters.youtube

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Knowledge Source Filters</h3>

      <div className="flex flex-wrap gap-4">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="form-checkbox text-purple-600 rounded"
            checked={sourceFilters.pdf}
            onChange={() => handleChange("pdf")}
          />
          <span className="ml-2">PDF Documents</span>
        </label>

        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="form-checkbox text-purple-600 rounded"
            checked={sourceFilters.web}
            onChange={() => handleChange("web")}
          />
          <span className="ml-2">Web Articles</span>
        </label>

        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="form-checkbox text-purple-600 rounded"
            checked={sourceFilters.youtube}
            onChange={() => handleChange("youtube")}
          />
          <span className="ml-2">YouTube Transcripts</span>
        </label>
      </div>

      {noSourceSelected && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-yellow-800 dark:text-yellow-300 text-sm">
          Please select at least one knowledge source type
        </div>
      )}
    </div>
  )
}
