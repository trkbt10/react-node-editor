import React from 'react';
import styles from './Label.module.css';

export type LabelProps = {
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  textWrap?: 'normal' | 'nowrap' | 'balance';
  ellipsis?: boolean;
} & React.LabelHTMLAttributes<HTMLLabelElement>

export const Label: React.FC<LabelProps> = ({
  required = false,
  disabled = false,
  align = 'left',
  textWrap = 'normal',
  ellipsis = false,
  className = '',
  children,
  ...props
}) => {
  const classes = [styles.label, className].filter(Boolean).join(' ');

  return (
    <label
      className={classes}
      data-disabled={disabled ? 'true' : 'false'}
      data-align={align}
      data-text-wrap={textWrap}
      data-ellipsis={ellipsis ? 'true' : 'false'}
      {...props}
    >
      {children}
      {required && <span className={styles.required}>*</span>}
    </label>
  );
};
