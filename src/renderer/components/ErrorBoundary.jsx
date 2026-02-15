import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: 20, color: 'red', background: '#000', height: '100vh', overflow: 'auto' }}>
                    <h1>Something went wrong.</h1>
                    <h2>{this.state.error && this.state.error.toString()}</h2>
                    <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
