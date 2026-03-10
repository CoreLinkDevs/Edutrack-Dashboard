"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X, ImageIcon, FileText, Video, Music, Camera } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileSelect?: (files: FileList) => void
  onUpload?: (files: FileList) => Promise<void>
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  maxFiles?: number
  disabled?: boolean
  className?: string
  children?: React.ReactNode
  showPreview?: boolean
  variant?: "default" | "compact" | "dropzone" | "avatar"
}

interface FileWithPreview extends File {
  preview?: string
}

export function FileUpload({
  onFileSelect,
  onUpload,
  accept = "*/*",
  multiple = false,
  maxSize = 10,
  maxFiles = 1,
  disabled = false,
  className = "",
  children,
  showPreview = true,
  variant = "default",
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const validateFile = useCallback(
    (file: File): boolean => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `File "${file.name}" exceeds ${maxSize}MB limit`,
          variant: "destructive",
        })
        return false
      }

      // Check file type if accept is specified
      if (accept !== "*/*") {
        const acceptedTypes = accept.split(",").map((type) => type.trim())
        const fileType = file.type
        const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`

        const isAccepted = acceptedTypes.some((type) => {
          if (type.startsWith(".")) {
            return type === fileExtension
          }
          if (type.includes("*")) {
            return fileType.startsWith(type.replace("*", ""))
          }
          return fileType === type
        })

        if (!isAccepted) {
          toast({
            title: "Invalid file type",
            description: `File "${file.name}" is not an accepted file type`,
            variant: "destructive",
          })
          return false
        }
      }

      return true
    },
    [accept, maxSize, toast],
  )

  const createPreview = useCallback((file: File): string | undefined => {
    if (file.type.startsWith("image/")) {
      return URL.createObjectURL(file)
    }
    return undefined
  }, [])

  const handleFileSelect = useCallback(
    (files: FileList) => {
      const validFiles: FileWithPreview[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (validateFile(file)) {
          const fileWithPreview = file as FileWithPreview
          if (showPreview) {
            fileWithPreview.preview = createPreview(file)
          }
          validFiles.push(fileWithPreview)
        }
      }

      if (validFiles.length > maxFiles) {
        toast({
          title: "Too many files",
          description: `You can only upload up to ${maxFiles} file(s)`,
          variant: "destructive",
        })
        return
      }

      setSelectedFiles(validFiles)

      // Create a new FileList-like object
      const dataTransfer = new DataTransfer()
      validFiles.forEach((file) => dataTransfer.items.add(file))

      // Automatically trigger onFileSelect for avatar variant
      if (onFileSelect && validFiles.length > 0) {
        onFileSelect(dataTransfer.files)
      }
    },
    [validateFile, maxFiles, showPreview, createPreview, onFileSelect, toast],
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (disabled) return

      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        handleFileSelect(files)
      }
    },
    [disabled, handleFileSelect],
  )

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0 || disabled) return

    setUploading(true)
    setUploadProgress(0)

    try {
      await onUpload?.(new FileListFromArray(selectedFiles))
      toast({
        title: "Upload successful",
        description: "Your files have been uploaded successfully",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }, [selectedFiles, disabled, onUpload, toast])

  const handleRemoveFile = useCallback(
    (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index)
      setSelectedFiles(newFiles)

      // Create a new FileList-like object
      const dataTransfer = new DataTransfer()
      newFiles.forEach((file) => dataTransfer.items.add(file))

      onFileSelect?.(dataTransfer.files)
    },
    [selectedFiles, onFileSelect],
  )

  const FileListFromArray = (files: File[]): FileList => {
    const dataTransfer = new DataTransfer()
    files.forEach((file) => dataTransfer.items.add(file))
    return dataTransfer.files
  }

  // Avatar variant for profile pictures and logos
  if (variant === "avatar") {
    return (
      <div className={cn("relative group", className)}>
        <Input
          type="file"
          accept={accept}
          disabled={disabled}
          ref={fileInputRef}
          onChange={(e) => handleFileSelect(e.target.files || new FileList())}
          className="hidden"
        />

        <div
          className={cn(
            "relative overflow-hidden rounded-full cursor-pointer transition-all duration-200",
            "hover:ring-2 hover:ring-primary hover:ring-offset-2",
            disabled && "cursor-not-allowed opacity-50",
          )}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {children}

          {/* Overlay */}
          <div
            className={cn(
              "absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 transition-opacity duration-200",
              "group-hover:opacity-100",
              dragActive && "opacity-100",
            )}
          >
            <div className="text-white text-center">
              <Camera className="w-4 h-4 mx-auto mb-1" />
              <span className="text-xs font-medium">{uploading ? "Uploading..." : "Change"}</span>
            </div>
          </div>

          {/* Loading overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                <span className="text-xs">Uploading...</span>
              </div>
            </div>
          )}
        </div>

        {/* Drag active indicator */}
        {dragActive && (
          <div className="absolute inset-0 border-2 border-dashed border-primary rounded-full bg-primary/10" />
        )}
      </div>
    )
  }

  // Dropzone variant
  if (variant === "dropzone") {
    return (
      <div className={cn("relative", className)}>
        <Input
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          ref={fileInputRef}
          onChange={(e) => handleFileSelect(e.target.files || new FileList())}
          className="hidden"
        />

        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            "hover:border-primary hover:bg-primary/5",
            dragActive && "border-primary bg-primary/10",
            disabled && "cursor-not-allowed opacity-50",
            "border-gray-300 bg-gray-50",
          )}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            {dragActive ? "Drop files here" : "Click to upload or drag and drop"}
          </p>
          <p className="text-xs text-gray-500">
            {accept === "image/*" ? "PNG, JPG, GIF" : "Various file types"} up to {maxSize}MB
          </p>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  {file.type.startsWith("image/") && <ImageIcon className="w-4 h-4 text-blue-500" />}
                  {file.type.startsWith("text/") && <FileText className="w-4 h-4 text-green-500" />}
                  {file.type.startsWith("video/") && <Video className="w-4 h-4 text-purple-500" />}
                  {file.type.startsWith("audio/") && <Music className="w-4 h-4 text-orange-500" />}
                  <span className="text-sm text-gray-700">{file.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(index)} className="h-6 w-6 p-0">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {uploading && (
          <div className="mt-4">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-gray-500 mt-1">Uploading...</p>
          </div>
        )}
      </div>
    )
  }

  // Default and compact variants
  return (
    <div className={cn("space-y-2", className)}>
      <Input
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        ref={fileInputRef}
        onChange={(e) => handleFileSelect(e.target.files || new FileList())}
        className="hidden"
      />

      {children ? (
        <div onClick={() => !disabled && fileInputRef.current?.click()}>{children}</div>
      ) : (
        <Button onClick={() => fileInputRef.current?.click()} disabled={disabled} variant="outline" className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          {variant === "compact" ? "Upload" : "Choose Files"}
        </Button>
      )}

      {selectedFiles.length > 0 && showPreview && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center space-x-2">
                {file.type.startsWith("image/") && <ImageIcon className="w-4 h-4 text-blue-500" />}
                {file.type.startsWith("text/") && <FileText className="w-4 h-4 text-green-500" />}
                {file.type.startsWith("video/") && <Video className="w-4 h-4 text-purple-500" />}
                {file.type.startsWith("audio/") && <Music className="w-4 h-4 text-orange-500" />}
                <span className="text-sm">{file.name}</span>
              </div>
              {showPreview && file.preview && (
                <img
                  src={file.preview || "/placeholder.svg"}
                  alt={file.name}
                  className="w-8 h-8 rounded object-cover"
                />
              )}
              <Button onClick={() => handleRemoveFile(index)} variant="ghost" size="sm" className="h-6 w-6 p-0">
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-sm text-gray-500">Uploading...</p>
        </div>
      )}
    </div>
  )
}
