/**
 * GitHub-style Page header
 */

const PageHeader = ({ icon: Icon, title, subtitle, variant = 'primary' }) => {
  const iconColors = {
    primary: 'text-primary-500',
    danger: 'text-red-500',
    warning: 'text-yellow-500',
  };

  return (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-dark-800">
      {Icon && <Icon className={`text-xl ${iconColors[variant]}`} />}
      <div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

export default PageHeader;
