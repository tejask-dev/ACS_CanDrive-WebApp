import { Box, Typography, Paper, Button, Stack, LinearProgress } from '@mui/material';
import { Upload } from '@mui/icons-material';
import { useState } from 'react';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';

const EventManagement = () => {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const form = new FormData();
    form.append('file', file);
    setUploading(true);
    setResult(null);
    try {
      const res = await api.post(API_ENDPOINTS.EVENTS.UPLOAD_ROSTER('1'), form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(`Added ${res.data.added} students from ${file.name}.`);
    } catch (err) {
      setResult('Upload failed. Please check the file format.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        Events & Roster
      </Typography>
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Upload Student Roster (Excel .xlsx)
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Columns: Last Name, First Name, Grade, Homeroom Number, Homeroom Teacher
        </Typography>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button
            variant="contained"
            startIcon={<Upload />}
            component="label"
            disabled={uploading}
            sx={{
              background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 55%) 100%)',
            }}
          >
            {uploading ? 'Uploading...' : 'Choose File'}
            <input type="file" accept=".xlsx" hidden onChange={handleUpload} />
          </Button>
          {uploading && <Box sx={{ minWidth: 200 }}><LinearProgress /></Box>}
        </Stack>
        {result && (
          <Typography sx={{ mt: 2, fontWeight: 600 }}>{result}</Typography>
        )}
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Danger Zone
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Delete all students, donations, and reservations for this event.
        </Typography>
        <Button
          color="error"
          variant="contained"
          onClick={async () => {
            if (!window.confirm('Are you absolutely sure? This will delete ALL data for event 1.')) return;
            try {
              await api.delete(API_ENDPOINTS.EVENTS.RESET('1'));
              setResult('All event data deleted.');
            } catch (e) {
              setResult('Failed to delete event data.');
            }
          }}
        >
          Delete All Data
        </Button>
      </Paper>
    </Box>
  );
};

export default EventManagement;


