import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`h-9 rounded-[6px] border border-[#E5E7EB] bg-white px-3 text-sm text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvgxmlns='http://www.w3.org/2000/svg'fill='none'viewBox='0 0 20 20'%3E%3Cpathstroke='%236B7280'stroke-linecap='round'stroke-linejoin='round'stroke-width='1.5'd='M6 8l4 4 4-4'/%3E%3C/svg%3E")] bg-[right_0.5rem_center] bg-no-repeat pr-8 cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
    )
  },
)

Select.displayName = 'Select'
export default Select
