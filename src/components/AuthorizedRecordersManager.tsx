import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Trash2, Edit2, Check, X, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Recorder {
  id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export const AuthorizedRecordersManager = () => {
  const [recorders, setRecorders] = useState<Recorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const fetchRecorders = async () => {
    try {
      const { data, error } = await supabase
        .from('authorized_recorders')
        .select('*')
        .order('name');

      if (error) throw error;
      setRecorders(data || []);
    } catch (error) {
      console.error('Error fetching recorders:', error);
      toast.error('Failed to load recorders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecorders();

    const channel = supabase
      .channel('recorders-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'authorized_recorders'
        },
        () => {
          fetchRecorders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('authorized_recorders')
        .insert({
          name: newName.trim(),
          phone: newPhone.trim() || null,
          is_active: true
        });

      if (error) throw error;

      toast.success('Recorder added successfully');
      setNewName("");
      setNewPhone("");
      fetchRecorders();
    } catch (error: any) {
      console.error('Error adding recorder:', error);
      if (error.code === '23505') {
        toast.error('A recorder with this name already exists');
      } else {
        toast.error('Failed to add recorder');
      }
    }
  };

  const handleEdit = (recorder: Recorder) => {
    setEditingId(recorder.id);
    setEditName(recorder.name);
    setEditPhone(recorder.phone || "");
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('authorized_recorders')
        .update({
          name: editName.trim(),
          phone: editPhone.trim() || null
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Recorder updated successfully');
      setEditingId(null);
      fetchRecorders();
    } catch (error: any) {
      console.error('Error updating recorder:', error);
      if (error.code === '23505') {
        toast.error('A recorder with this name already exists');
      } else {
        toast.error('Failed to update recorder');
      }
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('authorized_recorders')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Recorder ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchRecorders();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('authorized_recorders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Recorder deleted successfully');
      fetchRecorders();
    } catch (error) {
      console.error('Error deleting recorder:', error);
      toast.error('Failed to delete recorder');
    }
  };

  if (loading) {
    return <Card><CardContent className="py-8 text-center">Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Authorized Payment Recorders
        </CardTitle>
        <CardDescription>
          Manage the list of people authorized to record payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Recorder */}
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add New Recorder
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Name (required)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              placeholder="Phone (optional)"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
            <Button onClick={handleAdd} className="w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Recorder
            </Button>
          </div>
        </div>

        {/* Recorders Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recorders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No recorders found. Add your first recorder above.
                  </TableCell>
                </TableRow>
              ) : (
                recorders.map((recorder) => (
                  <TableRow key={recorder.id}>
                    <TableCell>
                      {editingId === recorder.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8"
                        />
                      ) : (
                        <span className="font-medium">{recorder.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === recorder.id ? (
                        <Input
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="h-8"
                        />
                      ) : (
                        <span className="text-muted-foreground">{recorder.phone || '-'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={recorder.is_active ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggleActive(recorder.id, recorder.is_active)}
                      >
                        {recorder.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(recorder.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === recorder.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdate(recorder.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(recorder)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(recorder.id, recorder.name)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>• Active recorders can be selected when recording payments</p>
          <p>• Click on the status badge to toggle between Active/Inactive</p>
          <p>• Inactive recorders are hidden from the payment recording form</p>
        </div>
      </CardContent>
    </Card>
  );
};
