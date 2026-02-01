import { FileText, HardDrive, File, Calendar, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface DocumentStatsProps {
  documents: any[];
}

export function DocumentStats({ documents }: DocumentStatsProps) {
  const totalDocuments = documents?.length || 0;
  const totalSize =
    documents?.reduce((sum, doc) => sum + (doc.size_bytes || 0), 0) || 0;

  // Group by document type
  const typeGroups =
    documents?.reduce<Record<string, number>>((acc, doc) => {
      const type = doc.document_type || "OTHER";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}) || {};

  // Get most common types
  const topTypes = Object.entries(typeGroups)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5);

  // Format total size
  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    } else if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${bytes} B`;
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เอกสารทั้งหมด</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments}</div>
            <p className="text-xs text-slate-500 mt-1">Total files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ขนาดรวม</CardTitle>
            <HardDrive className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatSize(totalSize)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Storage used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ประเภทเอกสาร</CardTitle>
            <File className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(typeGroups).length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Document types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อัพโหลดล่าสุด</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {documents && documents.length > 0
                ? format(new Date(documents[0].created_at), "d MMM", {
                    locale: th,
                  })
                : "-"}
            </div>
            <p className="text-xs text-slate-500 mt-1">Latest upload</p>
          </CardContent>
        </Card>
      </div>

      {topTypes.length > 0 && (
        <Card className="bg-linear-to-r from-purple-50 to-blue-50 border-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-slate-900">
                ประเภทเอกสารยอดนิยม
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {topTypes.map(([type, count]) => (
                <Badge
                  key={type}
                  variant="outline"
                  className="bg-white border-purple-200 text-purple-700"
                >
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
