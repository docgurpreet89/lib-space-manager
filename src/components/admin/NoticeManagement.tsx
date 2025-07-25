import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export const NoticeManagement = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notices:', error);
    } else {
      setNotices(data || []);
    }
  };

  const handleAddNotice = async () => {
    if (!title.trim() || !content.trim()) return;

    setLoading(true);

    const { error } = await supabase.from('notices').insert({
      title,
      content
    });

    if (error) {
      console.error('Error adding notice:', error);
    } else {
      setTitle('');
      setContent('');
      fetchNotices();
    }

    setLoading(false);
  };

  const handleDeleteNotice = async (id: string) => {
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) {
      console.error('Error deleting notice:', error);
    } else {
      setNotices(notices.filter(n => n.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-4 shadow">
        <h3 className="text-lg font-semibold text-[#333] mb-2">Create Notice</h3>
        <div className="space-y-2">
          <Input
            placeholder="Notice Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="app-input"
          />
          <Textarea
            placeholder="Notice Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="app-input"
          />
          <Button
            onClick={handleAddNotice}
            disabled={loading}
            className="paytm-button w-full"
          >
            {loading ? 'Posting...' : 'Post Notice'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 shadow">
        <h3 className="text-lg font-semibold text-[#333] mb-2">Notices</h3>
        {notices.length === 0 ? (
          <p className="text-sm text-gray-500">No notices posted yet.</p>
        ) : (
          <ul className="space-y-2">
            {notices.map(notice => (
              <li key={notice.id} className="border rounded p-2 flex justify-between items-start">
                <div>
                  <div className="font-medium text-[#00B9F1]">{notice.title}</div>
                  <div className="text-sm text-gray-600">{notice.content}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(notice.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteNotice(notice.id)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
