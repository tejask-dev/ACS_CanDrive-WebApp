import { useState, useEffect } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip, Button, Stack } from '@mui/material';
import { Map as MapIcon, FileDownload } from '@mui/icons-material';
import { toast } from 'sonner';
import api from '@/services/api';
import { API_ENDPOINTS, API_BASE_URL } from '@/config/api';
import type { MapReservation } from '@/types';

const MapView = () => {
  const [reservations, setReservations] = useState<MapReservation[]>([]);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EVENTS.MAP_RESERVATIONS('1'));
      setReservations(response.data);
    } catch (error) {
      toast.error('Failed to load reservations');
    }
  };

  const handleExport = () => {
    window.open(`${API_BASE_URL}/events/1/map-reservations/export.csv`, '_blank');
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Map Reservations
        </Typography>
        <Button
          variant="contained"
          startIcon={<FileDownload />}
          onClick={handleExport}
          sx={{
            background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 55%) 100%)',
          }}
        >
          Export CSV
        </Button>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <MapIcon color="primary" />
          <Typography variant="h6">
            Total Reserved Streets: {reservations.length}
          </Typography>
          {reservations.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Reserved by {reservations[0].studentName || 'Unknown'} • {new Date(reservations[0].createdAt).toLocaleDateString()}
            </Typography>
          )}
        </Box>

        <List>
          {reservations.map((reservation) => (
            <ListItem
              key={reservation.id}
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': { borderBottom: 'none' },
              }}
            >
              <ListItemText
                primary={reservation.streetName}
                secondary={`Reserved by ${reservation.studentName || 'Unknown'}`}
              />
              <Chip
                label={new Date(reservation.createdAt).toLocaleDateString()}
                size="small"
              />
            </ListItem>
          ))}
        </List>

        {reservations.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No streets reserved yet
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MapView;
