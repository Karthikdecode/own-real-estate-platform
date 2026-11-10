import { LoadingState } from '@/components/feedback/loading-state';
import { Container } from '@/components/ui/container';

export default function Loading() {
  return (
    <Container className="py-12">
      <LoadingState label="Loading page…" skeletonLines={4} />
    </Container>
  );
}
