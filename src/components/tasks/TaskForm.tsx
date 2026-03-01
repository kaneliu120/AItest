import { useState } from 'react';

type Props = { onSubmit: (data: any) => Promise<{ success: boolean; message?: string }> };

export default function TaskForm({ onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setLoading(true);
        await onSubmit({ title, description: '', priority: 'medium' });
        setTitle('');
        setLoading(false);
      }}
      className="space-y-3"
    >
      <input className="w-full border rounded px-3 py-2" placeholder="任务标题" value={title} onChange={(e) => setTitle(e.target.value)} />
      <button disabled={loading} className="w-full bg-blue-600 text-white rounded px-3 py-2">{loading ? '创建中...' : '创建任务'}</button>
    </form>
  );
}
