"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAdvocates, type Advocate } from "@/lib/advocates";
import { filterAdvocatesByTerm } from "@/lib/search";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

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

export default function Home() {
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [requestStatus, setRequestStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [requestError, setRequestError] = useState<string | null>(null);
  const debouncedSearchTerm = useDebouncedValue(searchTerm);

  useEffect(() => {
    const controller = new AbortController();

    const loadAdvocates = async () => {
      setRequestStatus("loading");
      setRequestError(null);
      try {
        const data = await fetchAdvocates(controller.signal);
        setAdvocates(data);
        setRequestStatus("success");
      } catch (error) {
        // AbortController prevents state updates if the component unmounts
        // while an in-flight request completes (common during route changes).
        if (controller.signal.aborted) return;

        console.error("Failed to fetch advocates", error);
        const message =
          error instanceof Error ? error.message : "Unexpected error";
        setRequestError(message);
        setRequestStatus("error");
      }
    };

    loadAdvocates();
    return () => controller.abort();
  }, []);

  // Filtering lives in a separate utility so we can reuse it in tests and keep
  // the component focused on rendering instead of string normalization logic.
  const filteredAdvocates = useMemo(() => {
    return filterAdvocatesByTerm(advocates, debouncedSearchTerm);
  }, [advocates, debouncedSearchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleResetSearch = () => {
    setSearchTerm("");
  };

  const shouldShowEmptyState =
    requestStatus === "success" && filteredAdvocates.length === 0;
  const hasResults = filteredAdvocates.length > 0;
  // We surface summaries + aria-live regions so patients understand what the
  // current view represents without needing to parse the whole table.
  const resultCountLabel =
    requestStatus === "success"
      ? `${filteredAdvocates.length.toLocaleString()} ${
          filteredAdvocates.length === 1 ? "advocate" : "advocates"
        }`
      : requestStatus === "loading"
      ? "Loading directory…"
      : "Directory unavailable";
  const searchDescription = debouncedSearchTerm
    ? `Filtering by “${debouncedSearchTerm}”`
    : "Showing every advocate in the directory";

  return (
    <main className="min-h-screen bg-slate-50 py-12 text-slate-900">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
            Advocate Directory
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
            Find the right advocate for your needs
          </h1>
          <p className="text-base text-slate-600">
            Search by name, specialty, city, or experience to discover the
            advocate who best fits your care preferences.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label
                htmlFor="advocate-search"
                className="text-sm font-medium text-slate-700"
              >
                Search advocates
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  id="advocate-search"
                  type="search"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search name, city, specialty..."
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={handleResetSearch}
                  disabled={!searchTerm}
                  className="inline-flex items-center justify-center rounded-lg border border-transparent bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500"
                >
                  Clear search
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-500" aria-live="polite">
                {searchDescription}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              <p
                className="text-lg font-semibold text-slate-900"
                aria-live="polite"
              >
                {resultCountLabel}
              </p>
              <p>matching your criteria</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            {requestStatus === "loading" && (
              <p
                className="text-sm text-slate-600"
                role="status"
                aria-live="polite"
              >
                Loading advocates…
              </p>
            )}
            {requestStatus === "error" && (
              <p className="text-sm text-rose-600" role="alert">
                Something went wrong while loading advocates: {requestError}
              </p>
            )}
            {shouldShowEmptyState && (
              <p className="text-sm text-slate-600" role="status">
                No advocates match “{debouncedSearchTerm}”. Try adjusting your
                search term.
              </p>
            )}
          </div>
            {hasResults && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <caption className="sr-only">
                    List of Solace advocates, including location, specialty, and
                    contact number.
                  </caption>
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      First Name
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Last Name
                    </th>
                    <th scope="col" className="px-4 py-3">
                      City
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Degree
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Specialties
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Years of Experience
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Phone Number
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdvocates.map((advocate) => {
                    const rowKey = `${advocate.firstName}-${advocate.lastName}-${advocate.phoneNumber}`;
                    const { formatted, numericLink } = formatPhoneNumber(
                      advocate.phoneNumber
                    );

                    return (
                      <tr
                        key={rowKey}
                        className="border-b border-slate-100 last:border-none odd:bg-white even:bg-slate-50"
                      >
                        <td className="px-4 py-4 text-sm font-medium text-slate-900">
                          {advocate.firstName}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {advocate.lastName}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {advocate.city}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {advocate.degree}
                        </td>
                        <td className="px-4 py-4">
                          {advocate.specialties.length > 0 ? (
                            <ul
                              className="flex flex-wrap gap-2"
                              aria-label="Specialties"
                            >
                              {advocate.specialties.map((specialty, index) => (
                                <li
                                  key={`${rowKey}-${specialty}-${index}`}
                                  className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800"
                                >
                                  {specialty}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-sm text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {advocate.yearsOfExperience}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-emerald-700">
                          <a
                            href={`tel:${numericLink}`}
                            className="hover:text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                          >
                            {formatted}
                            <span className="sr-only">
                              Call {advocate.firstName} {advocate.lastName}
                            </span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
