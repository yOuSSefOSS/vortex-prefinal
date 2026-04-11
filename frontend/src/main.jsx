import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    try {
      fetch('http://localhost:5000/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'errorBoundary', error: String(error), stack: errorInfo.componentStack })
      }).catch(()=>{});
    } catch(e) {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: '#ff4444', padding: '40px', background: '#111', height: '100vh', fontFamily: 'monospace' }}>
          <h2>Application Crashed</h2>
          <p>{this.state.error && this.state.error.toString()}</p>
          <pre style={{ color: '#aaa', whiteSpace: 'pre-wrap', fontSize: '12px', marginTop: '20px' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children; 
  }
}

const originalError = console.error;
console.error = (...args) => {
  originalError(...args);
  try {
    fetch('http://localhost:5000/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'console.error', args: args.map(a => String(a)) })
    }).catch(()=>{});
  } catch(e) {}
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
