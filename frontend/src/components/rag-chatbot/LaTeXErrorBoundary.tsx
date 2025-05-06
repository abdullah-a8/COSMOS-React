import React, { Component, ErrorInfo } from 'react';
import { AlertCircle } from 'lucide-react';

interface LaTeXErrorBoundaryProps {
  children: React.ReactNode;
  onError: (error: Error) => void;
}

interface LaTeXErrorBoundaryState {
  hasError: boolean;
}

/**
 * Error boundary component for LaTeX rendering errors
 * Catches rendering errors in LaTeX formulas to prevent chat interface crashes
 */
class LaTeXErrorBoundary extends Component<LaTeXErrorBoundaryProps, LaTeXErrorBoundaryState> {
  constructor(props: LaTeXErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): LaTeXErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError(error);
    console.error('LaTeX rendering error:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <span className="katex-error flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          LaTeX error
        </span>
      );
    }

    return this.props.children;
  }
}

export default LaTeXErrorBoundary; 