import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomCardUploadProps {
  onFileUpload: (file: File) => void;
  onFileRemove: () => void;
  uploadedFile: File | null;
  uploadedImageUrl?: string;
  isUploading?: boolean;
}

export const CustomCardUpload: React.FC<CustomCardUploadProps> = ({
  onFileUpload,
  onFileRemove,
  uploadedFile,
  uploadedImageUrl,
  isUploading = false
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, GIF, or WebP image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    onFileUpload(file);
    toast({
      title: "Custom Card Uploaded",
      description: "Your custom invitation card has been uploaded successfully.",
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    onFileRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "Custom Card Removed",
      description: "The custom card has been removed.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-slate-300">Upload Custom Invitation Card</Label>
        <div className="text-xs text-slate-400">
          Upload your custom invitation card image. We'll add guest names and QR codes on top.
        </div>
        <div className="text-xs text-slate-500 bg-slate-700/30 p-2 rounded">
          💡 <strong>Tip:</strong> Your custom card should already contain all event details (date, venue, time, etc.). We only need the event name, type, and RSVP contact for our system.
        </div>
      </div>

      {!uploadedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive 
              ? "border-teal-400 bg-teal-50/10" 
              : "border-slate-600 bg-slate-700/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-200">
                {dragActive ? "Drop your image here" : "Drag and drop your image here"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                or click to browse files
              </p>
            </div>
            <div className="text-xs text-slate-500 text-center">
              <p>Supports: JPEG, PNG, GIF, WebP (max 5MB)</p>
            </div>
          </div>
          
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* File info */}
          <div className="relative border border-slate-600 rounded-lg p-4 bg-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-slate-400">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                disabled={isUploading}
                className="text-slate-400 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {isUploading && (
              <div className="mt-3 p-2 bg-slate-600 rounded text-xs text-slate-300">
                Processing image...
              </div>
            )}
          </div>

          {/* Image preview */}
          {(uploadedImageUrl || uploadedFile) && (
            <div className="border border-slate-600 rounded-lg overflow-hidden bg-slate-700/50">
              <div className="p-3 border-b border-slate-600">
                <p className="text-sm font-medium text-slate-200">Preview</p>
              </div>
              <div className="p-4">
                <img 
                  src={uploadedImageUrl || URL.createObjectURL(uploadedFile!)} 
                  alt="Custom invitation card preview" 
                  className="w-full h-auto max-h-64 object-contain rounded"
                  onError={(e) => {
                    // Fallback to blob URL if server URL fails
                    if (uploadedFile && !uploadedImageUrl) {
                      e.currentTarget.src = URL.createObjectURL(uploadedFile);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 