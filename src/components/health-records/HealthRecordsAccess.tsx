import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, Calendar, Download, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface HealthRecord {
  id: string;
  patient_id: string;
  record_type: string;
  title: string;
  description?: string;
  record_data?: any;
  document_url?: string;
  recorded_by?: string;
  recorded_date: string;
  is_sensitive: boolean;
  created_at: string;
  updated_at: string;
}

export const HealthRecordsAccess: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const recordTypes = [
    { value: 'all', label: 'All Records' },
    { value: 'test_result', label: 'Test Results' },
    { value: 'diagnosis', label: 'Diagnoses' },
    { value: 'prescription', label: 'Prescriptions' },
    { value: 'vaccination', label: 'Vaccinations' },
    { value: 'allergy', label: 'Allergies' },
    { value: 'procedure', label: 'Procedures' }
  ];

  useEffect(() => {
    if (user) {
      fetchHealthRecords();
    }
  }, [user]);

  useEffect(() => {
    filterRecords();
  }, [records, searchTerm, typeFilter, dateFilter]);

  const fetchHealthRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('health_records' as any)
        .select('*')
        .eq('patient_id', user?.id)
        .order('recorded_date', { ascending: false });

      if (error) throw error;
      
      // Validate data structure
      const validRecords = (data || []).filter((item: any) => 
        item && typeof item === 'object' && 
        'id' in item && 'title' in item && 'record_type' in item
      ).map((item: any) => ({
        id: item.id,
        patient_id: item.patient_id,
        record_type: item.record_type,
        title: item.title,
        description: item.description,
        record_data: item.record_data,
        document_url: item.document_url,
        recorded_by: item.recorded_by,
        recorded_date: item.recorded_date,
        is_sensitive: Boolean(item.is_sensitive),
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      setRecords(validRecords as HealthRecord[]);
    } catch (error) {
      console.error('Error fetching health records:', error);
      toast({
        title: "Error",
        description: "Failed to load health records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = records;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(record => record.record_type === typeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'last_week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'last_month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'last_year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      if (dateFilter !== 'all') {
        filtered = filtered.filter(record => 
          new Date(record.recorded_date) >= filterDate
        );
      }
    }

    setFilteredRecords(filtered);
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'test_result': return 'bg-blue-100 text-blue-800';
      case 'diagnosis': return 'bg-red-100 text-red-800';
      case 'prescription': return 'bg-green-100 text-green-800';
      case 'vaccination': return 'bg-purple-100 text-purple-800';
      case 'allergy': return 'bg-orange-100 text-orange-800';
      case 'procedure': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const viewRecord = (record: HealthRecord) => {
    // Implementation for viewing record details
    toast({
      title: "Record Details",
      description: `Viewing ${record.title}`,
    });
  };

  const downloadRecord = (record: HealthRecord) => {
    if (record.document_url) {
      // Implementation for downloading record
      window.open(record.document_url, '_blank');
    } else {
      toast({
        title: "No Document",
        description: "This record doesn't have a downloadable document.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading health records...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Health Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recordTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="last_week">Last Week</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {records.length === 0 
                ? "No health records found" 
                : "No records match your search criteria"
              }
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <div key={record.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{record.title}</h4>
                        <Badge className={getRecordTypeColor(record.record_type)}>
                          {record.record_type.replace('_', ' ')}
                        </Badge>
                        {record.is_sensitive && (
                          <Badge variant="destructive">Sensitive</Badge>
                        )}
                      </div>
                      {record.description && (
                        <p className="text-gray-600 mb-2">{record.description}</p>
                      )}
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(record.recorded_date).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewRecord(record)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {record.document_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadRecord(record)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
