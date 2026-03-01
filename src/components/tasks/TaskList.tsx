type Task = { id: string; title: string; status?: string; priority?: string };

type Props = {
  tasks: Task[];
  selectedIds?: string[];
  onToggleSelect?: (id: string, checked: boolean) => void;
  onUpdateStatus?: (id: string, status: string) => void;
};

export default function TaskList({ tasks, selectedIds = [], onToggleSelect, onUpdateStatus }: Props) {
  return (
    <div className="space-y-3">
      {tasks.map((t) => {
        const selected = selectedIds.includes(t.id);
        return (
          <div key={t.id} className="border rounded p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected}
                  onChange={(e) => onToggleSelect?.(t.id, e.target.checked)}
                />
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-sm text-gray-500">{t.status || 'pending'} · {t.priority || 'medium'}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onUpdateStatus?.(t.id, 'in-progress')} className="text-xs px-2 py-1 border rounded">In Progress</button>
                <button onClick={() => onUpdateStatus?.(t.id, 'completed')} className="text-xs px-2 py-1 border rounded">Complete</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
