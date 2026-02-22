import { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';
import Z_INDEX from '../config/zIndex';

const CustomSelect = ({ label, icon: Icon, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => 
    typeof opt === 'string' ? opt === value : opt.value === value
  );

  const displayValue = typeof selectedOption === 'string' ? selectedOption : selectedOption?.label;

  return (
    <div className="flex-1 min-w-[180px]" ref={dropdownRef}>
      {label && (
        <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2 uppercase tracking-widest">
          {Icon && <Icon size={10} />}
          <span>{label}</span>
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between bg-dark-900 border ${
            isOpen ? 'border-primary-500 ring-1 ring-primary-500/20' : 'border-dark-700 hover:border-dark-600'
          } rounded-md px-4 py-2.5 text-sm text-white transition-all duration-200`}
        >
          <span className="truncate">{displayValue}</span>
          <FaChevronDown 
            size={10} 
            className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {isOpen && (
          <div 
            className="absolute left-0 right-0 mt-2 py-1 bg-dark-900 border border-dark-700 rounded-md shadow-2xl overflow-hidden animate-fadeIn"
            style={{ zIndex: Z_INDEX.DROPDOWN }}
          >
            <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-dark-800">
              {options.map((option) => {
                const optValue = typeof option === 'string' ? option : option.value;
                const optLabel = typeof option === 'string' ? option : option.label;
                const isSelected = optValue === value;

                return (
                  <button
                    key={optValue}
                    type="button"
                    onClick={() => {
                      onChange(optValue);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors ${
                      isSelected 
                        ? 'bg-primary-600/10 text-primary-400' 
                        : 'text-gray-400 hover:bg-dark-800 hover:text-white'
                    }`}
                  >
                    <span>{optLabel}</span>
                    {isSelected && <FaCheck size={10} className="text-primary-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomSelect;
