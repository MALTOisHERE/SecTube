/**
 * GitHub-style Textarea component
 */

const Textarea = ({
  label,
  required = false,
  error,
  helpText,
  maxLength,
  showCount = true,
  value = '',
  className = '',
  ...props
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-gray-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <textarea
        className={`w-full bg-dark-900 border border-dark-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition resize-none text-white placeholder-gray-500 ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        }`}
        value={value}
        maxLength={maxLength}
        {...props}
      />
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex-1">
          {helpText && !error && <p className="text-xs text-gray-500">{helpText}</p>}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        {showCount && maxLength && (
          <p className="text-xs text-gray-500">{value.length}/{maxLength}</p>
        )}
      </div>
    </div>
  );
};

export default Textarea;
