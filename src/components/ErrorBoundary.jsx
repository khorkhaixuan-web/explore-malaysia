import { Component } from "react";

// Catches an unexpected crash in any page so the visitor sees a friendly message instead of a blank screen.
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(error); // eslint-disable-line no-console
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="container section narrow center">
        <h1 className="page-title">Something went wrong</h1>
        <p className="page-sub">Sorry, this page could not be shown. Your bookings are safe.</p>
        <a className="btn btn-primary" href="/">Back to home</a>
      </section>
    );
  }
}
