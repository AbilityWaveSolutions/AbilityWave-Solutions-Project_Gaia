import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlantSchema, InsertPlant, Row } from "@shared/schema";
import { useCreatePlant, useRows, useCropSheets } from "@/hooks/use-gaia";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Sprout } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CreatePlantDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createPlant = useCreatePlant();
  
  const { data: rows } = useRows();
  const { data: cropSheets } = useCropSheets();

  const form = useForm<InsertPlant>({
    resolver: zodResolver(insertPlantSchema),
    defaultValues: {
      status: "Active",
    },
  });

  const onSubmit = (data: InsertPlant) => {
    // Generate code: {RowLetter}{Number}
    const selectedRow = rows?.find((r: Row) => r.id === data.rowId);
    if (!selectedRow) {
      toast({ title: "Error", description: "Please select a valid row", variant: "destructive" });
      return;
    }
    
    const plantCode = `${selectedRow.letter}${data.number}`;
    
    createPlant.mutate({ ...data, code: plantCode }, {
      onSuccess: () => {
        toast({ title: "Success", description: `Plant ${plantCode} created successfully.` });
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
          <Plus className="w-4 h-4 mr-2" /> Add Plant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sprout className="w-5 h-5 text-primary" />
            </div>
            Add New Plant
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rowId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Row</FormLabel>
                    <Select 
                      onValueChange={(val) => field.onChange(parseInt(val))} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Row" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rows?.map((row: Row) => (
                          <SelectItem key={row.id} value={row.id.toString()}>
                            Row {row.letter}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
                        placeholder="1, 2, 3..." 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cropSheetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crop Sheet</FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(val ? parseInt(val) : null)} 
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Crop Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cropSheets?.map((sheet) => (
                        <SelectItem key={sheet.id} value={sheet.id.toString()}>
                          {sheet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full mt-4" 
              disabled={createPlant.isPending}
            >
              {createPlant.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                "Create Plant Unit"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
