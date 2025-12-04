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
  const [selectedPlace, setSelectedPlace] = useState<{ lat: number; lng: number; name: string; path?: google.maps.LatLngLiteral[] } | null>(null);  // Currently selected place
  const [showInfo, setShowInfo] = useState(false);  // Whether to show info window
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);  // Reference to autocomplete input
  
  // Group collection state - allows students to form groups for collecting
  const [students, setStudents] = useState<Student[]>([]);  // All available students
  const [groupStudents, setGroupStudents] = useState<Student[]>([]);  // Students in current group
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);  // Currently selected student for group
  const [showGroupCollection, setShowGroupCollection] = useState(false);  // Whether group collection mode is active
  
  // Temporary street selection state - streets selected but not yet reserved
  const [tempStreets, setTempStreets] = useState<{ lat: number; lng: number; name: string; path?: google.maps.LatLngLiteral[] }[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);  // Whether reservation is being processed
  
  // Street path data for highlighting - stores geometry of reserved streets
  const [streetPaths, setStreetPaths] = useState<StreetPath[]>([]);
  const [hoveredStreet, setHoveredStreet] = useState<string | null>(null);  // ID of currently hovered street
  const [hoverPosition, setHoverPosition] = useState<{ lat: number; lng: number } | null>(null);  // Mouse position for hover tooltip

  /**
   * Callback when map loads - initializes the map and loads data
   * NOTE: We separate data loading from street path processing because
   * React state updates are async. The useEffect below handles path processing.
   */
  const onLoad = useCallback((map: google.maps.Map) => {
    console.log('Map loaded successfully');
    setMap(map);
    loadReservations();
    loadStudents();
    checkExistingReservation();
  }, []);

  /**
   * Effect to process street paths when BOTH map and reservations are available.
   * This fixes the timing issue where processStreetPaths was called before
   * the map state was updated (React state updates are async).
   */
  useEffect(() => {
    if (isLoaded && map && reservations.length > 0) {
      console.log('Processing street paths for', reservations.length, 'reservations');
      processStreetPathsWithMap(reservations, map);
    }
  }, [isLoaded, map, reservations]);

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
   * Load all reservations from the API
   * NOTE: Street path processing is handled by the useEffect hook that
   * triggers when both map and reservations are available.
   */
  const loadReservations = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EVENTS.MAP_RESERVATIONS(eventId));
      console.log('Loaded reservations:', response.data);
      setReservations(response.data);
      // Street path processing is handled by the useEffect hook
    } catch (error) {
      console.error('Failed to load reservations:', error);
    }
  };

  /**
   * Get the ACTUAL road path using Google Maps Directions API
   * This fetches the real road geometry so we can draw accurate street shapes
   * 
   * @param streetName - Name of the street
   * @param geometry - Place geometry from autocomplete
   * @returns Promise with array of LatLng points following the actual road
   */
  const getActualRoadPath = async (streetName: string, geometry: google.maps.places.PlaceGeometry): Promise<google.maps.LatLngLiteral[]> => {
    return new Promise((resolve) => {
      if (!geometry.viewport && !geometry.location) {
        resolve([]);
        return;
      }

      const directionsService = new google.maps.DirectionsService();
      
      let origin: google.maps.LatLngLiteral;
      let destination: google.maps.LatLngLiteral;
      
      if (geometry.viewport) {
        const bounds = geometry.viewport;
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        
        // Determine street orientation to avoid diagonal lines
        const latDiff = Math.abs(ne.lat() - sw.lat());
        const lngDiff = Math.abs(ne.lng() - sw.lng());
        
        if (lngDiff > latDiff) {
          // Horizontal street - use west to east points at mid latitude
          const midLat = (ne.lat() + sw.lat()) / 2;
          origin = { lat: midLat, lng: sw.lng() };
          destination = { lat: midLat, lng: ne.lng() };
        } else {
          // Vertical street - use south to north points at mid longitude
          const midLng = (ne.lng() + sw.lng()) / 2;
          origin = { lat: sw.lat(), lng: midLng };
          destination = { lat: ne.lat(), lng: midLng };
        }
      } else if (geometry.location) {
        // If no viewport, create points along the street using the location
        const center = geometry.location;
        const offset = 0.005; // ~500m offset
        origin = { lat: center.lat() - offset, lng: center.lng() };
        destination = { lat: center.lat() + offset, lng: center.lng() };
      } else {
        resolve([]);
        return;
      }

      // Request directions to get actual road path
      directionsService.route(
        {
          origin: origin,
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK' && result && result.routes[0]) {
            // Extract the actual path points from the route
            const route = result.routes[0];
            const path: google.maps.LatLngLiteral[] = [];
            
            // Get all points from the overview path (simplified path of entire route)
            if (route.overview_path) {
              route.overview_path.forEach((point) => {
                path.push({ lat: point.lat(), lng: point.lng() });
              });
            }
            
            // If overview_path is empty, try legs
            if (path.length === 0 && route.legs) {
              route.legs.forEach((leg) => {
                leg.steps.forEach((step) => {
                  if (step.path) {
                    step.path.forEach((point) => {
                      path.push({ lat: point.lat(), lng: point.lng() });
                    });
                  }
                });
              });
            }
            
            console.log(`Got actual road path for ${streetName}: ${path.length} points`);
            resolve(path);
          } else {
            console.log(`Directions API failed for ${streetName}, falling back to viewport path`);
            // Fallback to viewport-based path
            resolve(generateFallbackPath(geometry));
          }
        }
      );
    });
  };

  /**
   * Generate a fallback path when Directions API fails
   * Creates a path based on viewport bounds
   */
  const generateFallbackPath = (geometry: google.maps.places.PlaceGeometry): google.maps.LatLngLiteral[] => {
    if (geometry.viewport) {
      const bounds = geometry.viewport;
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      // Determine if street is more horizontal or vertical based on bounds
      const latDiff = ne.lat() - sw.lat();
      const lngDiff = ne.lng() - sw.lng();
      
      // Create multiple points along the street for smoother rendering
      const numPoints = 10;
      const path: google.maps.LatLngLiteral[] = [];
      
      if (Math.abs(lngDiff) > Math.abs(latDiff)) {
        // Horizontal street - create points from west to east
        const midLat = (ne.lat() + sw.lat()) / 2;
        for (let i = 0; i <= numPoints; i++) {
          const lng = sw.lng() + (lngDiff * i / numPoints);
          path.push({ lat: midLat, lng });
        }
      } else {
        // Vertical street - create points from south to north
        const midLng = (ne.lng() + sw.lng()) / 2;
        for (let i = 0; i <= numPoints; i++) {
          const lat = sw.lat() + (latDiff * i / numPoints);
          path.push({ lat, lng: midLng });
        }
      }
      return path;
    } else if (geometry.location) {
      const center = geometry.location;
      const radius = 0.003;
      return [
        { lat: center.lat() - radius, lng: center.lng() },
        { lat: center.lat() + radius, lng: center.lng() },
      ];
    }
    return [];
  };

  /**
   * Generate a visible street path from Google Maps geometry (synchronous fallback)
   * Used when we can't get the actual road path from Directions API
   */
  const generateStreetPath = (geometry: google.maps.places.PlaceGeometry): google.maps.LatLngLiteral[] => {
    return generateFallbackPath(geometry);
  };

  /**
   * Get actual road path from GeocoderResult geometry
   * Used for processing existing reservations
   */
  const getActualRoadPathFromGeometry = async (streetName: string, geometry: google.maps.GeocoderGeometry): Promise<google.maps.LatLngLiteral[]> => {
    return new Promise((resolve) => {
      const directionsService = new google.maps.DirectionsService();
      
      let origin: google.maps.LatLngLiteral;
      let destination: google.maps.LatLngLiteral;
      
      const bounds = geometry.viewport || geometry.bounds;
      
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        
        // Determine street orientation to avoid diagonal lines
        const latDiff = Math.abs(ne.lat() - sw.lat());
        const lngDiff = Math.abs(ne.lng() - sw.lng());
        
        if (lngDiff > latDiff) {
          // Horizontal street - use west to east points at mid latitude
          const midLat = (ne.lat() + sw.lat()) / 2;
          origin = { lat: midLat, lng: sw.lng() };
          destination = { lat: midLat, lng: ne.lng() };
        } else {
          // Vertical street - use south to north points at mid longitude
          const midLng = (ne.lng() + sw.lng()) / 2;
          origin = { lat: sw.lat(), lng: midLng };
          destination = { lat: ne.lat(), lng: midLng };
        }
      } else if (geometry.location) {
        const center = geometry.location;
        const offset = 0.005;
        origin = { lat: center.lat(), lng: center.lng() - offset };
        destination = { lat: center.lat(), lng: center.lng() + offset };
      } else {
        resolve([]);
        return;
      }

      directionsService.route(
        {
          origin: origin,
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK' && result && result.routes[0]) {
            const route = result.routes[0];
            const path: google.maps.LatLngLiteral[] = [];
            
            if (route.overview_path) {
              route.overview_path.forEach((point) => {
                path.push({ lat: point.lat(), lng: point.lng() });
              });
            }
            
            if (path.length === 0 && route.legs) {
              route.legs.forEach((leg) => {
                leg.steps.forEach((step) => {
                  if (step.path) {
                    step.path.forEach((point) => {
                      path.push({ lat: point.lat(), lng: point.lng() });
                    });
                  }
                });
              });
            }
            
            console.log(`Got actual road path for ${streetName}: ${path.length} points`);
            resolve(path);
          } else {
            console.log(`Directions API failed for ${streetName}, using fallback`);
            // Fallback to viewport-based path
            const fallback = generateFallbackPathFromGeocoder(geometry);
            resolve(fallback);
          }
        }
      );
    });
  };

  /**
   * Generate fallback path from GeocoderGeometry
   */
  const generateFallbackPathFromGeocoder = (geometry: google.maps.GeocoderGeometry): google.maps.LatLngLiteral[] => {
    const bounds = geometry.viewport || geometry.bounds;
    if (bounds) {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latDiff = ne.lat() - sw.lat();
      const lngDiff = ne.lng() - sw.lng();
      const numPoints = 10;
      const path: google.maps.LatLngLiteral[] = [];
      
      if (Math.abs(lngDiff) > Math.abs(latDiff)) {
        const midLat = (ne.lat() + sw.lat()) / 2;
        for (let i = 0; i <= numPoints; i++) {
          const lng = sw.lng() + (lngDiff * i / numPoints);
          path.push({ lat: midLat, lng });
        }
      } else {
        const midLng = (ne.lng() + sw.lng()) / 2;
        for (let i = 0; i <= numPoints; i++) {
          const lat = sw.lat() + (latDiff * i / numPoints);
          path.push({ lat, lng: midLng });
        }
      }
      return path;
    } else if (geometry.location) {
      const center = geometry.location;
      const radius = 0.003;
      return [
        { lat: center.lat() - radius, lng: center.lng() },
        { lat: center.lat() + radius, lng: center.lng() },
      ];
    }
    return [];
  };

  /**
   * Process reservations to create street paths for highlighting.
   * This function extracts path data from geojson, falls back to live geocoding,
   * and finally creates simple segments as a last resort.
   * 
   * @param reservationData - Array of reservation objects from the API
   * @param mapInstance - The Google Maps instance (passed explicitly to avoid state timing issues)
   */
  const processStreetPathsWithMap = async (reservationData: MapReservationType[], mapInstance: google.maps.Map) => {
    if (!isLoaded || !mapInstance) {
      console.log('Cannot process street paths - map or Google Maps not ready');
      return;
    }
    
    console.log('Starting street path processing for', reservationData.length, 'reservations');
    const paths: StreetPath[] = [];
    
    for (const reservation of reservationData) {
      const r: any = reservation;
      const pos = getLatLng(r);
      if (!pos) continue;

      let path: google.maps.LatLngLiteral[] = [];

      // 1. Try to get path from cached geojson
      try {
        if (r.geojson && r.geojson !== '{}') {
          const geoData = JSON.parse(r.geojson);
          console.log(`Parsing geojson for ${r.street_name || r.streetName}:`, geoData);
          
          // Handle various geojson formats:
          // Format 1: Array of streets with paths [{ lat, lng, name, path: [...] }]
          if (Array.isArray(geoData) && geoData.length > 0) {
            if (geoData[0].path && Array.isArray(geoData[0].path) && geoData[0].path.length > 0) {
              path = geoData[0].path;
              console.log(`Found path in array format, ${path.length} points`);
            } else if (geoData[0].lat && geoData[0].lng) {
              // Array with coordinates but no path - create segment from coordinates
              const firstStreet = geoData[0];
              const radius = 0.003; // ~300 meters for better visibility
              path = [
                { lat: firstStreet.lat - radius, lng: firstStreet.lng - radius },
                { lat: firstStreet.lat + radius, lng: firstStreet.lng + radius },
              ];
              console.log(`Created path from array coordinates`);
            }
          }
          // Format 2: Single object with path { lat, lng, path: [...] }
          else if (geoData.path && Array.isArray(geoData.path) && geoData.path.length > 0) {
            path = geoData.path;
            console.log(`Found path in object format, ${path.length} points`);
          }
          // Format 3: Single object with just coordinates { lat, lng }
          else if (geoData.lat && geoData.lng) {
            const radius = 0.003;
            path = [
              { lat: geoData.lat - radius, lng: geoData.lng - radius },
              { lat: geoData.lat + radius, lng: geoData.lng + radius },
            ];
            console.log(`Created path from single object coordinates`);
          }
        }
      } catch (e) {
        console.error('Error parsing geojson path:', e, 'geojson was:', r.geojson);
      }
      
      // 2. If no cached path, use Directions API to get ACTUAL road geometry
      if (path.length === 0) {
        try {
          const streetName = r.street_name || r.streetName || '';
          if (streetName) {
            console.log(`Fetching actual road path for reservation: ${streetName}`);
            
            // First, geocode to get the street's geometry
            const geocoder = new google.maps.Geocoder();
            const geocodeResult = await new Promise<google.maps.GeocoderResult[]>((resolve) => {
              geocoder.geocode(
                { address: `${streetName}, Windsor, ON, Canada` },
                (results, status) => {
                  if (status === 'OK' && results) resolve(results);
                  else resolve([]);
                }
              );
            });
            
            if (geocodeResult && geocodeResult.length > 0 && geocodeResult[0].geometry) {
              // Use Directions API to get the actual road path
              const geometry = geocodeResult[0].geometry;
              path = await getActualRoadPathFromGeometry(streetName, geometry);
            }
          }
        } catch (error) {
          console.error(`Failed to get road path for ${r.street_name}:`, error);
        }
      }
        
      // 3. Final fallback: create a visible segment from coordinates
      if (path.length === 0) {
        console.log(`Using fallback path for ${r.street_name || r.streetName}`);
        const radius = 0.003; // ~300 meters for good visibility
        path = [
          { lat: pos.lat - radius, lng: pos.lng },
          { lat: pos.lat + radius, lng: pos.lng },
        ];
      }
        
      paths.push({
        path,
        name: r.street_name || r.streetName || 'Street',
        reservationId: r.id || `${r.street_name}-${pos.lat}-${pos.lng}`,
        studentName: r.studentName || r.name || 'Unknown',
      });
      
      console.log(`Processed street: ${r.street_name || r.streetName}, path points: ${path.length}`);
    }
    
    console.log(`Total street paths processed: ${paths.length}`);
    setStreetPaths(paths);
  };

  /**
   * Legacy wrapper for processStreetPaths (for backward compatibility)
   * @deprecated Use processStreetPathsWithMap instead
   */
  const processStreetPaths = async (reservationData: MapReservationType[]) => {
    if (map) {
      await processStreetPathsWithMap(reservationData, map);
    }
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
          name: existingReservation.streetName.trim(),
          path: [] // Will be populated by processStreetPaths logic if needed, but for temp selection start empty
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
   * Fetches the ACTUAL road geometry using Directions API for accurate street highlighting
   */
  const handlePlaceSelect = async () => {
    if (!autocompleteRef.current) return;
    
    const place = autocompleteRef.current.getPlace();
    if (!place.geometry?.location) return;

    const streetName = place.formatted_address || place.name || '';
    
    // Show loading state immediately
    setSelectedPlace({
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      name: streetName,
      path: [] // Will be filled with actual road path
    });
    setShowInfo(true);
    
    // Pan map to selected location
    map?.panTo(place.geometry.location);
    map?.setZoom(16);

    // Fetch the ACTUAL road path using Directions API
    console.log(`Fetching actual road path for: ${streetName}`);
    const actualPath = await getActualRoadPath(streetName, place.geometry);
    
    // Update with actual path
    setSelectedPlace({
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      name: streetName,
      path: actualPath.length > 0 ? actualPath : generateStreetPath(place.geometry)
    });
    
    console.log(`Street ${streetName} path has ${actualPath.length} points`);
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
          name: street.name,
          path: street.path || [] // Save the generated path
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
          name: street.name,
          path: street.path || [] // Save the generated path
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
          group: groupNames,
          path: selectedPlace.path || []
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
            <strong style={{ color: '#dc2626' }}>🔴 RED highlighted streets</strong> show streets already reserved by other students - you cannot reserve these
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            <strong>Hover over red markers/circles</strong> to see which student reserved that street
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
              {/* Polyline highlighting the actual street path - HIGHLY VISIBLE */}
              <Polyline
                path={streetPath.path}
                options={{
                  strokeColor: isHovered ? '#dc2626' : '#ef4444', // Red for reserved streets (more visible)
                  strokeOpacity: isHovered ? 1.0 : 0.85,
                  strokeWeight: isHovered ? 10 : 8, // Thicker lines for visibility
                  zIndex: isHovered ? 10 : 5,
                  clickable: true,
                  cursor: 'pointer',
                }}
                onMouseOver={() => handleStreetMouseEnter(streetPath.reservationId, pos)}
                onMouseOut={handleStreetMouseLeave}
              />
              
              {/* Circle highlight around the street for maximum visibility */}
              {map && (
                <Circle
                  center={pos}
                  radius={400} // Larger radius for better visibility
                  options={{
                    fillColor: isHovered ? '#dc2626' : '#ef4444', // Red matching polyline
                    fillOpacity: isHovered ? 0.4 : 0.25,
                    strokeColor: isHovered ? '#b91c1c' : '#dc2626',
                    strokeOpacity: isHovered ? 1.0 : 0.8,
                    strokeWeight: isHovered ? 4 : 3,
                    clickable: true,
                    zIndex: isHovered ? 4 : 2,
                  }}
                  onMouseOver={() => handleStreetMouseEnter(streetPath.reservationId, pos)}
                  onMouseOut={handleStreetMouseLeave}
                />
              )}
              
              {/* Marker showing student initials - Red theme for reserved streets */}
              <Marker
                position={pos}
                label={{
                  text: getInitials(streetPath.studentName),
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px',
                }}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="24" cy="24" r="22" fill="${isHovered ? '#b91c1c' : '#dc2626'}" stroke="white" stroke-width="4"/>
                      <text x="24" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="white">
                        ${getInitials(streetPath.studentName)}
                      </text>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(48, 48),
                  anchor: new google.maps.Point(24, 24),
                }}
                zIndex={isHovered ? 15 : 10}
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
            <Box sx={{ p: 1.5, minWidth: 180 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#dc2626', mb: 0.5 }}>
                🚫 RESERVED STREET
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2937', mb: 1 }}>
                {streetPaths.find(sp => sp.reservationId === hoveredStreet)?.name || 'Street'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#4b5563' }}>
                Reserved by: <strong style={{ color: '#dc2626' }}>{streetPaths.find(sp => sp.reservationId === hoveredStreet)?.studentName || 'Unknown'}</strong>
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
