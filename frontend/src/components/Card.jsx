/**
 * GitHub-style Card container
 */

const Card = ({ children, className = '', padding = 'default' }) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={`bg-dark-900 rounded-md border border-dark-800 ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
