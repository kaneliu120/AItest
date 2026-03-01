type Props = { stats: any };

export default function TaskStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="bg-white rounded border p-3"><div className="text-xs text-gray-500">Total Tasks</div><div className="text-xl font-semibold">{stats?.totalTasks ?? 0}</div></div>
      <div className="bg-white rounded border p-3"><div className="text-xs text-gray-500">Pending</div><div className="text-xl font-semibold">{stats?.pendingTasks ?? 0}</div></div>
      <div className="bg-white rounded border p-3"><div className="text-xs text-gray-500">In Progress</div><div className="text-xl font-semibold">{stats?.inProgressTasks ?? 0}</div></div>
      <div className="bg-white rounded border p-3"><div className="text-xs text-gray-500">Completion Rate</div><div className="text-xl font-semibold">{stats?.completionRate ?? 0}%</div></div>
    </div>
  );
}
