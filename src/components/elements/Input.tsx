import React from 'react';
import styles from './Input.module.css';

export type InputProps = {
  error?: boolean;
  variant?: 'default' | 'outline' | 'filled';
} & React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, variant = 'default', className = '', ...props }, ref) => {
    const classes = [styles.input, className].filter(Boolean).join(' ');

    return (
      <input
        ref={ref}
        className={classes}
        data-variant={variant}
        data-error={error ? 'true' : 'false'}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
