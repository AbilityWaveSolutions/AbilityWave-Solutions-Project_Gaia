import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCropSheetSchema, InsertCropSheet } from "@shared/schema";
import { useCreateCropSheet } from "@/hooks/use-gaia";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CreateCropSheetDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createSheet = useCreateCropSheet();

  const form = useForm<InsertCropSheet>({
    resolver: zodResolver(insertCropSheetSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  const onSubmit = (data: InsertCropSheet) => {
    createSheet.mutate(data, {
      onSuccess: () => {
        toast({ title: "Success", description: "Crop sheet created with default health statuses." });
        setOpen(false);
        form.reset();
      },
      onError: (error) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Add Crop Sheet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            New Crop Sheet
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sheet Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Summer Lettuce 2024" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ""} 
                      placeholder="Details about this crop cycle..." 
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={createSheet.isPending}>
              {createSheet.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Create Crop Sheet"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
