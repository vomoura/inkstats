interface GroupedRow {
  name: string;
  winRate: number;
  winRateNoDraws: number;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  tournaments: number;
}

interface GroupedTableProps {
  data: GroupedRow[];
}

export function GroupedTable({ data }: GroupedTableProps) {
  const sorted = [...data].sort((a, b) => b.winRate - a.winRate);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted border-b border-border">
            <th className="pb-2 pr-4">Nome</th>
            <th className="pb-2 pr-4">Win Rate</th>
            <th className="pb-2 pr-4">Record</th>
            <th className="pb-2">Torneios</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.name} className="border-b border-border/50">
              <td className="py-2 pr-4 font-medium">{row.name}</td>
              <td className="py-2 pr-4">
                <span className="font-bold">{row.winRate}%</span>
                <span className="text-xs text-muted ml-1">({row.winRateNoDraws}%)</span>
              </td>
              <td className="py-2 pr-4 text-muted">
                {row.wins}W-{row.losses}L-{row.draws}D
              </td>
              <td className="py-2 text-muted">{row.tournaments}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
