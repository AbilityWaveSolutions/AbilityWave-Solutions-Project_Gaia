import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRowSchema, InsertRow } from "@shared/schema";
import { useCreateRow } from "@/hooks/use-gaia";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, GripHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CreateRowDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createRow = useCreateRow();

  const form = useForm<InsertRow>({
    resolver: zodResolver(insertRowSchema),
    defaultValues: {
      letter: "",
    },
  });

  const onSubmit = (data: InsertRow) => {
    createRow.mutate(data, {
      onSuccess: () => {
        toast({ title: "Success", description: `Row ${data.letter} created.` });
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
        <Button variant="outline" className="border-dashed">
          <Plus className="w-4 h-4 mr-2" /> Add Row
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GripHorizontal className="w-5 h-5 text-primary" />
            </div>
            Add New Row
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="letter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Row Letter</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="A, B, C..." className="uppercase" maxLength={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={createRow.isPending}>
              {createRow.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Create Row"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
