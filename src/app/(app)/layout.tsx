import PageWrapper from "@/components/layout/PageWrapper";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageWrapper>{children}</PageWrapper>;
}
