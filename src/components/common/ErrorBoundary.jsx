import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
// Imported from the module rather than `@/components/ui` on purpose: the
// ErrorBoundary sits at the app root, so a barrel import pulls the entire CRM
// component library — and its dependencies — into the entry chunk that the
// marketing homepage also loads.
import { Button } from '@/components/ui/Button';

/**
 * Catches render-time errors so one broken component cannot blank the whole
 * app. React only supports this as a class component.
 *
 * The reset path clears the error and remounts the subtree, which is usually
 * enough to recover from a transient bad render (a malformed record, say)
 * without the user losing their session.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Kept as console output rather than a toast: this runs while the tree is
    // already broken, so the less it depends on, the better.
    console.error('Unhandled render error:', error, info?.componentStack);
  }

  handleReset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50 ring-1 ring-inset ring-danger-100">
          <AlertTriangle className="h-6 w-6 text-danger-600" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-semibold text-ink-900">Something broke on this screen</h1>
        <p className="mt-2 max-w-md text-balance text-md text-ink-500">
          The rest of the app is fine. Try again, and if it keeps happening send
          us the details below.
        </p>

        {import.meta.env.DEV && (
          <pre className="scrollbar-slim mt-6 max-h-48 max-w-2xl overflow-auto rounded-xl bg-ink-900 p-4 text-left text-xs text-ink-100">
            {error.stack ?? String(error)}
          </pre>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button icon={RotateCcw} onClick={this.handleReset}>
            Try again
          </Button>
          <Button variant="secondary" onClick={() => window.location.assign('/dashboard')}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }
}
