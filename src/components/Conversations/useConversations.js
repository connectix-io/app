import { useCallback, useEffect, useRef, useState } from 'react';
import { listConversations, getThread, subscribeToEvents } from './conversationQueries';

// The conversation list (read model) plus the selected thread, kept live: any
// appended event triggers a debounced refetch of both.
export function useConversations() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timer = useRef(null);

  const refreshList = useCallback(async () => {
    try {
      setRows(await listConversations({ status, search }));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  const refreshThread = useCallback(async () => {
    if (!selectedId) { setThread([]); return; }
    try {
      setThread(await getThread(selectedId));
    } catch (err) {
      setError(err.message);
    }
  }, [selectedId]);

  useEffect(() => { refreshList(); }, [refreshList]);
  useEffect(() => { refreshThread(); }, [refreshThread]);

  // Live: batch bursts of events into one refetch.
  useEffect(() => subscribeToEvents(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { refreshList(); refreshThread(); }, 300);
  }), [refreshList, refreshThread]);

  const selected = rows.find((r) => r.id === selectedId) || null;

  return {
    rows, loading, error, status, setStatus, search, setSearch,
    selectedId, setSelectedId, selected, thread,
    refresh: () => { refreshList(); refreshThread(); },
  };
}
