/**
 * GitHub-style FileUpload component with drag & drop support
 */
import { useState } from 'react';

const FileUpload = ({
  label,
  required = false,
  accept,
  onChange,
  maxSize,
  icon: Icon,
  previewUrl,
  fileName,
  helpText,
  error,
  disabled = false,
  variant = 'default', // 'default' | 'compact' | 'avatar'
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files[0]) {
      const fakeEvent = { target: { files: e.dataTransfer.files } };
      onChange(fakeEvent);
    }
  };

  if (variant === 'avatar') {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium mb-2 text-gray-300">
            {label} {required && <span className="text-red-400">*</span>}
          </label>
        )}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <img
              src={previewUrl || '/default-avatar.svg'}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border border-dark-700"
            />
            <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">Change</span>
            </div>
          </div>
          <div>
            <input
              type="file"
              accept={accept}
              onChange={onChange}
              disabled={disabled}
              className="hidden"
              id="avatar-upload-input"
            />
            <label
              htmlFor="avatar-upload-input"
              className="inline-flex items-center gap-2 cursor-pointer bg-dark-700 hover:bg-dark-600 px-3 py-2 rounded-md transition text-sm font-medium border border-dark-600"
            >
              Choose file
            </label>
            {helpText && (
              <p className="text-xs text-gray-500 mt-1.5">{helpText}</p>
            )}
            {error && (
              <p className="text-xs text-red-400 mt-1.5">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-2 text-gray-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group border-2 border-dashed rounded-md text-center transition cursor-pointer ${
          variant === 'compact' ? 'p-4' : 'p-6'
        } ${
          isDragging
            ? 'border-primary-500 bg-primary-500/5'
            : error
            ? 'border-red-500 bg-red-500/5'
            : 'border-dark-700 bg-dark-900 hover:border-dark-600 hover:bg-dark-800'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          type="file"
          accept={accept}
          onChange={onChange}
          disabled={disabled}
          className="hidden"
          id={`file-upload-${label}`}
        />
        <label
          htmlFor={`file-upload-${label}`}
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          {Icon && (
            <div className="text-gray-500">
              <Icon size={variant === 'compact' ? 20 : 24} />
            </div>
          )}
          <div>
            <span className={`font-medium block text-gray-300 ${variant === 'compact' ? 'text-sm' : 'text-base'}`}>
              {fileName || (isDragging ? 'Drop file here' : 'Click to upload or drag and drop')}
            </span>
            {helpText && (
              <span className="text-xs text-gray-500 mt-1 block">{helpText}</span>
            )}
          </div>
        </label>
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-1.5">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
