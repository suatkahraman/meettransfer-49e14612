import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, CheckCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import WebsiteLayout from "@/components/website/WebsiteLayout";

const CustomerReviewPage = () => {
  const { reservationId } = useParams<{ reservationId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [reservation, setReservation] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!reservationId) return;
    fetchReservationAndReview();
  }, [reservationId, user]);

  const fetchReservationAndReview = async () => {
    try {
      setLoading(true);

      // Fetch reservation with driver info
      const { data: reservationData, error: reservationError } = await supabase
        .from("reservations")
        .select(`
          *,
          drivers:driver_id (
            id,
            name,
            vehicle_model,
            plate_number
          )
        `)
        .eq("id", reservationId)
        .single();

      if (reservationError) {
        console.error("Error fetching reservation:", reservationError);
        toast({
          title: "Error",
          description: "Reservation not found",
          variant: "destructive",
        });
        return;
      }

      setReservation(reservationData);
      setDriver(reservationData.drivers);

      // Check if review already exists
      const { data: reviewData } = await supabase
        .from("driver_reviews")
        .select("*")
        .eq("reservation_id", reservationId)
        .single();

      if (reviewData) {
        setExistingReview(reviewData);
        setRating(reviewData.rating);
        setComment(reviewData.comment || "");
        setSubmitted(true);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !reservation || !driver || rating === 0) {
      toast({
        title: t('pleaseSelectRating'),
        description: t('ratingRequired'),
        variant: "destructive",
      });
      return;
    }

    if (reservation.status !== "completed") {
      toast({
        title: t('cannotSubmitReview'),
        description: t('reviewsOnlyForCompleted'),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("driver_reviews").insert({
        reservation_id: reservationId,
        driver_id: driver.id,
        customer_id: user.id,
        rating,
        comment: comment.trim() || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: t('reviewAlreadySubmitted'),
            description: t('reviewAlreadySubmitted'),
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      setSubmitted(true);
      toast({
        title: t('thankYou'),
        description: t('reviewSubmittedSuccess'),
      });
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: t('cannotSubmitReview'),
        description: t('failedToSubmitReview'),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <WebsiteLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </WebsiteLayout>
    );
  }

  if (!reservation) {
    return (
      <WebsiteLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">{t('reservationNotFound')}</p>
              <Button onClick={() => navigate("/")}>{t('goToHome')}</Button>
            </CardContent>
          </Card>
        </div>
      </WebsiteLayout>
    );
  }

  return (
    <WebsiteLayout>
      <div className="min-h-[60vh] py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/customer/bookings")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('backToMyReservations')}
          </Button>

          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">
                {submitted ? t('thankYou') : t('rateYourDriver')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {submitted ? (
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  </div>
                  <p className="text-muted-foreground">
                    {t('reviewSubmittedSuccess')}
                  </p>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex justify-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-6 w-6 ${
                            star <= rating
                              ? "fill-accent text-accent"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    {existingReview?.comment && (
                      <p className="text-sm text-muted-foreground italic">
                        "{existingReview.comment}"
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Reservation Info */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('reservation')}:</span>
                      <span className="font-semibold">{reservation.reservation_code}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('date')}:</span>
                      <span>{reservation.pickup_date}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('route')}:</span>
                      <span className="text-right">{reservation.pickup} → {reservation.dropoff}</span>
                    </div>
                  </div>

                  {driver && (
                    <div className="text-center py-4 border-y">
                      <p className="text-sm text-muted-foreground mb-1">{t('yourDriver')}</p>
                      <p className="text-xl font-semibold">{driver.name}</p>
                      {driver.vehicle_model && (
                        <p className="text-sm text-muted-foreground">
                          {driver.vehicle_model} • {driver.plate_number}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      {t('howWouldYouRate')}
                    </p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-transform hover:scale-110 focus:outline-none"
                        >
                          <Star
                            className={`h-10 w-10 transition-colors ${
                              star <= (hoverRating || rating)
                                ? "fill-accent text-accent"
                                : "text-muted-foreground/30 hover:text-muted-foreground/50"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {rating === 5 && t('excellent')}
                        {rating === 4 && t('veryGood')}
                        {rating === 3 && t('good')}
                        {rating === 2 && t('fair')}
                        {rating === 1 && t('poor')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      {t('additionalComments')}
                    </label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t('tellUsAboutExperience')}
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {comment.length}/500
                    </p>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={rating === 0 || submitting}
                    className="w-full"
                    size="lg"
                  >
                    {submitting ? t('submittingReview') : t('submitReview')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </WebsiteLayout>
  );
};

export default CustomerReviewPage;
