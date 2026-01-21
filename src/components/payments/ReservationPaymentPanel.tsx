/**
 * ReservationPaymentPanel - Customer-facing payment panel
 * 
 * This is a convenience wrapper around UnifiedPaymentPanel
 * with English defaults for customer reservations.
 */

import { memo } from "react";
import { UnifiedPaymentPanel, type UnifiedPaymentPanelProps } from "./UnifiedPaymentPanel";

export interface ReservationPaymentPanelProps extends Omit<UnifiedPaymentPanelProps, 'showPaymentLink'> {}

export const ReservationPaymentPanel = memo((props: ReservationPaymentPanelProps) => {
  return (
    <UnifiedPaymentPanel
      {...props}
      showPaymentLink={false}
    />
  );
});

ReservationPaymentPanel.displayName = 'ReservationPaymentPanel';

export default ReservationPaymentPanel;
