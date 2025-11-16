"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAdvocatesQuery } from "@/hooks/useAdvocatesQuery";
import type { Advocate } from "@/lib/advocates";

// Basic phone formatter so the numeric data we store is easier to skim/click.
const formatPhoneNumber = (value: number) => {
  const digits = value.toString().padStart(10, "0");
  const numericLink = digits.replace(/\D/g, "");
  const formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
    6,
    10
  )}`;

  return { formatted, numericLink };
};

type ViewMode = "table" | "cards";

/**
 * Present advocates in a mobile-friendly card view. Mirrors the data shown in the table
 * but adds CTAs + badges so discovery feels more personal on smaller screens.
 */
const AdvocateCard = ({ advocate }: { advocate: Advocate }) => {
  const { formatted, numericLink } = formatPhoneNumber(advocate.phoneNumber);

  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">
            {advocate.city}
          </p>
          <h3 className="text-xl font-semibold text-slate-900">
            {advocate.firstName} {advocate.lastName}
          </h3>
          <p className="text-sm text-slate-500">{advocate.degree}</p>
        </div>
        <Badge variant="brand">{advocate.yearsOfExperience}+ yrs</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {advocate.specialties.slice(0, 4).map((specialty, index) => (
          <Badge
            key={`${advocate.phoneNumber}-${specialty}-${index}`}
            variant="subtle"
          >
            {specialty}
          </Badge>
        ))}
        {advocate.specialties.length > 4 && (
          <Badge variant="outline">
            +{advocate.specialties.length - 4} more
          </Badge>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between pt-4">
        <div>
          <p className="text-xs uppercase text-slate-500">Phone</p>
          <a
            href={`tel:${numericLink}`}
            className="text-lg font-semibold text-brand-700 hover:text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            {formatted}
            <span className="sr-only">
              Call {advocate.firstName} {advocate.lastName}
            </span>
          </a>
        </div>
        <Button variant="secondary" size="sm">
          View profile
        </Button>
      </div>
    </Card>
  );
};

/**
 * Table row equivalent for virtualized view so desktops can skim high volumes
 * of advocates without rendering hundreds of DOM nodes.
 */
const AdvocateRow = ({ advocate }: { advocate: Advocate }) => {
  const { formatted, numericLink } = formatPhoneNumber(advocate.phoneNumber);

  return (
    <div className="grid gap-2 text-sm sm:grid-cols-[1fr_1fr_3fr_1fr] sm:items-center sm:gap-4">
      <div>
        <p className="font-semibold text-slate-900">
          {advocate.firstName} {advocate.lastName}
        </p>
        <p className="text-xs text-slate-500">
          {advocate.degree} · {advocate.city}
        </p>
      </div>
      <div className="text-sm text-slate-600">
        {advocate.yearsOfExperience}+ yrs experience
      </div>
      <div className="flex flex-wrap gap-2">
        {advocate.specialties.slice(0, 3).map((specialty, index) => (
          <Badge key={`${advocate.phoneNumber}-${specialty}-${index}`} variant="subtle">
            {specialty}
          </Badge>
        ))}
      </div>
      <div className="text-sm font-semibold text-brand-700">
        <a
          href={`tel:${numericLink}`}
          className="hover:text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          {formatted}
          <span className="sr-only">
            Call {advocate.firstName} {advocate.lastName}
          </span>
        </a>
      </div>
    </div>
  );
};

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
    refetch,
  } = useAdvocatesQuery({
    q: debouncedSearchTerm || undefined,
  });

  const advocates = useMemo<Advocate[]>(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);
  const total = data?.pages?.[0]?.meta.total ?? 0;
  const source = data?.pages?.[0]?.meta.source ?? "database";

  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? advocates.length + 1 : advocates.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88,
    overscan: 8,
  });
  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    // Prefetch the next page once users scroll near the end of the current data.
    const lastItem = virtualItems[virtualItems.length - 1];
    if (
      lastItem &&
      lastItem.index >= advocates.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [virtualItems, advocates.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const resultCountLabel =
    status === "success"
      ? `${total.toLocaleString()} ${total === 1 ? "advocate" : "advocates"}`
      : status === "pending"
      ? "Loading directory…"
      : "Directory unavailable";

  return (
    <main className="min-h-screen bg-hero-radial py-12 text-slate-900">
      <section className="container flex flex-col gap-8">
        <Card className="space-y-4">
          <header className="space-y-2">
            <Badge variant="brand">Advocate Directory</Badge>
            <h1 className="text-3xl font-semibold text-slate-900">
              Find the right advocate for your needs
            </h1>
            <p className="text-base text-slate-600">
              Search by name, specialty, location, or experience level to find
              the advocate who fits your goals. Our team supports telehealth and
              in-person care nationwide.
            </p>
          </header>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label
                htmlFor="advocate-search"
                className="text-sm font-medium text-slate-700"
              >
                Search by name, city, or specialty
              </label>
              <Input
                id="advocate-search"
                type="search"
                className="mt-2"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Try “trauma”, “San Francisco”, or “Dr. Taylor”"
                autoComplete="off"
              />
              {debouncedSearchTerm && (
                <p className="mt-2 text-sm text-slate-500">
                  Showing matches for “{debouncedSearchTerm}”
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => refetch()}
                disabled={status === "pending"}
              >
                Refresh
              </Button>
              <Button onClick={() => setViewMode("cards")} variant="ghost">
                {viewMode === "cards" ? "Card view active" : "Switch to cards"}
              </Button>
            </div>
          </div>
        </Card>

        <section className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500">
                Matching results
              </p>
              <p className="text-2xl font-semibold text-slate-900" aria-live="polite">
                {resultCountLabel}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">View:</span>
              <Button
                variant={viewMode === "table" ? "primary" : "secondary"}
                onClick={() => setViewMode("table")}
                size="sm"
              >
                Table
              </Button>
              <Button
                variant={viewMode === "cards" ? "primary" : "secondary"}
                onClick={() => setViewMode("cards")}
                size="sm"
              >
                Cards
              </Button>
            </div>
          </div>

          <Card className="p-0">
            <div className="border-b border-slate-100 px-4 sm:px-6">
              {status === "pending" && (
                <p className="text-sm text-slate-600" role="status" aria-live="polite">
                  Loading advocates…
                </p>
              )}
              {status === "error" && (
                <p className="text-sm text-rose-600" role="alert">
                  Something went wrong while loading advocates:{" "}
                  {(error as Error)?.message ?? "Unknown error"}
                </p>
              )}
              {status === "success" && advocates.length === 0 && (
                <p className="text-sm text-slate-600" role="status">
                  No advocates match your filters. Try adjusting your search term.
                </p>
              )}
            </div>

            {advocates.length > 0 && viewMode === "table" && (
              <div className="h-[70vh] overflow-hidden">
                <div
                  ref={parentRef}
                  className="h-full overflow-auto border-t border-slate-100"
                >
                  <div
                    style={{
                      height: rowVirtualizer.getTotalSize(),
                      width: "100%",
                      position: "relative",
                      padding: "0 16px",
                    }}
                  >
                    {virtualItems.map((virtualRow) => {
                      const isLoaderRow = virtualRow.index >= advocates.length;
                      const advocate = advocates[virtualRow.index];

                      return (
                        <div
                          key={virtualRow.key}
                          ref={rowVirtualizer.measureElement}
                          data-index={virtualRow.index}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualRow.start}px)`,
                            padding: "16px 0",
                            borderBottom: "1px solid #e2e8f0",
                            background:
                              virtualRow.index % 2 === 0 ? "#fff" : "#f8fafc",
                          }}
                        >
                          {isLoaderRow ? (
                            <p className="text-sm text-slate-500">
                              {hasNextPage
                                ? "Loading more advocates…"
                                : "You’re all caught up."}
                            </p>
                          ) : (
                            advocate && <AdvocateRow advocate={advocate} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {advocates.length > 0 && viewMode === "cards" && (
              <div className="grid gap-6 sm:p-6 sm:grid-cols-2 xl:grid-cols-3">
                {advocates.map((advocate) => (
                  <AdvocateCard key={advocate.phoneNumber} advocate={advocate} />
                ))}
                {hasNextPage && (
                  <div className="col-span-full text-center text-sm text-slate-500">
                    {isFetchingNextPage ? "Loading more…" : "Scroll to load more"}
                  </div>
                )}
              </div>
            )}
          </Card>
        </section>
      </section>
    </main>
  );
}
