export default function LoadingSpinner({ size = 'md', className = '' }) {
    const sizeClass = size === 'lg' ? 'lg' : '';

    return (
        <div className={`loading-spinner ${sizeClass} ${className}`} />
    );
}

export function LoadingPage() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh'
        }}>
            <LoadingSpinner size="lg" />
        </div>
    );
}
