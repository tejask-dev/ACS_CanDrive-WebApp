import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Autocomplete } from '@react-google-maps/api';
import { Box, TextField, Button, Chip, Stack, Paper, Typography, CircularProgress, Autocomplete as MuiAutocomplete } from '@mui/material';
import { CheckCircle, LocationOn, Close, Add, Person } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/services/api';
import { API_ENDPOINTS, GOOGLE_MAPS_API_KEY } from '@/config/api';
import type { MapReservation as MapReservationType, Student } from '@/types';

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
  
  // Group collection state
  const [students, setStudents] = useState<Student[]>([]);
  const [groupStudents, setGroupStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showGroupCollection, setShowGroupCollection] = useState(false);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    loadReservations();
    loadStudents();
  }, []);

  // Load students for group collection
  const loadStudents = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EVENTS.STUDENTS(eventId));
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

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

  // Removed map clicking functionality - text input only

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

  const handleRemoveReservation = (streetName: string) => {
    setMyReservations(myReservations.filter(street => street !== streetName));
    toast.success(`${streetName} removed from your reservations`);
  };

  // Group collection functions
  const addStudentToGroup = () => {
    if (selectedStudent && !groupStudents.find(s => s.id === selectedStudent.id)) {
      setGroupStudents(prev => [...prev, selectedStudent]);
      setSelectedStudent(null);
    }
  };

  const removeStudentFromGroup = (studentId: string) => {
    setGroupStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const handleGroupReserve = async () => {
    if (!selectedPlace || groupStudents.length === 0) return;

    try {
      const groupNames = groupStudents.map(s => `${s.first_name} ${s.last_name}`).join(', ');
      const response = await api.post(API_ENDPOINTS.EVENTS.MAP_RESERVATIONS(eventId), {
        street_name: selectedPlace.name,
        student_id: studentId,
        student_name: studentName,
        group_members: groupNames,
        geojson: JSON.stringify({ 
          lat: selectedPlace.lat, 
          lng: selectedPlace.lng, 
          group: groupNames 
        }),
      });

      if (response.data) {
        setMyReservations(prev => [...prev, selectedPlace.name]);
        setSelectedPlace(null);
        setShowInfo(false);
        setGroupStudents([]);
        loadReservations();
        toast.success(`Group reservation successful! Reserved for: ${groupNames}`);
      }
    } catch (error) {
      console.error('Error making group reservation:', error);
      toast.error('Failed to make group reservation');
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
        // onClick={handleMapClick} // Removed clicking functionality
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
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#ef4444" stroke="white" stroke-width="3"/>
                    <text x="20" y="26" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white">
                      ${getInitials(r.studentName || r.name || '')}
                    </text>
                  </svg>
                `),
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 20),
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
            <Paper elevation={0} sx={{ p: 2, minWidth: 300 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                {selectedPlace.name}
              </Typography>
              
              {/* Show all students who reserved this street */}
              {(() => {
                const streetReservations = reservations.filter(r => r.street_name === selectedPlace.name);
                if (streetReservations.length > 0) {
                  return (
                    <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                        Reserved by:
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {streetReservations.map((res, index) => (
                          <Chip
                            key={index}
                            label={res.studentName || res.name || 'Unknown'}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Box>
                  );
                }
                return null;
              })()}
              
              {/* Group Collection Toggle */}
              <Box sx={{ mb: 2 }}>
                <Button
                  fullWidth
                  variant={showGroupCollection ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setShowGroupCollection(!showGroupCollection)}
                  startIcon={<Person />}
                  sx={{ mb: 1 }}
                >
                  {showGroupCollection ? 'Individual Collection' : 'Group Collection'}
                </Button>
              </Box>

              {showGroupCollection ? (
                <Box>
                  {/* Student Selection */}
                  <MuiAutocomplete
                    options={students}
                    getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
                    value={selectedStudent}
                    onChange={(_, newValue) => setSelectedStudent(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Student"
                        size="small"
                        fullWidth
                        sx={{ mb: 1 }}
                      />
                    )}
                  />
                  
                  {/* Add Student Button */}
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={addStudentToGroup}
                    startIcon={<Add />}
                    disabled={!selectedStudent}
                    sx={{ mb: 2 }}
                  >
                    Add Student
                  </Button>

                  {/* Group Members */}
                  {groupStudents.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                        Group Members:
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {groupStudents.map((student) => (
                          <Chip
                            key={student.id}
                            label={`${student.first_name} ${student.last_name}`}
                            size="small"
                            onDelete={() => removeStudentFromGroup(student.id)}
                            deleteIcon={<Close />}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Group Reserve Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    onClick={handleGroupReserve}
                    disabled={groupStudents.length === 0}
                    sx={{ background: 'linear-gradient(135deg, hsl(142, 76%, 36%) 0%, hsl(142, 76%, 46%) 100%)' }}
                  >
                    Reserve for Group ({groupStudents.length})
                  </Button>
                </Box>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  onClick={handleReserve}
                  sx={{ background: 'linear-gradient(135deg, hsl(142, 76%, 36%) 0%, hsl(142, 76%, 46%) 100%)' }}
                >
                  Reserve This Street
                </Button>
              )}
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
                      onDelete={() => handleRemoveReservation(street)}
                      deleteIcon={<Close />}
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
