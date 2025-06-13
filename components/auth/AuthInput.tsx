import { Input } from '@/components/ui/input'; // Removed InputProps
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import React from 'react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> { // Changed to React.InputHTMLAttributes
  label: string;
  id: string;
  icon?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  iconContainerClassName?: string;
}

const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  (
    {
      label,
      id,
      icon,
      type = 'text',
      containerClassName,
      className,
      labelClassName,
      iconContainerClassName,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('space-y-2', containerClassName)}>
        <Label htmlFor={id} className={labelClassName}>
          {label}
        </Label>
        <div className="relative">
          {icon && (
            <div
              className={cn(
                'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground',
                iconContainerClassName
              )}
            >
              {icon}
            </div>
          )}
          <Input
            id={id}
            type={type}
            ref={ref}
            className={cn(icon ? 'pl-10' : '', className)}
            {...props}
          />
        </div>
      </div>
    );
  }
);
AuthInput.displayName = 'AuthInput';
export { AuthInput };
