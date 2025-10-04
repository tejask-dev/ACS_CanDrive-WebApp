import { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Autocomplete } from '@react-google-maps/api';
import { Box, TextField, Button, Chip, Stack, Paper, Typography, CircularProgress } from '@mui/material';
import { CheckCircle, LocationOn } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/services/api';
import { API_ENDPOINTS, GOOGLE_MAPS_API_KEY } from '@/config/api';
import type { MapReservation as MapReservationType } from '@/types';

const libraries: ('places')[] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '16px',
};

const center = {
  lat: 42.3149,
  lng: -83.0364, // Windsor, Ontario
};

interface MapReservationProps {
  eventId: string;
  studentId: string;
  studentName: string;
  groupMembers?: string;
  onComplete: () => void;
}

const MapReservation = ({ eventId, studentId, studentName, groupMembers, onComplete }: MapReservationProps) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [reservations, setReservations] = useState<MapReservationType[]>([]);
  const [myReservations, setMyReservations] = useState<string[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    loadReservations();
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const loadReservations = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EVENTS.MAP_RESERVATIONS(eventId));
      setReservations(response.data);
    } catch (error) {
      console.error('Failed to load reservations:', error);
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: e.latLng }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const streetName = results[0].formatted_address;
        setSelectedPlace({
          lat: e.latLng!.lat(),
          lng: e.latLng!.lng(),
          name: streetName,
        });
        setShowInfo(true);
      }
    });
  };

  const handlePlaceSelect = () => {
    if (!autocompleteRef.current) return;
    
    const place = autocompleteRef.current.getPlace();
    if (!place.geometry?.location) return;

    setSelectedPlace({
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      name: place.formatted_address || place.name || '',
    });
    setShowInfo(true);
    
    map?.panTo(place.geometry.location);
    map?.setZoom(16);
  };

  const handleReserve = async () => {
    if (!selectedPlace) return;

    try {
      const response = await api.post(API_ENDPOINTS.EVENTS.MAP_RESERVATIONS(eventId), {
        student_id: Number(studentId),
        name: studentName,
        street_name: selectedPlace.name,
        geojson: JSON.stringify({ lat: selectedPlace.lat, lng: selectedPlace.lng, group: groupMembers || '' }),
      });

      // Check if the response indicates an error
      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }

      setMyReservations([...myReservations, selectedPlace.name]);
      setReservations([...reservations, response.data]);
      setShowInfo(false);
      setSelectedPlace(null);
      toast.success(`${selectedPlace.name} reserved successfully!`);
    } catch (error: any) {
      console.error('Reservation failed:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to reserve street. Please try again.');
      }
    }
  };

  if (!isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 500 }}>
        <CircularProgress />
      </Box>
    );
  }

  const getInitials = (name: string) => {
    return (name || '')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getLatLng = (r: any): { lat: number; lng: number } | null => {
    const lat = r?.latitude;
    const lng = r?.longitude;
    if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng };
    try {
      const gj = r?.geojson ? JSON.parse(r.geojson) : {};
      const pLat = parseFloat(gj.lat);
      const pLng = parseFloat(gj.lng);
      if (!Number.isNaN(pLat) && !Number.isNaN(pLng)) return { lat: pLat, lng: pLng };
    } catch {}
    return null;
  };

  return (
    <Box>
      {/* Search */}
      <Autocomplete
        onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
        onPlaceChanged={handlePlaceSelect}
      >
        <TextField
          fullWidth
          placeholder="Search for a street in Windsor..."
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: <LocationOn color="primary" sx={{ mr: 1 }} />,
          }}
        />
      </Autocomplete>

      {/* Map */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        {/* Existing reservations */}
        {reservations.map((reservation) => {
          const r: any = reservation;
          const pos = getLatLng(r);
          if (!pos) return null;
          const key = r.id || `${r.street_name || r.streetName}-${pos.lat}-${pos.lng}`;
          return (
            <Marker
              key={key}
              position={pos}
              label={{
                text: getInitials(r.studentName || r.name || ''),
                color: 'white',
                fontWeight: 'bold',
              }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 20,
                fillColor: (r.studentId || r.student_id || '') == studentId ? '#22c55e' : '#ef4444',
                fillOpacity: 0.9,
                strokeColor: 'white',
                strokeWeight: 2,
              }}
            />
          );
        })}

        {/* Selected place */}
        {selectedPlace && showInfo && (
          <InfoWindow
            position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
            onCloseClick={() => setShowInfo(false)}
          >
            <Paper elevation={0} sx={{ p: 2, minWidth: 200 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                {selectedPlace.name}
              </Typography>
              <Button
                fullWidth
                variant="contained"
                size="small"
                onClick={handleReserve}
                sx={{ background: 'linear-gradient(135deg, hsl(142, 76%, 36%) 0%, hsl(142, 76%, 46%) 100%)' }}
              >
                Reserve This Street
              </Button>
            </Paper>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* My Reservations */}
      <AnimatePresence>
        {myReservations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Paper elevation={2} sx={{ p: 3, mt: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CheckCircle color="success" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Your Reserved Streets ({myReservations.length})
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {myReservations.map((street, index) => (
                  <motion.div
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <Chip
                      label={street}
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </motion.div>
                ))}
              </Stack>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={onComplete}
                sx={{
                  mt: 3,
                  background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 55%) 100%)',
                  py: 1.5,
                  fontWeight: 700,
                }}
              >
                Complete Registration
              </Button>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default MapReservation;
