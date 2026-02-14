/**
 * GitHub-style Input component
 */

const Input = ({
  label,
  required = false,
  error,
  helpText,
  icon: Icon,
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
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <Icon size={16} />
          </div>
        )}
        <input
          className={`w-full bg-dark-900 border border-dark-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition text-white placeholder-gray-500 ${
            Icon ? 'pl-9' : ''
          } ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
          {...props}
        />
      </div>
      {helpText && !error && (
        <p className="text-xs text-gray-500 mt-1.5">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-red-400 mt-1.5">{error}</p>
      )}
    </div>
  );
};

export default Input;
