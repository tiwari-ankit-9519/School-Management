"use client";

import { useParams } from "next/navigation";

const AdmissionApplicationDetailsPage = () => {
  const params = useParams();
  const id = params?.id as string;
  return <div>{id}</div>;
};
export default AdmissionApplicationDetailsPage;
