import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          maxWidth: 480, margin: '80px auto', padding: 32,
          background: '#fff', border: '1px solid #fca5a5', borderRadius: 8, textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ margin: '0 0 8px', color: '#991b1b' }}>Something went wrong</h2>
          <p style={{ color: '#666', marginBottom: 20, fontSize: 14 }}>
            {this.state.error.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.href = '/'; }}
            style={{ background: '#e10600', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}
          >
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
