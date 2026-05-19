import { Suspense } from 'react';
import GalaxieRoot from '@/components/galaxie/GalaxieRoot';

// Dev-only smoke-endpoint for Sprint G1. W4 either migrates this into `/` (galaxie as
// hero + AuditForm as secondary CTA) or removes this route. Until then, this is the
// surface the team uses to verify W1.7 / W2.7 / W3.7 / W4 gates.
export default function GalaxieDevPage() {
  return (
    <Suspense fallback={null}>
      <GalaxieRoot />
    </Suspense>
  );
}
