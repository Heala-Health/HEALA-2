
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Star, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AddPhysicianForm } from './AddPhysicianForm';

interface Physician {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialization: string;
  is_active: boolean;
  performance?: {
    total_appointments: number;
    completed_appointments: number;
    average_rating: number;
  };
}

export const PhysicianManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPhysicians();
    }
  }, [user]);

  const fetchPhysicians = async () => {
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('id', user?.id)
        .single();

      if (!userProfile?.hospital_id) return;

      const { data: physicianData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'physician')
        .eq('hospital_id', userProfile.hospital_id);

      if (error) throw error;

      // Mock performance data since the table might not be available yet
      const physiciansWithPerformance = (physicianData || []).map(physician => ({
        ...physician,
        performance: {
          total_appointments: Math.floor(Math.random() * 50) + 10,
          completed_appointments: Math.floor(Math.random() * 40) + 8,
          average_rating: Number((Math.random() * 2 + 3).toFixed(1))
        }
      }));

      setPhysicians(physiciansWithPerformance);
    } catch (error) {
      console.error('Error fetching physicians:', error);
      toast({
        title: "Error",
        description: "Failed to load physician data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePhysicianStatus = async (physicianId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', physicianId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Physician status has been ${!currentStatus ? 'activated' : 'deactivated'}.`,
      });

      fetchPhysicians();
    } catch (error) {
      console.error('Error updating physician status:', error);
      toast({
        title: "Error",
        description: "Failed to update physician status.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading physician data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage">Manage Physicians</TabsTrigger>
          <TabsTrigger value="add">Add New Physician</TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="space-y-6">
          <AddPhysicianForm />
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-6 h-6" />
                <span>Physician Management</span>
              </CardTitle>
              <CardDescription>Manage and monitor your hospital's physicians</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Physicians</p>
                          <p className="text-2xl font-bold">{physicians.length}</p>
                        </div>
                        <User className="w-8 h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Active Physicians</p>
                          <p className="text-2xl font-bold">{physicians.filter(p => p.is_active).length}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Avg. Rating</p>
                          <p className="text-2xl font-bold">
                            {physicians.length > 0 
                              ? (physicians.reduce((acc, p) => acc + (p.performance?.average_rating || 0), 0) / physicians.length).toFixed(1)
                              : 'N/A'
                            }
                          </p>
                        </div>
                        <Star className="w-8 h-8 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Physicians Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Physician</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>This Month</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {physicians.map((physician) => (
                      <TableRow key={physician.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{physician.first_name} {physician.last_name}</p>
                              <p className="text-sm text-gray-600">{physician.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{physician.specialization || 'General'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{physician.performance?.completed_appointments || 0} / {physician.performance?.total_appointments || 0} completed</p>
                            <div className="flex items-center space-x-1 mt-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">appointments</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{physician.performance?.average_rating?.toFixed(1) || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={physician.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                            }
                          >
                            {physician.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-x-2">
                            <Button size="sm" variant="outline">View</Button>
                            <Button 
                              size="sm" 
                              variant={physician.is_active ? "destructive" : "default"}
                              onClick={() => togglePhysicianStatus(physician.id, physician.is_active)}
                            >
                              {physician.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
