import { Suspense } from "react";
import { getServices } from "@/features/services/actions";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ServiceForm } from "@/features/admin/components/ServiceForm";
import { ServicesTable } from "@/features/admin/components/ServicesTable";

export const dynamic = "force-dynamic";

async function ServicesContent() {
  const services = await getServices(true); // Include inactive

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Service Showcase"
        subtitle="Manage your services (Interior, Moving, etc.) and galleries."
        icon="layout"
        count={services.length}
        actionSlot={
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Service</DialogTitle>
              </DialogHeader>
              <ServiceForm />
            </DialogContent>
          </Dialog>
        }
        gradient="blue"
      />

      <ServicesTable services={services} />
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div>Loading services...</div>}>
      <ServicesContent />
    </Suspense>
  );
}
