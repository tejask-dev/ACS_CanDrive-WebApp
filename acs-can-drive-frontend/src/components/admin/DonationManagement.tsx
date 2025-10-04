import { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Autocomplete, Stack } from '@mui/material';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/config/api';
import { toast } from 'sonner';

interface StudentOption { id: string; name: string; grade?: string; homeroomNumber?: string; }

const DonationManagement = () => {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<StudentOption[]>([]);
  const [selected, setSelected] = useState<StudentOption | null>(null);
  const [amount, setAmount] = useState<number>(0);

  const search = async (text: string) => {
    setQuery(text);
    if (text.length < 2) return;
    try {
      const res = await api.get(`${API_ENDPOINTS.EVENTS.STUDENTS('1')}/search`, { params: { q: text } });
      setOptions(res.data);
    } catch (e) {
      // ignore
    }
  };

  const submit = async () => {
    if (!selected || amount <= 0) {
      toast.error('Select a student and enter a positive number of cans');
      return;
    }
    try {
      await api.post(API_ENDPOINTS.EVENTS.DONATIONS('1'), {
        student_id: selected.id,
        admin_id: 1,
        amount,
      });
      toast.success(`Recorded ${amount} cans for ${selected.name}`);
      setAmount(0);
      setSelected(null);
      setQuery('');
    } catch (e) {
      toast.error('Failed to record donation. Student may not exist in database.');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        Record Donations
      </Typography>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <Autocomplete
            sx={{ flex: 2, minWidth: 280 }}
            options={options}
            value={selected}
            getOptionLabel={(o) => o?.name || ''}
            onInputChange={(_, val) => search(val)}
            onChange={(_, val) => setSelected(val)}
            renderInput={(params) => <TextField {...params} label="Student" />}
          />
          <TextField
            sx={{ width: 160 }}
            label="Cans"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            inputProps={{ min: 0 }}
          />
          <Button variant="contained" onClick={submit} sx={{ fontWeight: 700 }}>
            Enter
          </Button>
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          This will increment the student's total and their class totals implicitly.
        </Typography>
      </Paper>
    </Box>
  );
};

export default DonationManagement;


