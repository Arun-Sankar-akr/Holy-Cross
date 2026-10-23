import React from "react";
import ErrorPage from "./ErrorPage";

/* Shows the 500 page if any page component crashes while rendering.
   Pass resetKey={location.pathname} so navigating away clears the error. */
export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Page crashed:", error, info);
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    return this.state.hasError ? <ErrorPage code={500} /> : this.props.children;
  }
}