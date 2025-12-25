export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    disabled = false,
    loading = false,
    className = '',
    ...props
}) {
    const baseClass = 'btn';
    const variantClass = `btn-${variant}`;
    const sizeClass = size !== 'md' ? `btn-${size}` : '';
    const iconClass = icon && !children ? 'btn-icon' : '';

    return (
        <button
            className={`${baseClass} ${variantClass} ${sizeClass} ${iconClass} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <div className="loading-spinner" style={{ width: 16, height: 16 }} />
            ) : (
                <>
                    {icon && <span className="btn-icon-wrapper">{icon}</span>}
                    {children}
                </>
            )}
        </button>
    );
}
