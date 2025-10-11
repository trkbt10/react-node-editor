import React from 'react';
import styles from './SwitchInput.module.css';

export type SwitchInputProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  label?: string;
  id?: string;
  className?: string;
}

export const SwitchInput: React.FC<SwitchInputProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'medium',
  label,
  id,
  className = '',
}) => {
  const classes = [styles.switch, className].filter(Boolean).join(' ');

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div className={styles.switchContainer}>
      <div
        className={classes}
        data-size={size}
        data-checked={checked ? 'true' : 'false'}
        data-disabled={disabled ? 'true' : 'false'}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        id={id}
      >
        <div className={styles.track}>
          <div className={styles.thumb} />
        </div>
      </div>
      {label && (
        <label 
          htmlFor={id} 
          className={styles.switchLabel}
          data-disabled={disabled ? 'true' : 'false'}
          onClick={handleClick}
        >
          {label}
        </label>
      )}
    </div>
  );
};
