"use client";

import { useParams } from "next/navigation";
import { Application } from "@/components/pages/user/application/component";

export default function ApplicationPage() {
  
  const params = useParams();
  const id = params.application as string;

  if (!id) {
    return null;
  }

  return (
    <>
      <Application id={id} />
    </>
  );
}