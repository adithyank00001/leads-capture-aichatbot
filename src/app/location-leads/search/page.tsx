import { LocationLeadsSearchPanel } from "@/components/location-leads/location-leads-search-panel";

type SearchPageProps = {
  searchParams: Promise<{ searchId?: string }>;
};

export default async function LocationLeadsSearchPage({
  searchParams,
}: SearchPageProps) {
  const { searchId } = await searchParams;
  return <LocationLeadsSearchPanel initialSearchId={searchId} />;
}
