
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MapPin } from 'lucide-react';

interface AppointmentSearchProps {
  onSearch: (location: string, specialty: string, radius: number) => void;
  loading?: boolean;
}

export const AppointmentSearch: React.FC<AppointmentSearchProps> = ({ onSearch, loading = false }) => {
  const [location, setLocation] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [radius, setRadius] = useState(25);

  const specialties = [
    'General Practice', 'Cardiology', 'Dermatology', 'Endocrinology',
    'Gastroenterology', 'Neurology', 'Oncology', 'Orthopedics',
    'Pediatrics', 'Psychiatry', 'Radiology', 'Surgery'
  ];

  const handleSearch = () => {
    onSearch(location, specialty, radius);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Find Healthcare Providers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="location">Your Location</Label>
          <Input
            id="location"
            placeholder="Enter city, ZIP code, or address"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="specialty">Specialty (Optional)</Label>
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All specialties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Specialties</SelectItem>
              {specialties.map((spec) => (
                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="radius">Search Radius</Label>
          <Select value={radius.toString()} onValueChange={(value) => setRadius(Number(value))}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 miles</SelectItem>
              <SelectItem value="25">25 miles</SelectItem>
              <SelectItem value="50">50 miles</SelectItem>
              <SelectItem value="100">100 miles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleSearch} 
          disabled={loading || !location.trim()}
          className="w-full"
        >
          {loading ? 'Searching...' : 'Search Providers'}
        </Button>
      </CardContent>
    </Card>
  );
};
