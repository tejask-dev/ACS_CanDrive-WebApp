/**
 * MapReservation Component
 * 
 * This component provides an interactive Google Maps interface for students and teachers
 * to reserve streets for the can drive event. It includes:
 * - Street search and selection using Google Places Autocomplete
 * - Visual highlighting of reserved streets with hover tooltips
 * - Group collection functionality
 * - Real-time reservation management
 * 
 * Key Features:
 * - Uses Google Maps API to display an interactive map centered on Windsor, Ontario
 * - Highlights reserved streets using Polylines and Circles
 * - Shows student names on hover over reserved streets
 * - Supports both individual and group reservations
 * 
 * @author ACS Can Drive Development Team
 * @component
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Autocomplete, Polyline, Circle } from '@react-google-maps/api';
import { Box, TextField, Button, Chip, Stack, Paper, Typography, CircularProgress, Autocomplete as MuiAutocomplete } from '@mui/material';
import { CheckCircle, LocationOn, Close, Add, Person } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/services/api';
import { API_ENDPOINTS, GOOGLE_MAPS_API_KEY } from '@/config/api';
import type { MapReservation as MapReservationType, Student } from '@/types';

// Google Maps libraries to load - 'places' is needed for Autocomplete
const libraries: ('places' | 'geometry')[] = ['places', 'geometry'];

// Map container styling - defines the size and appearance of the map
const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '16px',
};

// Default map center - Windsor, Ontario coordinates
const center = {
  lat: 42.3149,
  lng: -83.0364,
};

/**
 * Props interface for MapReservation component
 */
interface MapReservationProps {
  eventId: string;           // The event ID for which streets are being reserved
  studentId: string;          // The ID of the student making the reservation
  studentName: string;       // The name of the student making the reservation
  onComplete: () => void;   // Callback function called when reservation is completed
  isTeacher?: boolean;       // Whether the user is a teacher (affects some UI elements)
}

/**
 * Interface for street path data with geometry
 */
interface StreetPath {
  path: google.maps.LatLngLiteral[];  // Array of coordinates forming the street path
  name: string;                        // Street name
  reservationId: string;               // Associated reservation ID
  studentName: string;                 // Name of student who reserved this street
}

/**
 * Main MapReservation Component
 * 
 * This is the primary component that handles street reservations on the map.
 * It manages state for reservations, selected places, and group collections.
 */
const MapReservation = ({ eventId, studentId, studentName, onComplete, isTeacher = false }: MapReservationProps) => {
  // Load Google Maps API with required libraries
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Core state management
  const [map, setMap] = useState<google.maps.Map | null>(null);  // Google Maps instance
  const [reservations, setReservations] = useState<MapReservationType[]>([]);  // All reservations
  const [myReservations, setMyReservations] = useState<string[]>([]);  // Current user's reserved streets
  const [selectedPlace, setSelectedPlace] = useState<{ lat: number; lng: number; name: string } | null>(null);  // Currently selected place
  const [showInfo, setShowInfo] = useState(false);  // Whether to show info window
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);  // Reference to autocomplete input
  
  // Group collection state - allows students to form groups for collecting
  const [students, setStudents] = useState<Student[]>([]);  // All available students
  const [groupStudents, setGroupStudents] = useState<Student[]>([]);  // Students in current group
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);  // Currently selected student for group
  const [showGroupCollection, setShowGroupCollection] = useState(false);  // Whether group collection mode is active
  
  // Temporary street selection state - streets selected but not yet reserved
  const [tempStreets, setTempStreets] = useState<{ lat: number; lng: number; name: string }[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);  // Whether reservation is being processed
  
  // Street path data for highlighting - stores geometry of reserved streets
  const [streetPaths, setStreetPaths] = useState<StreetPath[]>([]);
  const [hoveredStreet, setHoveredStreet] = useState<string | null>(null);  // ID of currently hovered street
  const [hoverPosition, setHoverPosition] = useState<{ lat: number; lng: number } | null>(null);  // Mouse position for hover tooltip

  /**
   * Callback when map loads - initializes the map and loads data
   */
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    loadReservations();
    loadStudents();
    checkExistingReservation();
  }, []);

  /**
   * Load all students from the API for group collection feature
   */
  const loadStudents = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EVENTS.STUDENTS(eventId));
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  /**
   * Callback when map unmounts - cleans up map instance
   */
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  /**
   * Load all reservations from the API and process street paths
   */
  const loadReservations = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EVENTS.MAP_RESERVATIONS(eventId));
      console.log('Loaded reservations:', response.data);
      setReservations(response.data);
      
      // Process reservations to create street paths for highlighting
      await processStreetPaths(response.data);
    } catch (error) {
      console.error('Failed to load reservations:', error);
    }
  };

  /**
   * Process reservations to create street paths using Google Maps Geocoding API
   * This function converts street names into actual path coordinates for highlighting
   * Uses Geocoding API to get street bounds and creates visible path segments
   */
  const processStreetPaths = async (reservations: MapReservationType[]) => {
    if (!isLoaded || !map) return;
    
    const paths: StreetPath[] = [];
    
    for (const reservation of reservations) {
      const r: any = reservation;
      const pos = getLatLng(r);
      if (!pos) continue;
      
      try {
        // Get street name from reservation
        const streetName = r.street_name || r.streetName || '';
        if (!streetName) continue;
        
        // Use Geocoding API to get street geometry
        const geocoder = new google.maps.Geocoder();
        const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoder.geocode(
            { address: `${streetName}, Windsor, ON, Canada` },
            (results, status) => {
              if (status === 'OK' && results) {
                resolve(results);
              } else {
                // If geocoding fails, resolve with empty array (we'll use fallback)
                resolve([]);
              }
            }
          );
        });
        
        let path: google.maps.LatLngLiteral[] = [];
        
        if (result && result.length > 0) {
          const geometry = result[0].geometry;
          
          // Create path from geometry bounds or viewport
          if (geometry.viewport) {
            // Use viewport to create a path along the street
            const bounds = geometry.viewport;
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            
            // Create a path that represents the street (horizontal or vertical line)
            // Determine if street is more horizontal or vertical
            const latDiff = ne.lat() - sw.lat();
            const lngDiff = ne.lng() - sw.lng();
            
            if (Math.abs(lngDiff) > Math.abs(latDiff)) {
              // More horizontal street - create horizontal path
              const midLat = (ne.lat() + sw.lat()) / 2;
              path = [
                { lat: midLat, lng: sw.lng() },
                { lat: midLat, lng: ne.lng() },
              ];
            } else {
              // More vertical street - create vertical path
              const midLng = (ne.lng() + sw.lng()) / 2;
              path = [
                { lat: sw.lat(), lng: midLng },
                { lat: ne.lat(), lng: midLng },
              ];
            }
          } else if (geometry.bounds) {
            // Use bounds if viewport not available
            const bounds = geometry.bounds;
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            const midLat = (ne.lat() + sw.lat()) / 2;
            const midLng = (ne.lng() + sw.lng()) / 2;
            
            // Create a cross pattern to highlight the area
            path = [
              { lat: midLat, lng: sw.lng() },
              { lat: midLat, lng: ne.lng() },
              { lat: sw.lat(), lng: midLng },
              { lat: ne.lat(), lng: midLng },
            ];
          } else {
            // Use location point to create a small visible path
            const center = geometry.location;
            const radius = 0.002; // ~200 meters
            path = [
              { lat: center.lat() - radius, lng: center.lng() - radius },
              { lat: center.lat() + radius, lng: center.lng() + radius },
            ];
          }
        }
        
        // Fallback: if no path created, use coordinates to create a visible segment
        if (path.length === 0) {
          const radius = 0.002; // ~200 meters
          path = [
            { lat: pos.lat - radius, lng: pos.lng - radius },
            { lat: pos.lat + radius, lng: pos.lng + radius },
          ];
        }
        
        paths.push({
          path,
          name: streetName,
          reservationId: r.id || `${r.street_name}-${pos.lat}-${pos.lng}`,
          studentName: r.studentName || r.name || 'Unknown',
        });
      } catch (error) {
        console.error(`Error processing street path for ${r.street_name}:`, error);
        // Fallback: create a simple path from coordinates
        const radius = 0.002; // ~200 meters
        paths.push({
          path: [
            { lat: pos.lat - radius, lng: pos.lng - radius },
            { lat: pos.lat + radius, lng: pos.lng + radius },
          ],
          name: streetName,
          reservationId: r.id || `${r.street_name}-${pos.lat}-${pos.lng}`,
          studentName: r.studentName || r.name || 'Unknown',
        });
      }
    }
    
    setStreetPaths(paths);
  };

  /**
   * Check if the current user already has an existing reservation
   * If so, load it into the temporary selection state
   */
  const checkExistingReservation = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EVENTS.MAP_RESERVATIONS(eventId));
      const existingReservations = response.data;
      
      // Find reservation for current user
      const existingReservation = existingReservations.find((res: any) => 
        res.studentName === studentName || res.name === studentName
      );
      
      if (existingReservation) {
        // Parse coordinates from geojson
        let lat = 42.3149, lng = -83.0364; // Default Windsor coordinates
        try {
          if (existingReservation.geojson) {
            const geojsonData = JSON.parse(existingReservation.geojson);
            if (Array.isArray(geojsonData) && geojsonData.length > 0) {
              lat = geojsonData[0].lat || lat;
              lng = geojsonData[0].lng || lng;
            } else if (geojsonData.lat && geojsonData.lng) {
              lat = geojsonData.lat;
              lng = geojsonData.lng;
            }
          }
        } catch (e) {
          console.error('Error parsing geojson:', e);
        }
        
        // Load existing street into temporary selection
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

  /**
   * Handle place selection from Autocomplete
   * When a user selects a place, show info window and pan map to it
   */
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
    
    // Pan map to selected location
    map?.panTo(place.geometry.location);
    map?.setZoom(16);
  };

  /**
   * Handle street reservation
   * Adds selected street to temporary selection if not already reserved
   */
  const handleReserve = () => {
    console.log('handleReserve called', { selectedPlace, studentName });
    
    if (!selectedPlace) {
      console.log('No selected place');
      return;
    }

    // Check if street is already reserved by someone else
    const isAlreadyReserved = reservations.some(r => {
      const reservedBy = r.studentName || r.name || '';
      const currentUser = studentName;
      const streetMatch = r.street_name && r.street_name.includes(selectedPlace.name);
      const differentUser = reservedBy.toLowerCase() !== currentUser.toLowerCase();
      
      return streetMatch && differentUser;
    });

    if (isAlreadyReserved) {
      toast.error(`${selectedPlace.name} is already reserved by someone else!`);
      setShowInfo(false);
      setSelectedPlace(null);
      return;
    }

    // Add to temporary streets selection
    setTempStreets(prev => [...prev, selectedPlace]);
    setMyReservations(prev => [...prev, selectedPlace.name]);
    setShowInfo(false);
    setSelectedPlace(null);
    toast.success(`${selectedPlace.name} added to your selection!`);
  };

  /**
   * Remove a street from temporary selection
   */
  const handleRemoveReservation = (streetName: string) => {
    setMyReservations(myReservations.filter(street => street !== streetName));
    setTempStreets(tempStreets.filter(street => street.name !== streetName));
    toast.success(`${streetName} removed from your selection`);
  };

  /**
   * Complete the registration process
   * Saves all selected streets as a reservation
   */
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
        
        if (!isTeacher) {
          payload.student_id = Number(studentId);
        }
        
        // Delete old and create new reservation
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
      
      // Reload reservations to show updated data
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

  /**
   * Add a student to the group collection
   */
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

  /**
   * Remove a student from the group
   */
  const removeStudentFromGroup = (studentId: string) => {
    setGroupStudents(prev => prev.filter(s => s.id !== studentId));
  };

  /**
   * Handle group reservation
   */
  const handleGroupReserve = async () => {
    if (!selectedPlace || groupStudents.length === 0) {
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
      
      if (!isTeacher) {
        payload.student_id = studentId;
      }
      
      const response = await api.post(API_ENDPOINTS.EVENTS.MAP_RESERVATIONS(eventId), payload);

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

  // Show loading spinner while Google Maps API loads
  if (!isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 500 }}>
        <CircularProgress />
      </Box>
    );
  }

  /**
   * Get initials from a full name (e.g., "John Doe" -> "JD")
   */
  const getInitials = (name: string) => {
    return (name || '')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * Extract latitude and longitude from a reservation object
   * Handles multiple data formats (geojson, direct lat/lng, etc.)
   */
  const getLatLng = (r: any): { lat: number; lng: number } | null => {
    // Try direct latitude/longitude fields first
    const lat = r?.latitude;
    const lng = r?.longitude;
    if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng };
    
    // Try parsing geojson
    try {
      const gj = r?.geojson ? JSON.parse(r.geojson) : {};
      // Handle array of coordinates (multiple streets)
      if (Array.isArray(gj) && gj.length > 0) {
        const firstStreet = gj[0];
        const pLat = parseFloat(firstStreet.lat);
        const pLng = parseFloat(firstStreet.lng);
        if (!Number.isNaN(pLat) && !Number.isNaN(pLng)) return { lat: pLat, lng: pLng };
      }
      
      // Handle single coordinate object
      if (gj.lat && gj.lng) {
        const pLat = parseFloat(gj.lat);
        const pLng = parseFloat(gj.lng);
        if (!Number.isNaN(pLat) && !Number.isNaN(pLng)) return { lat: pLat, lng: pLng };
      }
    } catch (error) {
      console.error('Error parsing geojson:', error, r?.geojson);
    }
    
    // Return null if no coordinates found (prevents all streets appearing at same location)
    return null;
  };

  /**
   * Handle mouse enter on a street path - show hover tooltip
   */
  const handleStreetMouseEnter = (reservationId: string, position: { lat: number; lng: number }) => {
    setHoveredStreet(reservationId);
    setHoverPosition(position);
  };

  /**
   * Handle mouse leave on a street path - hide hover tooltip
   */
  const handleStreetMouseLeave = () => {
    setHoveredStreet(null);
    setHoverPosition(null);
  };

  return (
    <Box>
      {/* Instructions Panel */}
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
            <strong>Highlighted streets on the map</strong> show streets already reserved by other students
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            <strong>Hover over highlighted streets</strong> to see which student reserved them
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            <strong>For group members:</strong> Only add your friends' names, NOT your own name
          </Typography>
          <Typography component="li" variant="body2" sx={{ fontWeight: 600 }}>
            <strong>Click "Complete Registration"</strong> when you're done selecting all your streets
          </Typography>
        </Box>
      </Paper>

      {/* Street Search Autocomplete */}
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

      {/* Google Map Component */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        {/* Street Path Highlights - Draw actual street paths using Polylines */}
        {isLoaded && streetPaths.map((streetPath) => {
          const reservation = reservations.find((r: any) => 
            (r.id || `${r.street_name}-${getLatLng(r)?.lat}-${getLatLng(r)?.lng}`) === streetPath.reservationId
          );
          
          if (!reservation) return null;
          
          const pos = getLatLng(reservation as any);
          if (!pos) return null;
          
          const isHovered = hoveredStreet === streetPath.reservationId;
          
          return (
            <React.Fragment key={streetPath.reservationId}>
              {/* Polyline highlighting the actual street path */}
              <Polyline
                path={streetPath.path}
                options={{
                  strokeColor: isHovered ? '#2563eb' : '#3b82f6',
                  strokeOpacity: isHovered ? 0.9 : 0.6,
                  strokeWeight: isHovered ? 6 : 4,
                  zIndex: isHovered ? 3 : 2,
                  clickable: true,
                  cursor: 'pointer',
                }}
                onMouseOver={() => handleStreetMouseEnter(streetPath.reservationId, pos)}
                onMouseOut={handleStreetMouseLeave}
              />
              
              {/* Circle highlight around the street for better visibility */}
              {map && (
                <Circle
                  center={pos}
                  radius={300}
                  options={{
                    fillColor: isHovered ? '#2563eb' : '#3b82f6',
                    fillOpacity: isHovered ? 0.3 : 0.2,
                    strokeColor: isHovered ? '#1e40af' : '#2563eb',
                    strokeOpacity: isHovered ? 0.9 : 0.7,
                    strokeWeight: isHovered ? 5 : 3,
                    clickable: false,
                    zIndex: 1,
                  }}
                />
              )}
              
              {/* Marker showing student initials */}
              <Marker
                position={pos}
                label={{
                  text: getInitials(streetPath.studentName),
                  color: 'white',
                  fontWeight: 'bold',
                }}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="18" fill="${isHovered ? '#2563eb' : '#3b82f6'}" stroke="white" stroke-width="3"/>
                      <text x="20" y="26" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white">
                        ${getInitials(streetPath.studentName)}
                      </text>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(40, 40),
                  anchor: new google.maps.Point(20, 20),
                }}
                zIndex={4}
                onMouseOver={() => handleStreetMouseEnter(streetPath.reservationId, pos)}
                onMouseOut={handleStreetMouseLeave}
              />
            </React.Fragment>
          );
        })}

        {/* Hover Tooltip - Shows student name when hovering over a street */}
        {hoveredStreet && hoverPosition && (
          <InfoWindow
            position={hoverPosition}
            onCloseClick={handleStreetMouseLeave}
          >
            <Box sx={{ p: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563eb' }}>
                {streetPaths.find(sp => sp.reservationId === hoveredStreet)?.name || 'Street'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: '#666' }}>
                Reserved by: <strong>{streetPaths.find(sp => sp.reservationId === hoveredStreet)?.studentName || 'Unknown'}</strong>
              </Typography>
            </Box>
          </InfoWindow>
        )}

        {/* Selected Place Info Window */}
        {selectedPlace && showInfo && (
          <InfoWindow
            position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
            onCloseClick={() => setShowInfo(false)}
          >
            <Paper elevation={0} sx={{ p: 2, minWidth: 300 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>
                {selectedPlace.name}
              </Typography>
              
              {/* Show existing reservations for this street */}
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

              {/* Group Collection UI */}
              {!isTeacher && showGroupCollection ? (
                <Box>
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

      {/* My Reservations Panel */}
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
