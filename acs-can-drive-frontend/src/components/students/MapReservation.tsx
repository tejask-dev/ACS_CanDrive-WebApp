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
  onComplete: () => void;
  isTeacher?: boolean;
}

const MapReservation = ({ eventId, studentId, studentName, onComplete, isTeacher = false }: MapReservationProps) => {
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
  
  // Temporary street selection state
  const [tempStreets, setTempStreets] = useState<{ lat: number; lng: number; name: string }[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    loadReservations();
    loadStudents();
    checkExistingReservation();
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
      console.log('Loaded reservations:', response.data);
      setReservations(response.data);
    } catch (error) {
      console.error('Failed to load reservations:', error);
    }
  };

  const checkExistingReservation = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EVENTS.MAP_RESERVATIONS(eventId));
      const existingReservations = response.data;
      
      // Check if this student/teacher already has a reservation
      const existingReservation = existingReservations.find((res: any) => 
        res.studentName === studentName || res.name === studentName
      );
      
      if (existingReservation) {
        // Load existing streets into temporary selection
        // Don't split by comma - treat the entire street_name as one street
        let lat = 42.3149, lng = -83.0364; // Default Windsor coordinates
        try {
          if (existingReservation.geojson) {
            const geojsonData = JSON.parse(existingReservation.geojson);
            if (Array.isArray(geojsonData) && geojsonData.length > 0) {
              // Use the first street's coordinates
              lat = geojsonData[0].lat || lat;
              lng = geojsonData[0].lng || lng;
            } else if (geojsonData.lat && geojsonData.lng) {
              // Single street object
              lat = geojsonData.lat;
              lng = geojsonData.lng;
            }
          }
        } catch (e) {
          console.error('Error parsing geojson:', e);
        }
        
        // Treat the entire street_name as one street
        const existingStreet = { 
          lat, 
          lng, 
          name: existingReservation.streetName.trim() 
        };
        
        setTempStreets([existingStreet]);
        setMyReservations([existingReservation.streetName.trim()]);
        
        toast.info(`You already have a reservation. You can edit it by adding or removing streets.`);
      }
    } catch (error) {
      console.error('Failed to check existing reservations:', error);
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

  const handleReserve = () => {
    console.log('handleReserve called', { selectedPlace, studentName });
    
    if (!selectedPlace) {
      console.log('No selected place');
      return;
    }

    // Check if this street is already reserved by someone else
    const isAlreadyReserved = reservations.some(r => {
      const reservedBy = r.studentName || r.name || '';
      const currentUser = studentName;
      const streetMatch = r.street_name && r.street_name.includes(selectedPlace.name);
      const differentUser = reservedBy.toLowerCase() !== currentUser.toLowerCase();
      
      console.log('Checking reservation:', { 
        street: r.street_name, 
        reservedBy, 
        currentUser, 
        streetMatch, 
        differentUser,
        isReserved: streetMatch && differentUser
      });
      
      return streetMatch && differentUser;
    });

    if (isAlreadyReserved) {
      console.log('Street already reserved');
      toast.error(`${selectedPlace.name} is already reserved by someone else!`);
      setShowInfo(false);
      setSelectedPlace(null);
      return;
    }

    // Add to temporary streets instead of immediately reserving
    console.log('Adding to temp streets:', selectedPlace);
    setTempStreets(prev => {
      const newStreets = [...prev, selectedPlace];
      console.log('New temp streets:', newStreets);
      return newStreets;
    });
    setMyReservations(prev => {
      const newReservations = [...prev, selectedPlace.name];
      console.log('New my reservations:', newReservations);
      return newReservations;
    });
    setShowInfo(false);
    setSelectedPlace(null);
    toast.success(`${selectedPlace.name} added to your selection!`);
  };

  const handleRemoveReservation = (streetName: string) => {
    setMyReservations(myReservations.filter(street => street !== streetName));
    setTempStreets(tempStreets.filter(street => street.name !== streetName));
    toast.success(`${streetName} removed from your selection`);
  };

  const handleCompleteRegistration = async () => {
    if (tempStreets.length === 0) {
      toast.error('Please select at least one street before completing registration');
      return;
    }

    setIsCompleting(true);
    try {
      // Check if this is an edit of existing reservation
      const existingReservation = reservations.find((res: any) => 
        res.studentName === studentName || res.name === studentName
      );

      if (existingReservation) {
        // Update existing reservation
        const streetNames = tempStreets.map(street => street.name).join(', ');
        const geojsonData = tempStreets.map(street => ({
          lat: street.lat,
          lng: street.lng,
          name: street.name
        }));

        const payload: any = {
          name: studentName,
          street_name: streetNames,
          group_members: showGroupCollection ? groupStudents.map(s => `${s.first_name} ${s.last_name}`).join(', ') : '',
          geojson: JSON.stringify(geojsonData),
        };
        
        // For teachers, don't send student_id
        if (!isTeacher) {
          payload.student_id = Number(studentId);
        }

        // Delete old reservation and create new one
        await api.delete(`${API_ENDPOINTS.EVENTS.MAP_RESERVATIONS(eventId)}/${existingReservation.id}`);
        const response = await api.post(API_ENDPOINTS.EVENTS.MAP_RESERVATIONS(eventId), payload);

        if (response.data.error) {
          toast.error(response.data.error);
          return;
        }

        toast.success(`Successfully updated your reservation with ${tempStreets.length} street(s)!`);
      } else {
        // Create new reservation
        const streetNames = tempStreets.map(street => street.name).join(', ');
        const geojsonData = tempStreets.map(street => ({
          lat: street.lat,
          lng: street.lng,
          name: street.name
        }));

        const payload: any = {
          name: studentName,
          street_name: streetNames,
          group_members: showGroupCollection ? groupStudents.map(s => `${s.first_name} ${s.last_name}`).join(', ') : '',
          geojson: JSON.stringify(geojsonData),
        };
        
        // For teachers, don't send student_id
        if (!isTeacher) {
          payload.student_id = Number(studentId);
        }
        
        const response = await api.post(API_ENDPOINTS.EVENTS.MAP_RESERVATIONS(eventId), payload);

        if (response.data.error) {
          toast.error(response.data.error);
          return;
        }

        toast.success(`Successfully reserved ${tempStreets.length} street(s)!`);
      }

      // Clear temporary data
      setTempStreets([]);
      setMyReservations([]);
      setGroupStudents([]);
      setShowGroupCollection(false);
      
      // Reload reservations to show the updated reservation
      loadReservations();
      
      onComplete();
    } catch (error: any) {
      console.error('Registration failed:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to complete registration. Please try again.');
      }
    } finally {
      setIsCompleting(false);
    }
  };

  // Group collection functions
  const addStudentToGroup = () => {
    if (selectedStudent && !groupStudents.find(s => s.id === selectedStudent.id)) {
      // Prevent adding yourself as a group member
      const currentStudentName = studentName.toLowerCase();
      const selectedStudentName = `${selectedStudent.first_name} ${selectedStudent.last_name}`.toLowerCase();
      
      if (currentStudentName === selectedStudentName) {
        toast.error('You cannot add yourself as a group member. You are already the primary collector.');
        return;
      }
      
      setGroupStudents(prev => [...prev, selectedStudent]);
      setSelectedStudent(null);
      toast.success(`${selectedStudent.first_name} ${selectedStudent.last_name} added to group`);
    } else if (selectedStudent) {
      toast.error('Student already in group');
    }
  };

  const removeStudentFromGroup = (studentId: string) => {
    setGroupStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const handleGroupReserve = async () => {
    console.log('handleGroupReserve called', { selectedPlace, groupStudents, studentName });
    
    if (!selectedPlace || groupStudents.length === 0) {
      console.log('Missing required data for group reserve');
      return;
    }

    try {
      const groupNames = groupStudents.map(s => `${s.first_name} ${s.last_name}`).join(', ');
      const payload: any = {
        street_name: selectedPlace.name,
        student_name: studentName,
        group_members: groupNames,
        geojson: JSON.stringify({ 
          lat: selectedPlace.lat, 
          lng: selectedPlace.lng, 
          group: groupNames 
        }),
      };
      
      // For teachers, don't send student_id
      if (!isTeacher) {
        payload.student_id = studentId;
      }
      
      console.log('Sending group reservation payload:', payload);
      const response = await api.post(API_ENDPOINTS.EVENTS.MAP_RESERVATIONS(eventId), payload);
      console.log('Group reservation response:', response.data);

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
      console.log('Parsing geojson for reservation:', r.id, 'geojson:', gj);
      
      // Handle array of coordinates (multiple streets)
      if (Array.isArray(gj) && gj.length > 0) {
        const firstStreet = gj[0];
        const pLat = parseFloat(firstStreet.lat);
        const pLng = parseFloat(firstStreet.lng);
        console.log('Found array coordinates:', { pLat, pLng });
        if (!Number.isNaN(pLat) && !Number.isNaN(pLng)) return { lat: pLat, lng: pLng };
      }
      
      // Handle single coordinate object
      if (gj.lat && gj.lng) {
        const pLat = parseFloat(gj.lat);
        const pLng = parseFloat(gj.lng);
        console.log('Found single coordinates:', { pLat, pLng });
        if (!Number.isNaN(pLat) && !Number.isNaN(pLng)) return { lat: pLat, lng: pLng };
      }
    } catch (error) {
      console.error('Error parsing geojson:', error, r?.geojson);
    }
    
    console.log('No valid coordinates found for reservation:', r.id);
    // Don't use default coordinates - return null if no coordinates found
    // This prevents all streets from appearing at the same location
    return null;
  };

  return (
    <Box>
      {/* Clear Instructions */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'info.light', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'info.dark' }}>
          📍 Street Reservation Instructions
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0 }}>
          <Typography component="li" variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            <strong>Search for streets</strong> using the search box below
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            <strong>Pick ALL your streets in ONE reservation</strong> - don't make multiple separate reservations
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            <strong>If you already have a reservation</strong>, you can edit it by adding or removing streets
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            <strong>Red pins on the map</strong> show streets already reserved by other students
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            <strong>For group members:</strong> Only add your friends' names, NOT your own name
          </Typography>
          <Typography component="li" variant="body2" sx={{ fontWeight: 600 }}>
            <strong>Click "Complete Registration"</strong> when you're done selecting all your streets
          </Typography>
        </Box>
      </Paper>

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
          console.log('Rendering reservation marker:', { reservation: r, pos });
          if (!pos) {
            console.log('No position found for reservation:', r);
            return null;
          }
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
              
              {/* Group Collection Toggle - Hidden for teachers */}
              {!isTeacher && (
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
              )}

              {!isTeacher && showGroupCollection ? (
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

      {/* Debug Info */}
      <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
        <Typography variant="caption">
          Debug: myReservations.length = {myReservations.length}, tempStreets.length = {tempStreets.length}, totalReservations = {reservations.length}
        </Typography>
        {reservations.length > 0 && (
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            Reservations: {reservations.map(r => `${r.street_name || r.streetName} (${r.studentName || r.name})`).join(', ')}
          </Typography>
        )}
      </Box>

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
                onClick={handleCompleteRegistration}
                disabled={isCompleting || myReservations.length === 0}
                sx={{
                  mt: 3,
                  background: 'linear-gradient(135deg, hsl(217, 91%, 35%) 0%, hsl(217, 91%, 55%) 100%)',
                  py: 1.5,
                  fontWeight: 700,
                }}
              >
                {isCompleting ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Completing Registration...
                  </>
                ) : (
                  `Complete Registration (${myReservations.length} streets)`
                )}
              </Button>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default MapReservation;
