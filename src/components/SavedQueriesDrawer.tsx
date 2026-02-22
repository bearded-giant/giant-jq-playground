import { useState, useEffect, useCallback } from 'react';
import {
    Drawer,
    Box,
    Typography,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Divider,
    CircularProgress,
} from '@mui/material';
import { Delete, PlayArrow } from '@mui/icons-material';
import { SavedQueryResponse } from '@/schemas/api';
import { HttpType, OptionsType } from '@/schemas';

export interface SavedQueriesDrawerProps {
    open: boolean;
    onClose: () => void;
    onLoad: (data: { json?: string; http?: HttpType; query: string; options?: OptionsType }) => void;
    currentState: {
        json?: string;
        http?: HttpType;
        query: string;
        options: OptionsType;
    };
}

function relativeTime(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr + 'Z').getTime();
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function SavedQueriesDrawer({ open, onClose, onLoad, currentState }: SavedQueriesDrawerProps) {
    const [queries, setQueries] = useState<SavedQueryResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchQueries = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/queries');
            if (res.ok) setQueries(await res.json());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) fetchQueries();
    }, [open, fetchQueries]);

    const handleSave = async () => {
        if (!saveName.trim()) return;
        setSaving(true);
        try {
            const body: Record<string, unknown> = {
                name: saveName.trim(),
                query: currentState.query,
            };
            if (currentState.json) body.json = currentState.json;
            if (currentState.http) body.http = currentState.http;
            if (currentState.options?.length) body.options = currentState.options;

            const res = await fetch('/api/queries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setSaveName('');
                fetchQueries();
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        await fetch(`/api/queries/${id}`, { method: 'DELETE' });
        fetchQueries();
    };

    const handleLoad = (q: SavedQueryResponse) => {
        onLoad({
            json: q.json ?? undefined,
            http: q.http ?? undefined,
            query: q.query,
            options: q.options ?? undefined,
        });
    };

    return (
        <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 360 } }}>
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Saved Queries</Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Query name"
                        value={saveName}
                        onChange={e => setSaveName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                        fullWidth
                    />
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleSave}
                        disabled={saving || !saveName.trim() || !currentState.query}
                    >
                        Save
                    </Button>
                </Box>

                <Divider />

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : queries.length === 0 ? (
                    <Typography variant="body2" sx={{ py: 2, color: 'text.secondary', textAlign: 'center' }}>
                        No saved queries yet
                    </Typography>
                ) : (
                    <List dense>
                        {queries.map(q => (
                            <ListItem key={q.id} sx={{ pr: 10 }}>
                                <ListItemText
                                    primary={q.name}
                                    secondary={
                                        <>
                                            <Typography component="span" variant="caption" sx={{ color: 'text.secondary', display: 'block', fontFamily: 'monospace' }}>
                                                {q.query.length > 40 ? q.query.slice(0, 40) + '...' : q.query}
                                            </Typography>
                                            <Typography component="span" variant="caption" sx={{ color: 'text.disabled' }}>
                                                {relativeTime(q.updated_at)}
                                            </Typography>
                                        </>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <IconButton edge="end" size="small" onClick={() => handleLoad(q)} title="Load query">
                                        <PlayArrow fontSize="small" />
                                    </IconButton>
                                    <IconButton edge="end" size="small" onClick={() => handleDelete(q.id)} title="Delete query">
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
        </Drawer>
    );
}
