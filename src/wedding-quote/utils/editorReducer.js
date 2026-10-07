/**
 * Editor state with undo/redo (Phase 4.8). Pure — tested without React.
 *  load       replace everything (no history)
 *  apply      { fn } produce next quote from current; pushes history
 *  undo/redo
 *  saved      { quote, version } server answer; adopted only if nothing changed since
 */
export const HISTORY_LIMIT = 100;

export const initialEditorState = { quote: null, past: [], future: [], version: 0, savedVersion: 0 };

export const editorReducer = (state, action) => {
  switch (action.type) {
    case 'load':
      return { quote: action.quote, past: [], future: [], version: 0, savedVersion: 0 };
    case 'apply': {
      if (!state.quote) return state;
      const next = action.fn(state.quote);
      if (next === state.quote || JSON.stringify(next) === JSON.stringify(state.quote)) return state;
      return {
        ...state,
        quote: next,
        past: [...state.past, state.quote].slice(-HISTORY_LIMIT),
        future: [],
        version: state.version + 1,
      };
    }
    case 'undo': {
      if (!state.past.length) return state;
      const prev = state.past[state.past.length - 1];
      return { ...state, quote: prev, past: state.past.slice(0, -1), future: [state.quote, ...state.future], version: state.version + 1 };
    }
    case 'redo': {
      if (!state.future.length) return state;
      const [next, ...rest] = state.future;
      return { ...state, quote: next, past: [...state.past, state.quote], future: rest, version: state.version + 1 };
    }
    case 'saved': {
      if (action.version !== state.version) return { ...state, savedVersion: Math.max(state.savedVersion, action.version) };
      // Nothing changed while saving: adopt the server's authoritative copy.
      return { ...state, quote: action.quote, savedVersion: action.version };
    }
    default:
      return state;
  }
};

export const isDirty = (state) => state.version !== state.savedVersion;
