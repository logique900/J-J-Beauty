import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center text-sm text-gray-500 overflow-x-auto whitespace-nowrap hide-scrollbar">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <React.Fragment key={index}>
            {item.onClick && !isLast ? (
              <button 
                onClick={item.onClick}
                className="hover:text-black transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className={isLast ? "text-gray-900 font-medium" : ""}>
                {item.label}
              </span>
            )}
            
            {!isLast && (
              <ChevronRight className="w-4 h-4 mx-2 flex-shrink-0 text-gray-400" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
