export const columns = [
  {
    accessorKey: "root_url",
    header: "Site",
    cell: ({ row }) => <div className="font-medium">{row.getValue("root_url")}</div>,
  },
  {
    accessorKey: "cookies",
    header: "Cookies",
    cell: ({ row }) => {
      const cookies = row.getValue("cookies") || [];
      return cookies.length;
    },
  },
  {
    accessorKey: "local_storage",
    header: "Local Storage",
    cell: ({ row }) => Object.keys(row.getValue("local_storage") || {}).length,
  },
  {
    accessorKey: "indexeddb",
    header: "IndexedDB",
    cell: ({ row }) => row.getValue("indexeddb")?.length || 0,
  },
  {
    accessorKey: "timestamp",
    header: "Visited On",
    cell: ({ row }) => new Date(row.getValue("timestamp")).toLocaleString(),
  },
];