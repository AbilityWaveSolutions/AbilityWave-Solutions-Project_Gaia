import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUpdatePlantHealth, useCropSheets } from "@/hooks/use-gaia";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PlantWithDetails, HealthStatusType } from "@shared/schema";

interface UpdateHealthDialogProps {
  plant: PlantWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const updateSchema = z.object({
  statusId: z.number(),
  notes: z.string().optional(),
});

type UpdateForm = z.infer<typeof updateSchema>;

export function UpdateHealthDialog({ plant, open, onOpenChange }: UpdateHealthDialogProps) {
  const { toast } = useToast();
  const updateHealth = useUpdatePlantHealth();
  const { data: cropSheets } = useCropSheets();

  // Find statuses relevant to this plant's crop sheet
  const currentSheet = cropSheets?.find(s => s.id === plant?.cropSheetId);
  const availableStatuses = currentSheet?.healthStatuses || [];

  const form = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      notes: "",
    },
  });

  const onSubmit = (data: UpdateForm) => {
    if (!plant) return;

    updateHealth.mutate({ 
      id: plant.id, 
      statusId: data.statusId, 
      notes: data.notes 
    }, {
      onSuccess: () => {
        toast({ title: "Updated", description: `Health status updated for ${plant.code}` });
        onOpenChange(false);
        form.reset();
      },
      onError: (error) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    });
  };

  if (!plant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            Update Status: <span className="text-primary">{plant.code}</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            
            <FormField
              control={form.control}
              name="statusId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Health Status</FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(parseInt(val))}
                    defaultValue={plant.currentHealth?.statusId.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableStatuses.length > 0 ? (
                        availableStatuses.map((status: HealthStatusType) => (
                          <SelectItem key={status.id} value={status.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                              {status.displayName}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground">No statuses found for this crop sheet</div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observations</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Leaf discoloration, growth rate, etc."
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={updateHealth.isPending || availableStatuses.length === 0}>
              {updateHealth.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Update"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
