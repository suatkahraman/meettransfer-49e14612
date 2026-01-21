/**
 * AgencyReservationPaymentPanel - Agency-facing payment panel
 * 
 * This is a convenience wrapper around UnifiedPaymentPanel
 * with Turkish defaults and payment link visibility.
 */

import { memo } from "react";
import { 
  UnifiedPaymentPanel, 
  TURKISH_TRANSLATIONS,
  type UnifiedPaymentPanelProps,
  type PaymentPanelTranslations,
} from "@/components/payments/UnifiedPaymentPanel";

export interface AgencyReservationPaymentPanelProps extends Omit<UnifiedPaymentPanelProps, 'showPaymentLink'> {
  translations?: PaymentPanelTranslations;
}

export const AgencyReservationPaymentPanel = memo(({
  translations,
  ...props
}: AgencyReservationPaymentPanelProps) => {
  return (
    <UnifiedPaymentPanel
      {...props}
      translations={{
        ...TURKISH_TRANSLATIONS,
        ...translations,
      }}
      showPaymentLink={true}
    />
  );
});

AgencyReservationPaymentPanel.displayName = 'AgencyReservationPaymentPanel';

export default AgencyReservationPaymentPanel;
