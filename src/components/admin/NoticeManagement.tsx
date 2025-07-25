
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type Notice = Database['public']['Tables']['notices']['Row'];
type NoticePriority = 'low' | 'normal' | 'high';

interface NoticeManagementProps {
  onBack: () => void;
  currentUserId: string;
}

export const NoticeManagement = ({ onBack, currentUserId }: NoticeManagementProps) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal' as NoticePriority
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load notices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingNotice) {
        const { error } = await supabase
          .from('notices')
          .update({
            title: formData.title,
            content: formData.content,
            priority: formData.priority,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingNotice.id);

        if (error) throw error;
        toast({ title: "Success", description: "Notice updated successfully" });
      } else {
        const { error } = await supabase
          .from('notices')
          .insert({
            title: formData.title,
            content: formData.content,
            priority: formData.priority,
            created_by: currentUserId
          });

        if (error) throw error;
        toast({ title: "Success", description: "Notice created successfully" });
      }

      setFormData({ title: '', content: '', priority: 'normal' });
      setIsCreateDialogOpen(false);
      setEditingNotice(null);
      fetchNotices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save notice",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      priority: (notice.priority || 'normal') as NoticePriority
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (noticeId: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;

    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', noticeId);

      if (error) throw error;
      toast({ title: "Success", description: "Notice deleted successfully" });
      fetchNotices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete notice",
        variant: "destructive",
      });
    }
  };

  const toggleNoticeStatus = async (notice: Notice) => {
    try {
      const { error } = await supabase
        .from('notices')
        .update({ is_active: !notice.is_active })
        .eq('id', notice.id);

      if (error) throw error;
      toast({ 
        title: "Success", 
        description: `Notice ${notice.is_active ? 'deactivated' : 'activated'} successfully` 
      });
      fetchNotices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update notice status",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Notice Management</h1>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingNotice(null);
              setFormData({ title: '', content: '', priority: 'normal' });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Notice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingNotice ? 'Edit Notice' : 'Create New Notice'}
                </DialogTitle>
                <DialogDescription>
                  {editingNotice ? 'Update the notice details below.' : 'Create a new notice for all users.'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="col-span-3"
                    placeholder="Notice title..."
                  />
                </div>
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="content" className="text-right mt-2">
                    Content *
                  </Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="col-span-3"
                    placeholder="Notice content..."
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="priority" className="text-right">
                    Priority
                  </Label>
                  <Select value={formData.priority} onValueChange={(value: NoticePriority) => setFormData({...formData, priority: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingNotice ? 'Update' : 'Create'} Notice
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notices</CardTitle>
          <CardDescription>
            Manage library notices and announcements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No notices found. Create your first notice!
            </div>
          ) : (
            <div className="space-y-4">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{notice.title}</h3>
                      <p className="text-gray-600 mb-3">{notice.content}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(notice.priority || 'normal')}>
                          {notice.priority?.charAt(0).toUpperCase() + notice.priority?.slice(1)} Priority
                        </Badge>
                        <Badge variant={notice.is_active ? 'default' : 'secondary'}>
                          {notice.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => toggleNoticeStatus(notice)}
                        variant="outline"
                        size="sm"
                      >
                        {notice.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        onClick={() => handleEdit(notice)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(notice.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Created: {formatDateTime(notice.created_at)}
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
