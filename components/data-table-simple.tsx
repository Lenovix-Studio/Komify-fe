import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => React.ReactNode;
}

interface SimpleDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  selectedId?: string | number | null;
  idKey?: keyof T;
  emptyText?: string;
}

export function SimpleDataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  selectedId,
  idKey = "id",
  emptyText = "No data available",
}: SimpleDataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            {columns.map((col, idx) => (
              <TableHead key={idx} className="font-semibold text-foreground">
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => {
              const isSelected = selectedId && row[idKey] === selectedId;
              return (
                <TableRow
                  key={row[idKey] ?? index}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    onRowClick ? "cursor-pointer hover:bg-muted/60" : ""
                  } ${isSelected ? "bg-primary/10 hover:bg-primary/15" : ""}`}
                >
                  {columns.map((col, cIdx) => (
                    <TableCell key={cIdx}>
                      {col.cell
                        ? col.cell(row)
                        : (row[col.accessorKey as keyof T] as React.ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
