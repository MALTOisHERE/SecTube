/**
 * GitHub-style Select component
 */

const Select = ({
  label,
  required = false,
  error,
  helpText,
  options = [],
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
      <select
        className={`w-full bg-dark-900 border border-dark-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition text-white cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 16 16%27 fill=%27rgb(107,114,128)%27%3e%3cpath d=%27M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z%27/%3e%3c/svg%3e')] bg-[length:1rem] bg-[right_0.5rem_center] bg-no-repeat pr-8 ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        }`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
      {helpText && !error && (
        <p className="text-xs text-gray-500 mt-1.5">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-red-400 mt-1.5">{error}</p>
      )}
    </div>
  );
};

export default Select;
