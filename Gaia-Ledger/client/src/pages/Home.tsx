import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Sprout, 
  Leaf, 
  LayoutGrid, 
  Map, 
  Search, 
  Filter, 
  MoreHorizontal,
  FileSpreadsheet
} from "lucide-react";
import { usePlants, useRows, useCropSheets } from "@/hooks/use-gaia";
import { CreatePlantDialog } from "@/components/CreatePlantDialog";
import { CreateRowDialog } from "@/components/CreateRowDialog";
import { CreateCropSheetDialog } from "@/components/CreateCropSheetDialog";
import { UpdateHealthDialog } from "@/components/UpdateHealthDialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { PlantWithDetails, Row } from "@shared/schema";
import { format } from "date-fns";

export default function Home() {
  const { data: plants, isLoading: plantsLoading } = usePlants();
  const { data: rows } = useRows();
  const { data: cropSheets } = useCropSheets();
  const [selectedPlant, setSelectedPlant] = useState<PlantWithDetails | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredPlants = plants?.filter((plant: any) => 
    plant.code.toLowerCase().includes(search.toLowerCase()) || 
    plant.cropSheet?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handlePlantClick = (plant: PlantWithDetails) => {
    setSelectedPlant(plant);
    setIsUpdateDialogOpen(true);
  };

  if (plantsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading Gaia Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Gaia Ledger</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center text-sm text-muted-foreground bg-gray-100 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              System Operational
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              GL
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="map" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList className="bg-white p-1 shadow-sm border rounded-xl h-12">
              <TabsTrigger value="map" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-4 h-10">
                <Map className="w-4 h-4 mr-2" /> Field Map
              </TabsTrigger>
              <TabsTrigger value="units" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-4 h-10">
                <LayoutGrid className="w-4 h-4 mr-2" /> Units
              </TabsTrigger>
              <TabsTrigger value="sheets" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg px-4 h-10">
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Crop Sheets
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <CreatePlantDialog />
            </div>
          </div>

          {/* FIELD MAP TAB */}
          <TabsContent value="map" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Legend & Stats */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">Health Legend</CardTitle>
                    <CardDescription>Status indicators</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "Healthy", color: "#22c55e" },
                      { label: "Dehydrated", color: "#eab308" },
                      { label: "Pest", color: "#ef4444" },
                      { label: "Nutrient", color: "#f97316" },
                      { label: "Fungus", color: "#78350f" },
                      { label: "Unknown", color: "#9ca3af" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 font-medium">{item.label}</span>
                        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-primary text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Sprout className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="text-primary-foreground/80 text-sm font-medium">Total Active Plants</p>
                        <h3 className="text-3xl font-bold">{plants?.length || 0}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Map Grid */}
              <div className="lg:col-span-3 space-y-6">
                {rows?.map((row: Row) => (
                  <div key={row.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <span className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-500">ROW</span>
                        {row.letter}
                      </h3>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {plants?.filter((p: any) => p.rowId === row.id).length} Plants
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      {plants
                        ?.filter((p: any) => p.rowId === row.id)
                        .sort((a: any, b: any) => a.number - b.number)
                        .map((plant: PlantWithDetails) => (
                          <button
                            key={plant.id}
                            onClick={() => handlePlantClick(plant)}
                            className="group relative w-16 h-16 rounded-lg transition-all hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex flex-col items-center justify-center gap-1"
                            style={{ 
                              backgroundColor: plant.currentHealth?.status?.color || '#9ca3af',
                              color: '#fff' 
                            }}
                          >
                            <span className="font-bold text-sm drop-shadow-md">{plant.code}</span>
                            {/* Hover Details Tooltip-like */}
                            <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10 transition-opacity pointer-events-none">
                              {plant.currentHealth?.status?.displayName || "Unknown"}
                            </div>
                          </button>
                        ))}
                        
                        {/* Empty state filler for row */}
                        {plants?.filter((p: any) => p.rowId === row.id).length === 0 && (
                          <div className="w-full h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm font-medium">
                            No plants in this row
                          </div>
                        )}
                    </div>
                  </div>
                ))}
                
                {(!rows || rows.length === 0) && (
                  <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                    <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LayoutGrid className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No Rows Configured</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mt-2 mb-6">Start by creating rows to organize your field map.</p>
                    <CreateRowDialog />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* UNITS (PLANTS) TAB */}
          <TabsContent value="units">
            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Plant Inventory</CardTitle>
                  <CardDescription>Manage all individual plant units</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search units..."
                      className="pl-8 w-[250px]"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Row</TableHead>
                        <TableHead>Crop Type</TableHead>
                        <TableHead>Health Status</TableHead>
                        <TableHead>Last Checked</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlants?.map((plant: PlantWithDetails) => (
                        <TableRow key={plant.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                                {plant.code.substring(0, 1)}
                              </div>
                              {plant.code}
                            </div>
                          </TableCell>
                          <TableCell>Row {plant.row.letter}</TableCell>
                          <TableCell>{plant.cropSheet?.name || "—"}</TableCell>
                          <TableCell>
                            <StatusBadge status={plant.currentHealth?.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {plant.currentHealth?.lastChecked 
                              ? format(new Date(plant.currentHealth.lastChecked), "MMM d, h:mm a") 
                              : "Never"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handlePlantClick(plant)}
                            >
                              Update
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredPlants?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No plants found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CROP SHEETS TAB */}
          <TabsContent value="sheets">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="col-span-full flex justify-end">
                <CreateCropSheetDialog />
              </div>
              
              {cropSheets?.map((sheet: any) => (
                <Card key={sheet.id} className="card-hover overflow-hidden border-none shadow-md">
                  <div className="h-2 bg-primary w-full" />
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{sheet.name}</CardTitle>
                      <Badge variant={sheet.isActive ? "default" : "secondary"}>
                        {sheet.isActive ? "Active" : "Archived"}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2 mt-2">
                      {sheet.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Health Profiles</h4>
                        <div className="flex flex-wrap gap-2">
                          {sheet.healthStatuses?.map((status: any) => (
                            <div 
                              key={status.id}
                              className="text-xs px-2 py-1 rounded-md border bg-gray-50 flex items-center gap-1.5"
                            >
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                              {status.displayName}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t flex justify-between items-center text-sm text-muted-foreground">
                        <span>Created {format(new Date(sheet.createdAt), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* UPDATE DIALOG */}
      <UpdateHealthDialog 
        plant={selectedPlant} 
        open={isUpdateDialogOpen} 
        onOpenChange={setIsUpdateDialogOpen} 
      />
    </div>
  );
}
