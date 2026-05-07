"use client";
import { useParams } from "next/navigation";

const ClassId = () => {
  const { id } = useParams();
  return <div>{id}</div>;
};
export default ClassId;
