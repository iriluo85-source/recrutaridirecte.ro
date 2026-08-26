"use client";

import { useEffect } from "react";
import { recordProfileViewAction } from "../../actions";

export default function RecordProfileView({ candidateId }: { candidateId: string }) {
  useEffect(() => {
    // se declanșează doar la montarea reală a paginii, nu la prefetch/render
    recordProfileViewAction(candidateId);
  }, [candidateId]);

  return null;
}
