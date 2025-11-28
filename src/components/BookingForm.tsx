import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, Users, Car, ArrowRight } from "lucide-react";

export const BookingForm = () => {
  const [passengers, setPassengers] = useState(2);

  return (
    <section className="py-16 px-4 -mt-20 relative z-20">
      <div className="container max-w-5xl mx-auto">
        <Card className="p-6 md:p-8 shadow-2xl border-0 bg-card backdrop-blur-sm">
          <Tabs defaultValue="airport" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 h-12 bg-muted/50">
              <TabsTrigger value="airport" className="text-base font-semibold">
                Airport Transfer
              </TabsTrigger>
              <TabsTrigger value="hourly" className="text-base font-semibold">
                Hourly Booking
              </TabsTrigger>
            </TabsList>

            <TabsContent value="airport" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="from" className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    From
                  </Label>
                  <Input
                    id="from"
                    placeholder="Airport or Address"
                    className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="to" className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    To
                  </Label>
                  <Input
                    id="to"
                    placeholder="Hotel or Destination"
                    className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flight" className="text-sm font-semibold">
                    Flight Code
                  </Label>
                  <Input
                    id="flight"
                    placeholder="e.g. TK1234"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Pickup Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time" className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Pickup Time
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle" className="text-sm font-semibold flex items-center gap-2">
                    <Car className="h-4 w-4 text-primary" />
                    Vehicle
                  </Label>
                  <Select defaultValue="standard">
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Van - 7 passengers</SelectItem>
                      <SelectItem value="firstclass">First Class Van - 7 passengers</SelectItem>
                      <SelectItem value="minibus12">Minibus - 12 passengers</SelectItem>
                      <SelectItem value="minibus16">Minibus - 16 passengers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passengers" className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Passengers
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11"
                      onClick={() => setPassengers(Math.max(1, passengers - 1))}
                    >
                      -
                    </Button>
                    <Input
                      id="passengers"
                      type="number"
                      value={passengers}
                      onChange={(e) => setPassengers(parseInt(e.target.value) || 1)}
                      className="h-11 text-center"
                      min="1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11"
                      onClick={() => setPassengers(passengers + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Payment Method</Label>
                  <Select defaultValue="cash">
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 Cash to Driver</SelectItem>
                      <SelectItem value="online">💳 Online Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <Button size="lg" className="w-full h-12 text-base font-semibold" variant="premium">
                  Request Booking
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="hourly" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="hourly-date" className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Date
                  </Label>
                  <Input
                    id="hourly-date"
                    type="date"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start-time" className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Start Time
                  </Label>
                  <Input
                    id="start-time"
                    type="time"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourly-vehicle" className="text-sm font-semibold flex items-center gap-2">
                    <Car className="h-4 w-4 text-primary" />
                    Vehicle
                  </Label>
                  <Select defaultValue="standard">
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Van</SelectItem>
                      <SelectItem value="firstclass">First Class Van</SelectItem>
                      <SelectItem value="minibus12">Minibus 12-Seater</SelectItem>
                      <SelectItem value="minibus16">Minibus 16-Seater</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours" className="text-sm font-semibold">Hours</Label>
                  <Select defaultValue="2">
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="6">6 hours</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-6 border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-lg">Estimated Price</span>
                  <span className="text-2xl font-bold text-primary">€120</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Price is per vehicle, minimum 2 hours booking required.
                </p>
              </div>

              <Button size="lg" className="w-full h-12 text-base font-semibold" variant="premium">
                Request Booking
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </section>
  );
};