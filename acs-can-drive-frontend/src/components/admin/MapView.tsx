import { useState, useEffect } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip, Button, Stack, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Map as MapIcon, FileDownload, Delete, Warning } from '@mui/icons-material';
import { toast } from 'sonner';
import api from '@/services/api';
import { API_ENDPOINTS, API_BASE_URL } from '@/config/api';
import type { MapReservation } from '@/types';

const MapView = () => {
  const [reservations, setReservations] = useState<MapReservation[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<MapReservation | null>(null);

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

  const handleDeleteClick = (reservation: MapReservation) => {
    setReservationToDelete(reservation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reservationToDelete) return;

    try {
      await api.delete(`${API_ENDPOINTS.EVENTS.MAP_RESERVATIONS('1')}/${reservationToDelete.id}`);
      toast.success('Reservation deleted successfully');
      loadReservations(); // Reload the list
    } catch (error) {
      toast.error('Failed to delete reservation');
    } finally {
      setDeleteDialogOpen(false);
      setReservationToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setReservationToDelete(null);
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
                flexDirection: 'column',
                alignItems: 'flex-start',
                py: 2,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {reservation.streetName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={new Date(reservation.createdAt).toLocaleDateString()}
                    size="small"
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteClick(reservation)}
                    sx={{ ml: 1 }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Reserved by: {reservation.studentName || 'Unknown'}
              </Typography>
              
              {/* Group Collection Display */}
              {reservation.groupMembers && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'primary.main' }}>
                    Group Collection Members:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {reservation.groupMembers.split(',').map((member, index) => (
                      <Chip
                        key={index}
                        label={member.trim()}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Delete Reservation
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this reservation?
          </Typography>
          {reservationToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Street: {reservationToDelete.streetName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reserved by: {reservationToDelete.studentName || 'Unknown'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MapView;
