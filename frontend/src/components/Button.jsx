/**
 * GitHub-style Button component
 */

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon: Icon,
  onClick,
  type = 'button',
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed border';

  const variantStyles = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white border-primary-700 shadow-sm',
    secondary: 'bg-dark-700 hover:bg-dark-600 text-white border-dark-600',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-red-700 shadow-sm',
    outline: 'border-dark-700 hover:bg-dark-800 text-gray-300 hover:border-dark-600',
    ghost: 'border-transparent hover:bg-dark-800 text-gray-300',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
