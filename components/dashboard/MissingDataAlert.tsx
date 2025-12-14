import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MISSING_DATA_STATS } from "@/lib/dashboard-data";
import { Database, ImageOff, PhoneOff, Wallet } from "lucide-react";

export function MissingDataAlert() {
  return (
    <Card className="shadow-sm h-full border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <Database className="h-4 w-4" />
          ข้อมูลไม่ครบ
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(MISSING_DATA_STATS).map(([key, count]) => {
            if (count === 0) return null;
            
            let label = "";
            let icon = null;
            
            switch(key) {
               case "noPhone": 
                 label = "ไม่มีเบอร์โทร"; 
                 icon = <PhoneOff className="h-3 w-3" />;
                 break;
               case "noPhotos": 
                 label = "ไม่มีรูปภาพ"; 
                 icon = <ImageOff className="h-3 w-3" />;
                 break;
               case "noBudget": 
                 label = "ไม่ระบุงบ"; 
                 icon = <Wallet className="h-3 w-3" />;
                 break;
               default: label = key;
            }

            return (
              <div key={key} className="flex items-center justify-between text-sm bg-white dark:bg-card p-2 rounded border border-yellow-100 dark:border-yellow-900/50">
                 <div className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
                    {icon}
                    <span>{label}</span>
                 </div>
                 <span className="font-bold text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900 px-2 rounded-full text-xs">
                    {count}
                 </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
